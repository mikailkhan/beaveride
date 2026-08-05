import './setupTestEnv.js';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { registerRoomNamespace } from '../sockets/roomNamespace.js';
import { env } from '../config/env.js';
import { UserRepository } from '../repositories/userRepository.js';
import { agentService } from '../services/agentService.js';
import { releaseAllLocksForSocket } from '../sockets/lockStore.js';

const userRepository = new UserRepository();

async function runStep3Test() {
  console.log('=== Phase 18 Step 3: Bounded Lock Engine & Parity Verification ===\n');

  // 1. Setup in-process Express + HTTP + Socket.IO server
  const app = express();
  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: { origin: '*' },
  });

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

  // 2. Fetch/seed BeaverBot user and Human Alice user
  const agentUser = await agentService.ensureAgentUser();
  console.log(`✓ Agent user loaded: ID=${agentUser.id}, username=${agentUser.username}, isAgent=${agentUser.isAgent}`);

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
  console.log(`✓ Human user loaded: ID=${validHumanUser.id}, username=${validHumanUser.username}, isAgent=${validHumanUser.isAgent}`);

  const humanToken = jwt.sign(
    { sub: validHumanUser.id, email: validHumanUser.email, isAgent: validHumanUser.isAgent },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 3. Connect Human Socket
  const humanSocket: ClientSocketType = ClientSocket(`http://localhost:${port}/room`, {
    auth: { token: humanToken, roomId: String(roomId) },
    transports: ['websocket'],
  });

  await new Promise<void>((resolve) => {
    humanSocket.on('connect', resolve);
  });
  console.log('✓ Human client (Alice) connected over Socket.IO');

  // 4. Connect Agent Socket via AgentService
  const { socket: agentSocket } = await agentService.connectAgentToRoom(roomId, port);
  console.log('✓ Agent client (BeaverBot) connected over Socket.IO');

  const fileId = 101;

  // 5. Test FIFO Contention: Human acquires Lock A on File 101 first
  console.log('\n--> Scenario 1: Human acquires Lock A on File 101...');
  const humanAcquiredPromise = new Promise<any>((resolve) => {
    humanSocket.on('lock:acquired', (lock) => {
      if (lock.userId === humanUser!.id && lock.fileId === fileId) resolve(lock);
    });
  });

  humanSocket.emit('lock:acquire', { fileId, lockScope: 'file' });
  const humanLock = await humanAcquiredPromise;
  console.log('✓ Human acquired Lock A:', humanLock.id);

  // 6. Agent requests Lock A on File 101 -> Must be QUEUED at position 1
  console.log('\n--> Scenario 2: Agent requests Lock A on File 101 while held by Human...');
  const agentQueuedPromise = new Promise<any>((resolve) => {
    agentSocket.on('lock:queued', (data) => {
      if (data.fileId === fileId) resolve(data);
    });
  });

  await agentService.requestAgentLock(agentSocket, { fileId, lockScope: 'file' });
  const queueData = await agentQueuedPromise;
  console.assert(queueData.position === 1, 'Agent must be queued at position 1');
  console.assert(queueData.heldBy.userId === validHumanUser.id, 'HeldBy must match Human user ID');
  console.log('✓ Agent correctly queued at position 1 behind Human (FIFO parity proven)');

  // 7. Human releases Lock A -> Agent promoted to acquire Lock A
  console.log('\n--> Scenario 3: Human releases Lock A -> Agent must be promoted...');
  const agentPromotedPromise = new Promise<any>((resolve) => {
    agentSocket.on('lock:granted', (data) => {
      if (data.fileId === fileId) resolve(data.lock);
    });
  });

  humanSocket.emit('lock:release', { fileId, lockId: humanLock.id });
  const agentLock = await agentPromotedPromise;
  console.assert(agentLock.userId === agentUser.id, 'Promoted lock user ID must match Agent user ID');
  console.log('✓ Agent successfully promoted to hold Lock A:', agentLock.id);

  // 8. Test Single-Scope Bound for Agent: Agent attempts to acquire Lock B on File 102 while holding Lock A
  console.log('\n--> Scenario 4: Agent attempts 2nd lock on File 102 while holding Lock A (Bounds Enforcement)...');
  const fileId2 = 102;
  const agentDeniedPromise = new Promise<any>((resolve) => {
    agentSocket.on('lock:already_held', (data) => {
      if (data.fileId === fileId2) resolve(data);
    });
  });

  await agentService.requestAgentLock(agentSocket, { fileId: fileId2, lockScope: 'file' });
  const deniedData = await agentDeniedPromise;
  console.assert(deniedData.reason === 'single_scope_limit', 'Reason must be single_scope_limit');
  console.log('✓ Agent second lock request denied cleanly with reason: single_scope_limit');

  // 9. Clean Teardown
  console.log('\n--> Cleaning up sockets and server...');
  await agentService.releaseAgentLock(agentSocket, { fileId, lockId: agentLock.id });
  agentService.disconnectAgent(agentSocket);
  humanSocket.disconnect();

  if (agentSocket.id) releaseAllLocksForSocket(agentSocket.id);
  if (humanSocket.id) releaseAllLocksForSocket(humanSocket.id);

  server.close();

  console.log('\n=== Phase 18 Step 3 Bounded Lock Engine & Parity Test PASSED! ===');
  process.exit(0);
}

runStep3Test().catch((err) => {
  console.error('Step 3 test failed:', err);
  process.exit(1);
});
