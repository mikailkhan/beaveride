import './setupTestEnv.js';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { registerRoomNamespace } from '../sockets/roomNamespace.js';
import { parseBeaverBotMention } from '../utils/mentionParser.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { env } from '../config/env.js';

async function runStep2MentionParserTest() {
  console.log('================================================================');
  console.log('🚀 Phase 19 Step 2: @BeaverBot Mention Parser & Socket Event Test');
  console.log('================================================================\n');

  // PART 1: Unit tests for parseBeaverBotMention
  console.log('--> Part 1: Running unit tests for parseBeaverBotMention()...');
  
  const test1 = parseBeaverBotMention('@BeaverBot add validation');
  console.assert(test1.isBotMention === true && test1.instruction === 'add validation', 'Test 1 failed');
  
  const test2 = parseBeaverBotMention('@beaverbot fix bug');
  console.assert(test2.isBotMention === true && test2.instruction === 'fix bug', 'Test 2 failed');

  const test3 = parseBeaverBotMention('hello @BeaverBot');
  console.assert(test3.isBotMention === false && test3.instruction === '', 'Test 3 failed');

  const test4 = parseBeaverBotMention('@BeaverBot');
  console.assert(test4.isBotMention === true && test4.instruction === '', 'Test 4 failed');

  console.log('✓ All parseBeaverBotMention() unit tests PASSED!');

  // PART 2: Socket Integration Test
  console.log('\n--> Part 2: Running Socket.IO integration tests...');

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
  console.log('✓ Connected client socket for Alice');

  // Test 2.1: Emit @BeaverBot message and catch agent:task_created
  console.log('\n--> Test 2.1: Emitting @BeaverBot task creation message...');
  const taskCreatedPromise = new Promise<any>((resolve) => {
    socket.on('agent:task_created', (data) => resolve(data));
  });

  const instruction = 'add input validation to processPayment()';
  socket.emit('chat:send', { message: `@BeaverBot ${instruction}` });

  const createdData = await taskCreatedPromise;
  console.assert(createdData.instruction === instruction, 'Instruction must match');
  console.assert(createdData.status === 'assigned', 'Status must be assigned');
  console.log('✓ Received agent:task_created socket event cleanly:', createdData);

  // Verify DB persistence
  const dbTask = await taskRepository.getTaskById(createdData.taskId);
  console.assert(dbTask !== null, 'Task must exist in database');
  console.assert(dbTask?.instruction === instruction, 'DB task instruction must match');
  console.log('✓ Verified task persisted in PostgreSQL database!');

  // Test 2.2: Attempt 2nd task creation while active task exists -> Rejection
  console.log('\n--> Test 2.2: Emitting 2nd @BeaverBot mention while task is active...');
  const activeTaskErrorPromise = new Promise<any>((resolve) => {
    socket.on('agent:task_error', (data) => resolve(data));
  });

  socket.emit('chat:send', { message: '@BeaverBot second instruction' });
  const activeError = await activeTaskErrorPromise;
  console.assert(activeError.reason === 'task_already_active', 'Error reason must be task_already_active');
  console.log('✓ Active task rejection error received cleanly:', activeError);

  // Complete active task in DB to allow next test
  await taskRepository.updateTaskStatus(createdData.taskId, 'completed', 'completed');

  // Test 2.3: Send empty instruction -> Rejection
  console.log('\n--> Test 2.3: Emitting @BeaverBot with empty instruction...');
  const emptyErrorPromise = new Promise<any>((resolve) => {
    socket.on('agent:task_error', (data) => resolve(data));
  });

  socket.emit('chat:send', { message: '@BeaverBot' });
  const emptyError = await emptyErrorPromise;
  console.assert(emptyError.reason === 'empty_instruction', 'Error reason must be empty_instruction');
  console.log('✓ Empty instruction error received cleanly:', emptyError);

  socket.disconnect();
  server.close();

  console.log('\n================================================================');
  console.log('🎉 PHASE 19 STEP 2 VERIFICATION PASSED!');
  console.log('================================================================\n');

  process.exit(0);
}

runStep2MentionParserTest().catch((err) => {
  console.error('Step 2 test failed:', err);
  process.exit(1);
});
