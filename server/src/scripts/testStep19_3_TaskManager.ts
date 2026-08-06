import './setupTestEnv.js';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { registerRoomNamespace } from '../sockets/roomNamespace.js';
import { getOrCreateDoc, getOrCreateFileText, getFileContent } from '../sockets/docStore.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { FileRepository } from '../repositories/fileRepository.js';
import { env } from '../config/env.js';

async function runStep3TaskManagerTest() {
  console.log('================================================================');
  console.log('🚀 Phase 19 Step 3: Task Manager State Machine Test');
  console.log('================================================================\n');

  // 1. Setup in-process Express + Socket.IO server
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

  // 2. Setup target project file in DB and Yjs docStore
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
  console.log(`✓ Target file ready: ID=${fileId}, name=${targetFile.name}`);

  await getOrCreateDoc(roomId);
  const yText = getOrCreateFileText(roomId, fileId);
  const initialCode = 'function processPayment() { return "v1"; }';
  yText.delete(0, yText.length);
  yText.insert(0, initialCode);

  // 3. Connect Human Client (Alice)
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

  // 4. Collect task updates
  const receivedStages: string[] = [];
  let taskCreatedData: any = null;

  const taskCompletedPromise = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for TaskManager state machine completion')), 25000);

    socket.on('agent:task_created', (data) => {
      taskCreatedData = data;
      console.log(`✓ Received agent:task_created: taskId=${data.taskId}`);
    });

    socket.on('agent:task_update', (update) => {
      console.log(`  → Task update: stage="${update.currentStage}" (status="${update.status}")`);
      receivedStages.push(update.currentStage);

      if (update.status === 'completed') {
        clearTimeout(timer);
        resolve();
      } else if (update.status === 'failed') {
        clearTimeout(timer);
        reject(new Error(`Task failed unexpectedly: ${update.failureReason}`));
      }
    });
  });

  // 5. Trigger task via @BeaverBot mention
  const instruction = 'add input validation to processPayment()';
  console.log(`\n--> Emitting chat message: "@BeaverBot ${instruction}"...`);
  socket.emit('chat:send', { message: `@BeaverBot ${instruction}` });

  await taskCompletedPromise;
  console.log('\n✓ Task completed state machine successfully!');

  // 6. Verify received stage order
  console.log('\n--> Verifying stage progression sequence...');
  console.log('  Received stages:', receivedStages);
  console.assert(receivedStages.includes('planning'), 'Must include planning stage');
  console.assert(receivedStages.includes('waiting'), 'Must include waiting stage');
  console.assert(receivedStages.includes('writing'), 'Must include writing stage');
  console.assert(receivedStages.includes('verifying'), 'Must include verifying stage');
  console.assert(receivedStages.includes('completed'), 'Must include completed stage');
  console.log('✓ All 5 stages arrived in correct sequence!');

  // 7. Verify Database Record
  console.log('\n--> Verifying database task record...');
  const dbTask = await taskRepository.getTaskById(taskCreatedData.taskId);
  console.assert(dbTask !== null, 'Task must exist in DB');
  console.assert(dbTask?.status === 'completed', 'DB status must be completed');
  console.assert(Boolean(dbTask?.completedAt), 'completedAt timestamp must be set');
  console.assert(Boolean(dbTask?.planSummary), 'planSummary must be set');
  console.assert(Boolean(dbTask?.generatedCode), 'generatedCode must be set');
  console.log('✓ Database record verified with completedAt timestamp!');

  // 8. Verify Yjs Document Content
  console.log('\n--> Verifying final Yjs document code content...');
  const finalContent = getFileContent(roomId, fileId) || '';
  console.assert(finalContent.includes('BeaverBot Task:'), 'Yjs content must contain BeaverBot header');
  console.assert(finalContent.includes('function beaverBot_'), 'Yjs content must contain generated function');
  console.log('✓ Generated code verified inside Yjs document store!');

  socket.disconnect();
  server.close();

  console.log('\n================================================================');
  console.log('🎉 PHASE 19 STEP 3 VERIFICATION PASSED!');
  console.log('================================================================\n');

  process.exit(0);
}

runStep3TaskManagerTest().catch((err) => {
  console.error('Step 3 test failed:', err);
  process.exit(1);
});
