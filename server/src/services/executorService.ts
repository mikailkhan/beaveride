import Docker from 'dockerode';
import tar from 'tar-stream';

const docker = new Docker();

export interface ProjectFilePayload {
  path: string;
  content: string;
}

interface LanguageConfig {
  image: string;
  filename: string;
  runCmd: string;
  runProjectCmd: (entryFilePath: string) => string;
  env?: string[];
  memoryLimit?: number;
}

const CONFIGS: Record<string, LanguageConfig> = {
  javascript: {
    image: 'node:18-alpine',
    filename: 'code.js',
    runCmd: 'node /tmp/code.js',
    runProjectCmd: (entryFilePath: string) => `node "${entryFilePath}"`,
    memoryLimit: 128 * 1024 * 1024, // 128MB
  },
  python: {
    image: 'python:3.10-alpine',
    filename: 'code.py',
    runCmd: 'python /tmp/code.py',
    runProjectCmd: (entryFilePath: string) => `python "${entryFilePath}"`,
    memoryLimit: 128 * 1024 * 1024, // 128MB
  },
  go: {
    image: 'golang:1.20-alpine',
    filename: 'code.go',
    runCmd: 'go run /tmp/code.go',
    runProjectCmd: (entryFilePath: string) => `go run "${entryFilePath}"`,
    env: ['GOCACHE=/tmp/go-cache', 'GOPATH=/tmp/go'],
    memoryLimit: 256 * 1024 * 1024, // 256MB
  },
};

async function createTarBuffer(files: ProjectFilePayload[]): Promise<Buffer> {
  const pack = tar.pack();
  for (const file of files) {
    pack.entry({ name: `workspace/${file.path}` }, file.content);
  }
  pack.finalize();

  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    pack.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    pack.on('end', () => resolve(Buffer.concat(chunks)));
    pack.on('error', reject);
  });
}

export class ExecutorService {
  private async ensureImage(image: string): Promise<void> {
    try {
      await docker.getImage(image).inspect();
    } catch {
      console.log(`Image ${image} not found locally, pulling...`);
      const stream = await docker.pull(image);
      await new Promise<void>((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`Image ${image} pulled successfully`);
    }
  }

  async executeCode(language: string, code: string): Promise<string> {
    const lang = language.toLowerCase();
    const config = CONFIGS[lang];
    if (!config) {
      return `Unsupported execution language: ${language}`;
    }

    return this.executeProject(language, [{ path: config.filename, content: code }], config.filename);
  }

  async executeProject(
    language: string,
    files: ProjectFilePayload[],
    entryFilePath: string
  ): Promise<string> {
    const lang = language.toLowerCase();
    const config = CONFIGS[lang];
    if (!config) {
      return `Unsupported execution language: ${language}`;
    }

    try {
      await this.ensureImage(config.image);
    } catch (err) {
      return `Docker Image Pull Error: ${(err as Error).message}`;
    }

    let tarBuffer: Buffer;
    try {
      tarBuffer = await createTarBuffer(files);
    } catch (err) {
      return `Tar Compression Error: ${(err as Error).message}`;
    }

    const base64Tar = tarBuffer.toString('base64');
    const unpackAndRunCmd = `echo "${base64Tar}" | base64 -d | tar -xf - -C /tmp && cd /tmp/workspace && ${config.runProjectCmd(entryFilePath)}`;

    let container: Docker.Container;
    try {
      container = (await docker.createContainer({
        Image: config.image,
        Cmd: ['sh', '-c', unpackAndRunCmd],
        Env: config.env || [],
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: {
          NetworkMode: 'none',
          Memory: config.memoryLimit || 128 * 1024 * 1024,
          NanoCpus: 1000000000,
          ReadonlyRootfs: true,
          Tmpfs: {
            '/tmp': 'rw,exec,nosuid,size=65536k',
          },
        },
      })) as Docker.Container;
    } catch (err) {
      return `Container Creation Error: ${(err as Error).message}`;
    }

    return new Promise<string>(async (resolve) => {
      let output = '';
      let isTimedOut = false;

      const timeout = setTimeout(async () => {
        isTimedOut = true;
        try {
          await container.kill();
        } catch {}
        try {
          await container.remove();
        } catch {}
        resolve(output + '\n[Execution Timed Out after 15 seconds]');
      }, 15000);

      try {
        const stream = await container.attach({
          stream: true,
          stdout: true,
          stderr: true,
        });

        // Demux standard output and error streams
        container.modem.demuxStream(
          stream,
          {
            write: (chunk: Buffer) => {
              output += chunk.toString('utf8');
            },
          },
          {
            write: (chunk: Buffer) => {
              output += chunk.toString('utf8');
            },
          }
        );

        await container.start();

        // Wait for container lifecycle completion
        await container.wait();
        clearTimeout(timeout);

        if (!isTimedOut) {
          await container.remove();
          resolve(output || '[Success: Executed with no output]');
        }
      } catch (err) {
        clearTimeout(timeout);
        try {
          await container.kill();
        } catch {}
        try {
          await container.remove();
        } catch {}
        resolve(`Execution Error: ${(err as Error).message}`);
      }
    });
  }
}
