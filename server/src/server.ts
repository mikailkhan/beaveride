import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDb } from './db/client.js';

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  console.log(`BeaverIDE API listening on port ${env.PORT}`);
});

const shutdown = async (signal: NodeJS.Signals) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
