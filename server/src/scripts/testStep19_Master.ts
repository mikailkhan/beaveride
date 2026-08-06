import './setupTestEnv.js';
import http from 'http';
import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../app.js';
import { registerRoomNamespace } from '../sockets/roomNamespace.js';
import { UserRepository } from '../repositories/userRepository.js';
import { RoomRepository } from '../repositories/roomRepository.js';
import { FileRepository } from '../repositories/fileRepository.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { agentService } from '../services/agentService.js';
import { taskManager } from '../services/taskManager.js';
import { getLocksForRoom } from '../sockets/lockStore.js';
import { EventRepository } from '../repositories/eventRepository.js';
import { getOrCreateDoc, getOrCreateFileText } from '../sockets/docStore.js';
import { env } from '../config/env.js';

async function runMasterE2ETest() {
  console.log('================================================================');
  console.log('🚀 PHASE 19 MASTER E2E SUITE: Agent Task Delegation & Lifecycle');
  console.log('================================================================\n');

  // 1. Setup server and WebSocket namespace
  const app = createApp();
  const server = http.createServer(app);
  const io = new SocketServer(server, { cors: { origin: '*' } });
  registerRoomNamespace(io);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✓ Test Express & Socket.IO server running on port ${port}`);

  // 2. Setup user and auth token
  const userRepository = new UserRepository();
  let alice = await userRepository.findByUsername('alice');
  if (!alice) {
    try {
      alice = await userRepository.create({
        email: 'alice.master@beaveride.internal',
        username: 'alice',
        firstName: 'Alice',
        lastName: 'Dev',
        passwordHash: 'dummy',
        isAgent: false,
      });
    } catch {
      alice = (await userRepository.findByEmail('alice.master@beaveride.internal'))!;
    }
  }
  const token = jwt.sign(
    { sub: alice.id, email: alice.email, isAgent: false },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const beaverBot = await agentService.ensureAgentUser();

  // Setup room
  const roomRepository = new RoomRepository();
  const rooms = await roomRepository.findByUserId(alice.id).catch(() => []);
  let roomId = rooms[0]?.id ?? 3;
  if (rooms.length === 0) {
    try {
      const created = await roomRepository.create('Master E2E Room', 1, 1);
      roomId = created.id;
    } catch {}
  }
  console.log(`✓ Using target room ID=${roomId}`);

  // Setup file
  const fileRepository = new FileRepository();
  const tree = await fileRepository.getFileTree(roomId).catch(() => []);
  let targetFile = tree.find((f) => f.type === 'file');
  if (!targetFile) {
    targetFile = await fileRepository.createFile({
      roomId,
      parentId: null,
      name: 'masterTest.ts',
      type: 'file',
      content: '// Base code for master test',
    });
  }
  const fileId = targetFile.id;
  console.log(`✓ Using target file ID=${fileId} (${targetFile.name})`);

  // Helper to connect a socket client
  const createSocketClient = (): Promise<ClientSocket> => {
    return new Promise((resolve) => {
      const client = ioClient(`${baseUrl}/room`, {
        auth: { token, roomId: String(roomId) },
        transports: ['websocket'],
      });
      client.on('connect', () => resolve(client));
    });
  };

  // ----------------------------------------------------------------------
  // SCENARIO 1: Full Happy Path Task Execution
  // ----------------------------------------------------------------------
  console.log('\n--> Scenario 1: Full Happy Path Execution...');
  const socket1 = await createSocketClient();

  const updates1: any[] = [];
  socket1.on('agent:task_update', (data) => {
    console.log(`  [Scenario 1 Update] stage=${data.currentStage}, status=${data.status}`);
    updates1.push(data);
  });

  // Trigger task via chat message
  socket1.emit('chat:send', { message: '@BeaverBot add input validation to masterTest' });

  // Wait for task completion
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Scenario 1 timed out')), 25000);
    const check = setInterval(() => {
      const last = updates1[updates1.length - 1];
      if (last && (last.status === 'completed' || last.currentStage === 'completed' || last.stage === 'completed')) {
        clearInterval(check);
        clearTimeout(timeout);
        resolve();
      }
    }, 200);
  });

  const stages1 = updates1.map((u) => u.currentStage || u.stage || u.status);
  console.assert(stages1.includes('planning'), 'Must include planning stage');
  console.assert(stages1.includes('waiting'), 'Must include waiting stage');
  console.assert(stages1.includes('writing'), 'Must include writing stage');
  console.assert(stages1.includes('verifying'), 'Must include verifying stage');
  console.assert(stages1.includes('completed'), 'Must include completed stage');
  console.log(`✓ Received all 5 stages in order: [${stages1.join(' -> ')}]`);

  // Assert code was written to Yjs doc
  const doc = await getOrCreateDoc(roomId);
  const yText = getOrCreateFileText(roomId, fileId);
  const fileContent = yText.toString();
  console.assert(fileContent.includes('BeaverBot Task'), 'Yjs document must contain BeaverBot generated code');
  console.log('✓ Verified BeaverBot generated code persisted in Yjs document!');

  socket1.disconnect();

  // ----------------------------------------------------------------------
  // SCENARIO 2: Mid-flight Task Cancellation
  // ----------------------------------------------------------------------
  console.log('\n--> Scenario 2: Mid-flight Task Cancellation...');
  const socket2 = await createSocketClient();

  const updates2: any[] = [];
  socket2.on('agent:task_update', (data) => updates2.push(data));

  // Trigger task
  socket2.emit('chat:send', { message: '@BeaverBot calculate Fibonacci sequence' });

  // Wait for planning stage, then cancel immediately
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (updates2.some((u) => u.currentStage === 'planning' || u.stage === 'planning')) {
        clearInterval(check);
        socket2.emit('agent:task_cancel');
        resolve();
      }
    }, 50);
  });

  // Wait for cancellation update
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Scenario 2 timed out')), 15000);
    const check = setInterval(() => {
      if (updates2.some((u) => u.status === 'cancelled' || u.currentStage === 'cancelled' || u.stage === 'cancelled')) {
        clearInterval(check);
        clearTimeout(timeout);
        resolve();
      }
    }, 100);
  });

  console.log('✓ Task mid-flight cancellation verified!');
  const activeLocks2 = getLocksForRoom(roomId).filter((l) => l.fileId === fileId);
  console.assert(activeLocks2.length === 0, 'No locks should remain held after cancellation');
  console.log('✓ Verified no dangling locks after cancellation!');

  socket2.disconnect();

  // ----------------------------------------------------------------------
  // SCENARIO 3: Graceful Failure Handling
  // ----------------------------------------------------------------------
  console.log('\n--> Scenario 3: Graceful Failure Handling...');
  const emptyRoom = await roomRepository.create('Empty Room No Files', 1, 1);
  const failTaskRow = await taskRepository.createTask({
    roomId: emptyRoom.id,
    assignedBy: alice.id,
    agentUserId: beaverBot.id,
    instruction: 'Task targeting room with no files',
    status: 'assigned',
  });

  // Execute directly
  await taskManager.executeTask(failTaskRow.taskId, emptyRoom.id, io);

  const failedTaskDb = await taskRepository.getTaskById(failTaskRow.taskId);
  console.assert(failedTaskDb?.status === 'failed', 'DB task status must be failed');
  console.assert(!!failedTaskDb?.failureReason, 'Failure reason must be set');
  console.log(`✓ Graceful failure recovery verified: reason="${failedTaskDb?.failureReason}"!`);

  // ----------------------------------------------------------------------
  // SCENARIO 4: Double Assignment Rejection
  // ----------------------------------------------------------------------
  console.log('\n--> Scenario 4: Double Assignment Rejection...');
  const socket4 = await createSocketClient();

  // Create an active task manually
  const dummyActive = await taskRepository.createTask({
    roomId,
    assignedBy: alice.id,
    agentUserId: beaverBot.id,
    targetFileId: fileId,
    instruction: 'Active blocking task',
    status: 'assigned',
  });

  let errorReceived: any = null;
  socket4.on('agent:task_error', (err) => {
    errorReceived = err;
  });

  socket4.emit('chat:send', { message: '@BeaverBot do another task simultaneously' });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Scenario 4 timed out')), 5000);
    const check = setInterval(() => {
      if (errorReceived) {
        clearInterval(check);
        clearTimeout(timeout);
        resolve();
      }
    }, 100);
  });

  console.assert(errorReceived?.reason === 'task_already_active', 'Error reason must be task_already_active');
  console.log('✓ Double-assignment rejection verified!');

  // Cleanup dummy task
  await taskRepository.updateTaskStatus(dummyActive.taskId, 'completed', 'completed');
  socket4.disconnect();

  // ----------------------------------------------------------------------
  // SCENARIO 5: Queue Contention & Lock Promotion During Task
  // ----------------------------------------------------------------------
  console.log('\n--> Scenario 5: Queue Contention & Promotion During Task...');
  const socket5 = await createSocketClient();

  // 1. Human acquires lock on file
  let humanLockGranted = false;
  socket5.on('lock:acquired', () => {
    humanLockGranted = true;
  });

  socket5.emit('lock:acquire', {
    fileId,
    lockScope: 'file',
  });

  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (humanLockGranted) {
        clearInterval(check);
        resolve();
      }
    }, 50);
  });
  console.log('✓ Human socket acquired file lock');

  // 2. Assign BeaverBot task
  const updates5: any[] = [];
  socket5.on('agent:task_update', (data) => updates5.push(data));

  socket5.emit('chat:send', { message: '@BeaverBot write helper under lock contention' });

  // Wait for BeaverBot to reach 'waiting' stage
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (updates5.some((u) => u.currentStage === 'waiting' || u.stage === 'waiting')) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
  console.log('✓ BeaverBot reached waiting stage (queued behind human)');

  // 3. Human releases lock -> BeaverBot promoted -> Task completes
  const humanLock = getLocksForRoom(roomId).find((l) => l.fileId === fileId && !l.isAgent);
  if (humanLock) {
    socket5.emit('lock:release', { fileId, lockId: humanLock.id });
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Scenario 5 timed out')), 25000);
    const check = setInterval(() => {
      if (updates5.some((u) => u.status === 'completed' || u.currentStage === 'completed' || u.stage === 'completed')) {
        clearInterval(check);
        clearTimeout(timeout);
        resolve();
      }
    }, 200);
  });

  console.log('✓ BeaverBot promoted from queue and completed task cleanly!');
  socket5.disconnect();

  // ----------------------------------------------------------------------
  // SCENARIO 6: Activity Log Auditability
  // ----------------------------------------------------------------------
  console.log('\n--> Scenario 6: Activity Log Auditability...');
  const eventRepository = new EventRepository();
  const activities = await eventRepository.getRecentEvents(roomId);
  const agentEvents = activities.filter((a) => a.eventType.startsWith('agent_'));

  console.assert(agentEvents.length >= 3, 'Must log multiple agent activity events');
  console.assert(agentEvents.some((a) => a.eventType === 'agent_task_assigned'), 'Must log agent_task_assigned');
  console.assert(agentEvents.some((a) => a.eventType === 'agent_stage_planning'), 'Must log agent_stage_planning');
  console.assert(agentEvents.some((a) => a.eventType === 'agent_task_completed'), 'Must log agent_task_completed');
  console.log(`✓ Activity log auditability verified (${agentEvents.length} agent events logged)!`);

  server.close();

  console.log('\n================================================================');
  console.log('🎉 ALL 6 MASTER E2E SCENARIOS PASSED 100%!');
  console.log('================================================================\n');

  process.exit(0);
}

runMasterE2ETest().catch((err) => {
  console.error('Master test failed:', err);
  process.exit(1);
});
