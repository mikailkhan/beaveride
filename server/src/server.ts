import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDb } from './db/client.js';
import { createSocketServer } from './sockets/socketServer.js';
import { cleanupDocStore, persistAllDirtyDocs } from './sockets/docStore.js';

const app = createApp();
const server = createServer(app);
createSocketServer(server);

server.listen(env.PORT, () => {
  console.info(`BeaverIDE API listening on port ${env.PORT}`);
});

const shutdown = async (signal: NodeJS.Signals) => {
  console.info(`${signal} received, shutting down`);
  cleanupDocStore();
  try {
    await persistAllDirtyDocs();
  } catch (err) {
    console.error('Error persisting documents on shutdown:', err);
  }
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
