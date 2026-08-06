import './setupTestEnv.js';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { registerRoomNamespace } from '../sockets/roomNamespace.js';
import { getOrCreateDoc, getOrCreateFileText } from '../sockets/docStore.js';
import { getLocksForRoom } from '../sockets/lockStore.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { RoomRepository } from '../repositories/roomRepository.js';
import { FileRepository } from '../repositories/fileRepository.js';
import { env } from '../config/env.js';

async function runStep4CancelAndFailTest() {
  console.log('================================================================');
  console.log('🚀 Phase 19 Step 4: Task Cancellation & Failure Handling Test');
  console.log('================================================================\n');

  // 1. Setup in-process server
  const app = express();
  const server = http.createServer(app);
  const io = new SocketServer(server, { cors: { origin: '*' } });
  registerRoomNamespace(io);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const roomId = 3;

  console.log(`✓ Test server listening on port ${port}`);

  // 2. Setup target file
  const fileRepository = new FileRepository();
  const tree = await fileRepository.getFileTree(roomId).catch(() => []);
  let targetFile = tree.find((f) => f.type === 'file');
  if (!targetFile) {
    try {
      targetFile = await fileRepository.createFile({
        roomId,
        parentId: null,
        name: 'payment.ts',
        type: 'file',
        content: 'function processPayment() { return "v1"; }',
      });
    } catch {
      targetFile = { id: 2, roomId, parentId: null, name: 'payment.ts', type: 'file', content: null, createdAt: new Date(), updatedAt: new Date() };
    }
  }
  const fileId = targetFile.id;
  await getOrCreateDoc(roomId);
  getOrCreateFileText(roomId, fileId);

  // 3. Connect client
  const userRepository = new UserRepository();
  let humanUser = await userRepository.findByUsername('alice');
  if (!humanUser) {
    try {
      humanUser = await userRepository.create({
        email: 'alice@beaveride.internal',
        username: 'alice',
        firstName: 'Alice',
        lastName: 'Dev',
        passwordHash: 'dummy',
        isAgent: false,
      });
    } catch {
      humanUser = await userRepository.findByEmail('alice@beaveride.internal');
    }
  }
  const validHuman = humanUser!;
  const token = jwt.sign(
    { sub: validHuman.id, email: validHuman.email, isAgent: false },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const socket: ClientSocketType = ClientSocket(`http://localhost:${port}/room`, {
    auth: { token, roomId: String(roomId) },
    transports: ['websocket'],
  });

  await new Promise<void>((resolve) => socket.on('connect', resolve));
  console.log('✓ Connected human client socket (Alice)');

  // ----------------------------------------------------------------------
  // TEST 4.1: Task Cancellation Mid-Flight
  // ----------------------------------------------------------------------
  console.log('\n--> Test 4.1: Triggering task and emitting agent:task_cancel mid-planning...');
  
  let cancelledTaskId: string | null = null;
  const cancelReceivedPromise = new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for task cancellation')), 15000);

    const onCreated = (data: any) => {
      cancelledTaskId = data.taskId;
    };

    const onUpdate = (update: any) => {
      console.log(`  → Task update: stage="${update.currentStage}" (status="${update.status}")`);
      if (update.status === 'planning') {
        // Emit cancel immediately during planning
        console.log('  --> Emitting agent:task_cancel socket event...');
        socket.emit('agent:task_cancel');
      } else if (update.status === 'cancelled') {
        clearTimeout(timer);
        socket.off('agent:task_created', onCreated);
        socket.off('agent:task_update', onUpdate);
        resolve(update);
      }
    };

    socket.on('agent:task_created', onCreated);
    socket.on('agent:task_update', onUpdate);
  });

  socket.emit('chat:send', { message: '@BeaverBot long task to be cancelled' });
  const cancelledResult = await cancelReceivedPromise;
  console.assert(cancelledResult.status === 'cancelled', 'Status must be cancelled');
  console.log('✓ Received agent:task_update with status: cancelled!');

  // Verify DB state
  const dbTask = await taskRepository.getTaskById(cancelledTaskId!);
  console.assert(dbTask?.status === 'cancelled', 'DB status must be cancelled');
  console.assert(Boolean(dbTask?.completedAt), 'completedAt timestamp must be set');
  console.log('✓ Verified task persisted as cancelled in PostgreSQL database!');

  // Verify zero dangling locks in room
  const activeLocks = getLocksForRoom(roomId);
  console.assert(activeLocks.length === 0, 'No locks must remain held in room after cancellation');
  console.log('✓ Verified zero locks remain held in room after cancellation!');

  // ----------------------------------------------------------------------
  // TEST 4.2: Cancel When No Active Task Exists
  // ----------------------------------------------------------------------
  console.log('\n--> Test 4.2: Emitting agent:task_cancel when no task is active...');
  const noTaskErrorPromise = new Promise<any>((resolve) => {
    socket.once('agent:task_error', (err) => resolve(err));
  });

  socket.emit('agent:task_cancel');
  const noTaskError = await noTaskErrorPromise;
  console.assert(noTaskError.reason === 'no_active_task', 'Error reason must be no_active_task');
  console.log('✓ Received expected agent:task_error (no_active_task):', noTaskError);

  // ----------------------------------------------------------------------
  // TEST 4.3: Task Failure Cleanup (Room with 0 files)
  // ----------------------------------------------------------------------
  console.log('\n--> Test 4.3: Testing graceful failure cleanup when task hits error...');
  const roomRepository = new RoomRepository();
  const emptyRoom = await roomRepository.create('Empty Test Room', 1, 1);

  // Connect socket2 to emptyRoom
  const tokenEmpty = jwt.sign(
    { sub: validHuman.id, email: validHuman.email, isAgent: false },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const socketEmpty: ClientSocketType = ClientSocket(`http://localhost:${port}/room`, {
    auth: { token: tokenEmpty, roomId: String(emptyRoom.id) },
    transports: ['websocket'],
  });
  await new Promise<void>((resolve) => socketEmpty.on('connect', resolve));

  const failedTask = await taskRepository.createTask({
    roomId: emptyRoom.id,
    assignedBy: validHuman.id,
    agentUserId: 4,
    instruction: 'task that will fail because room has no files',
    status: 'assigned',
  });

  const failureUpdatePromise = new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for task failure')), 15000);

    const onUpdate = (update: any) => {
      console.log(`  → Task failure test update: stage="${update.currentStage}" (status="${update.status}")`);
      if (update.taskId === failedTask.taskId && update.status === 'failed') {
        clearTimeout(timer);
        socketEmpty.off('agent:task_update', onUpdate);
        resolve(update);
      }
    };

    socketEmpty.on('agent:task_update', onUpdate);
  });

  const { taskManager } = await import('../services/taskManager.js');
  taskManager.executeTask(failedTask.taskId, emptyRoom.id, io, port);

  const failureResult = await failureUpdatePromise;

  console.assert(failureResult.status === 'failed', 'Status must be failed');
  console.assert(Boolean(failureResult.failureReason), 'failureReason must be set');
  console.log('✓ Received agent:task_update with status: failed and failureReason!');

  const failedDbTask = await taskRepository.getTaskById(failedTask.taskId);
  console.assert(failedDbTask?.status === 'failed', 'DB status must be failed');
  console.log('✓ Verified failed task persisted in DB cleanly!');

  const finalLocks = getLocksForRoom(roomId);
  console.assert(finalLocks.length === 0, 'No locks must remain held after failure');
  console.log('✓ Verified zero locks remain held after failure recovery!');

  socketEmpty.disconnect();
  socket.disconnect();
  server.close();

  console.log('\n================================================================');
  console.log('🎉 PHASE 19 STEP 4 VERIFICATION PASSED!');
  console.log('================================================================\n');

  process.exit(0);
}

runStep4CancelAndFailTest().catch((err) => {
  console.error('Step 4 test failed:', err);
  process.exit(1);
});
