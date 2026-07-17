import Docker from 'dockerode';

const docker = new Docker();

interface LanguageConfig {
  image: string;
  filename: string;
  runCmd: string;
  env?: string[];
  memoryLimit?: number;
}

const CONFIGS: Record<string, LanguageConfig> = {
  javascript: {
    image: 'node:18-alpine',
    filename: 'code.js',
    runCmd: 'node /tmp/code.js',
    memoryLimit: 128 * 1024 * 1024, // 128MB
  },
  python: {
    image: 'python:3.10-alpine',
    filename: 'code.py',
    runCmd: 'python /tmp/code.py',
    memoryLimit: 128 * 1024 * 1024, // 128MB
  },
  go: {
    image: 'golang:1.20-alpine',
    filename: 'code.go',
    runCmd: 'go run /tmp/code.go',
    env: ['GOCACHE=/tmp/go-cache', 'GOPATH=/tmp/go'],
    memoryLimit: 256 * 1024 * 1024, // 256MB (Go compiler is heavier)
  },
};

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

    const codeToRun = code;

    try {
      await this.ensureImage(config.image);
    } catch (err) {
      return `Docker Image Pull Error: ${(err as Error).message}`;
    }

    // Convert code to a base64 string to securely inject during execution
    const base64Code = Buffer.from(codeToRun).toString('base64');
    const decodeAndRunCmd = `echo "${base64Code}" | base64 -d > /tmp/${config.filename} && ${config.runCmd}`;

    let container: Docker.Container;
    try {
      container = (await docker.createContainer({
        Image: config.image,
        Cmd: ['sh', '-c', decodeAndRunCmd],
        Env: config.env || [],
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: {
          NetworkMode: 'none',
          Memory: config.memoryLimit || (128 * 1024 * 1024), // Dynamic or default 128MB limit
          NanoCpus: 1000000000,     // 1.0 CPU limit (prevents slow virtualized compiles)
          ReadonlyRootfs: true,
          Tmpfs: {
            '/tmp': 'rw,exec,nosuid,size=65536k' // Writable execution directory
          }
        }
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
          stderr: true
        });

        // Demux standard output and error streams
        container.modem.demuxStream(stream, {
          write: (chunk: Buffer) => {
            output += chunk.toString('utf8');
          }
        }, {
          write: (chunk: Buffer) => {
            output += chunk.toString('utf8');
          }
        });

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
