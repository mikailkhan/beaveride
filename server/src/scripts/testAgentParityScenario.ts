import './setupTestEnv.js';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { registerRoomNamespace } from '../sockets/roomNamespace.js';
import { getOrCreateDoc } from '../sockets/docStore.js';
import { computeScopeHash } from '../utils/contentHash.js';
import { env } from '../config/env.js';
import { UserRepository } from '../repositories/userRepository.js';
import { agentService } from '../services/agentService.js';
import { releaseAllLocksForSocket } from '../sockets/lockStore.js';
import * as Y from 'yjs';

const userRepository = new UserRepository();

async function runStep5StaleWriteParityTest() {
  console.log('=== Phase 18 Step 5: Agent Stale Write & Parity Integration Test ===\n');

  // 1. Setup in-process Express + HTTP + Socket.IO server
  const app = express();
  const server = http.createServer(app);
  const io = new SocketServer(server, { cors: { origin: '*' } });
  registerRoomNamespace(io);

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      console.log(`✓ In-process test server running on port ${port}`);
      resolve();
    });
  });

  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const roomId = 3;
  const fileId = 201;

  // 2. Initialize file text in Yjs doc
  const doc = await getOrCreateDoc(roomId);
  const yFilesMap = doc.getMap('files');
  const yText = new Y.Text();
  const initialContent = 'function processPayment() {\n  return "v1_content";\n}';
  yText.insert(0, initialContent);
  yFilesMap.set(String(fileId), yText);

  const hashV1 = computeScopeHash(initialContent, 'function', 1, 3);
  console.log(`✓ Initial content setup in Yjs. Hash V1: ${hashV1}`);

  // 3. Load agent user (BeaverBot) and human user (Alice)
  const agentUser = await agentService.ensureAgentUser();
  console.log(`✓ Agent user loaded: ID=${agentUser.id}, username=${agentUser.username}`);

  let humanUser = await userRepository.findByUsername('alice');
  if (!humanUser) {
    humanUser = {
      id: 100,
      email: 'alice@beaveride.internal',
      username: 'alice',
      firstName: 'Alice',
      lastName: 'Dev',
      passwordHash: 'dummy',
      isAgent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  const validHumanUser = humanUser;
  const humanToken = jwt.sign(
    { sub: validHumanUser.id, email: validHumanUser.email, isAgent: false },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 4. Connect Sockets
  const humanSocket: ClientSocketType = ClientSocket(`http://localhost:${port}/room`, {
    auth: { token: humanToken, roomId: String(roomId) },
    transports: ['websocket'],
  });
  await new Promise<void>((resolve) => humanSocket.on('connect', resolve));
  console.log('✓ Human client (Alice) connected over Socket.IO');

  const { socket: agentSocket } = await agentService.connectAgentToRoom(roomId, port);
  console.log('✓ Agent client (BeaverBot) connected over Socket.IO');

  // STEP 5.1: Alice acquires function lock on processPayment
  console.log('\n--> Step 5.1: Alice acquires function lock on processPayment (lines 1-3)...');
  const aliceLockPromise = new Promise<any>((resolve) => {
    humanSocket.on('lock:acquired', (lock) => {
      if (lock.userId === validHumanUser.id && lock.fileId === fileId) resolve(lock);
    });
  });
  humanSocket.emit('lock:acquire', {
    fileId,
    lockScope: 'function',
    startLine: 1,
    endLine: 3,
    unitName: 'processPayment',
  });
  const aliceLock = await aliceLockPromise;
  console.log('✓ Alice acquired function lock:', aliceLock.id);

  // STEP 5.2: BeaverBot requests function lock -> Queued
  console.log('\n--> Step 5.2: BeaverBot requests function lock on processPayment -> Queuing...');
  const botQueuePromise = new Promise<any>((resolve) => {
    agentSocket.on('lock:queued', (data) => resolve(data));
  });
  agentService.requestAgentLock(agentSocket, {
    fileId,
    lockScope: 'function',
    startLine: 1,
    endLine: 3,
    unitName: 'processPayment',
  });
  const queueData = await botQueuePromise;
  console.assert(queueData.position === 1, 'Bot must be queued at position 1');
  console.log('✓ BeaverBot queued at position 1 behind Alice');

  // STEP 5.3: Alice edits function (bumping content to V2) and releases lock
  console.log('\n--> Step 5.3: Alice edits code (V1 -> V2) and releases lock...');
  const updatedContentV2 = 'function processPayment() {\n  return "v2_alice_updated";\n}';
  yText.delete(0, yText.length);
  yText.insert(0, updatedContentV2);
  const hashV2 = computeScopeHash(updatedContentV2, 'function', 1, 3);
  console.log(`✓ Alice updated Yjs text. Hash V2: ${hashV2}`);

  const botPromotedPromise = new Promise<any>((resolve) => {
    agentSocket.on('lock:granted', (data) => resolve(data.lock));
  });
  humanSocket.emit('lock:release', { fileId, lockId: aliceLock.id });
  const botLock = await botPromotedPromise;
  console.log('✓ Alice released lock -> BeaverBot promoted to lock holder:', botLock.id);

  // STEP 5.4: BeaverBot attempts STALE WRITE formed against hashV1 (pre-Alice edit)
  console.log('\n--> Step 5.4: BeaverBot attempts stale write formed against hashV1...');
  const staleRejectionPromise = new Promise<any>((resolve) => {
    agentSocket.on('write:rejected_stale', (data) => resolve(data));
  });

  const dummyUpdate = new Uint8Array([1, 2, 3]);
  agentSocket.emit('sync:update', dummyUpdate, fileId, hashV1);

  const rejectionData = await staleRejectionPromise;
  console.assert(rejectionData.fileId === fileId, 'FileId must match');
  console.assert(rejectionData.reason === 'stale_version', 'Reason must be stale_version');
  console.assert(rejectionData.currentHash === hashV2, 'Current hash returned must be hashV2');
  console.assert(rejectionData.retryCount === 1, 'Retry count must be 1');
  console.log('✓ Server rejected BeaverBot stale write cleanly:', rejectionData);

  // STEP 5.5: BeaverBot requests baseline refresh (`lock:refresh-baseline`)
  console.log('\n--> Step 5.5: BeaverBot requests baseline refresh...');
  const baselineRefreshedPromise = new Promise<any>((resolve) => {
    agentSocket.on('baseline:refreshed', (data) => resolve(data));
  });
  agentService.refreshAgentBaseline(agentSocket, { fileId, lockId: botLock.id });
  const freshBaseline = await baselineRefreshedPromise;
  console.assert(freshBaseline.freshHash === hashV2, 'Fresh hash must match Hash V2');
  console.log('✓ Baseline refreshed cleanly for BeaverBot:', freshBaseline);

  // STEP 5.6: BeaverBot re-acquires lock and submits fresh write formed against hashV2
  console.log('\n--> Step 5.6: BeaverBot re-acquires lock and submits fresh write against hashV2...');
  const botLock2Promise = new Promise<any>((resolve) => {
    agentSocket.on('lock:acquired', (lock) => resolve(lock));
  });
  agentService.requestAgentLock(agentSocket, {
    fileId,
    lockScope: 'function',
    startLine: 1,
    endLine: 3,
    unitName: 'processPayment',
  });
  const botLock2 = await botLock2Promise;

  const writeAcceptedPromise = new Promise<any>((resolve) => {
    agentSocket.on('write:accepted', (data) => resolve(data));
  });

  // Apply new update against hashV2
  const updatedContentV3 = 'function processPayment() {\n  return "v3_bot_final";\n}';
  yText.delete(0, yText.length);
  yText.insert(0, updatedContentV3);
  const hashV3 = computeScopeHash(updatedContentV3, 'function', 1, 3);

  agentSocket.emit('sync:update', dummyUpdate, fileId, hashV2);
  const writeAcceptedData = await writeAcceptedPromise;
  console.assert(writeAcceptedData.fileId === fileId, 'FileId must match');
  console.log('✓ Server accepted BeaverBot fresh write cleanly:', writeAcceptedData);

  // STEP 5.7: Teardown and final assertions
  console.log('\n--> Step 5.7: Cleaning up sockets and server...');
  agentService.releaseAgentLock(agentSocket, { fileId, lockId: botLock2.id });
  agentService.disconnectAgent(agentSocket);
  humanSocket.disconnect();

  if (agentSocket.id) releaseAllLocksForSocket(agentSocket.id);
  if (humanSocket.id) releaseAllLocksForSocket(humanSocket.id);

  server.close();

  console.log('\n=== Phase 18 Step 5 Agent Stale Write & Parity Integration Test PASSED! ===');
  process.exit(0);
}

runStep5StaleWriteParityTest().catch((err) => {
  console.error('Step 5 test failed:', err);
  process.exit(1);
});
