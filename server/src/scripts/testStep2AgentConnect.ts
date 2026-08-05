import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AgentService } from '../services/agentService.js';
import { registerRoomNamespace } from '../sockets/roomNamespace.js';
import { releaseAllLocksForSocket } from '../sockets/lockStore.js';
import { eventService } from '../services/eventService.js';

async function runStep2AgentConnectTest() {
  console.log('=== Phase 18 Step 2: Agent Runner & Socket Client Test ===\n');

  // Override eventService.emit to capture events synchronously in memory
  const emittedEvents: any[] = [];
  eventService.emit = (eventData: any) => {
    emittedEvents.push({
      ...eventData,
      eventId: 'evt_' + Math.random().toString(36).substring(2, 9),
      occurredAt: new Date(),
    });
  };

  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: '*' },
  });

  registerRoomNamespace(io);

  const TEST_PORT = 9982;
  const TEST_ROOM_ID = 8802;
  const TEST_FILE_ID = 402;

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`Test Express/Socket.IO server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  const agentService = new AgentService();

  console.log('\nSTEP 1: Connecting BeaverBot agent via AgentService.connectAgentToRoom()...');

  // Override ensureAgentUser for standalone test environment if DB unreachable
  agentService.ensureAgentUser = async () => ({
    id: 901,
    email: 'beaverbot@beaveride.internal',
    username: 'BeaverBot',
    firstName: 'Beaver',
    lastName: 'Bot 🤖',
    passwordHash: '$2b$12$eImiTXuWVxfM37uY4JANjO5E.y5bA5KxVdFvN7i2H/h6i2g5a4h/K',
    isAgent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const { socket: agentSocket, agentUser } = await agentService.connectAgentToRoom(
    TEST_ROOM_ID,
    TEST_PORT
  );

  console.assert(agentSocket.connected === true, 'Agent socket MUST be connected');
  console.assert(agentUser.username === 'BeaverBot', 'Agent username MUST be BeaverBot');
  console.assert(agentUser.isAgent === true, 'Agent isAgent flag MUST be true');
  console.log(`✓ Agent connected successfully! Socket ID: ${agentSocket.id}, User: ${agentUser.username}`);

  console.log('\nSTEP 2: Requesting function lock over WebSockets via requestAgentLock()...');

  const lockPromise = new Promise<any>((resolve) => {
    agentSocket.on('lock:acquired', (data) => {
      resolve(data);
    });
  });

  agentService.requestAgentLock(agentSocket, {
    fileId: TEST_FILE_ID,
    lockScope: 'function',
    startLine: 1,
    endLine: 10,
    unitName: 'processOrder',
  });

  const lockEventData = await lockPromise;
  console.assert(lockEventData.fileId === TEST_FILE_ID, 'Lock file ID must match target');
  console.assert(lockEventData.username === 'BeaverBot', 'Lock username must be BeaverBot');
  console.assert(lockEventData.unitName === 'processOrder', 'Lock unitName must be processOrder');
  console.log('✓ Agent lock request granted over WebSockets:', lockEventData);

  console.log('\nSTEP 3: Releasing lock over WebSockets via releaseAgentLock()...');
  const releasePromise = new Promise<any>((resolve) => {
    agentSocket.on('lock:released', (data) => {
      resolve(data);
    });
  });

  agentService.releaseAgentLock(agentSocket, {
    fileId: TEST_FILE_ID,
    lockId: lockEventData.id,
  });

  const releaseEventData = await releasePromise;
  console.assert(releaseEventData.lockId === lockEventData.id, 'Released lock ID must match');
  console.log('✓ Agent lock released cleanly over WebSockets:', releaseEventData);

  console.log('\nSTEP 4: Disconnecting agent socket via disconnectAgent()...');
  agentService.disconnectAgent(agentSocket);
  console.assert(agentSocket.connected === false, 'Agent socket MUST be disconnected');
  console.log('✓ Agent socket disconnected cleanly');

  // Teardown HTTP server
  server.close();
  if (agentSocket.id) {
    releaseAllLocksForSocket(agentSocket.id);
  }

  console.log('\n=== Phase 18 Step 2 Agent Runner & Socket Client Test PASSED! ===');
  process.exit(0);
}

runStep2AgentConnectTest().catch((err) => {
  console.error('Step 2 test failed:', err);
  process.exit(1);
});
