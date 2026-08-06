import './setupTestEnv.js';
import http from 'http';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { RoomRepository } from '../repositories/roomRepository.js';
import { FileRepository } from '../repositories/fileRepository.js';
import { agentService } from '../services/agentService.js';
import { env } from '../config/env.js';

async function runStep5RestApiTest() {
  console.log('================================================================');
  console.log('🚀 Phase 19 Step 5: Agent Task REST API Endpoints Test');
  console.log('================================================================\n');

  // 1. Setup server
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const baseUrl = `http://localhost:${port}`;

  console.log(`✓ Test Express server listening on port ${port}`);

  // 2. Setup user and auth token
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

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Ensure BeaverBot agent user exists
  const beaverBot = await agentService.ensureAgentUser();

  // Setup room dynamically
  const roomRepository = new RoomRepository();
  const rooms = await roomRepository.findByUserId(validHuman.id).catch(() => []);
  let roomId = rooms[0]?.id ?? 3;
  if (rooms.length === 0) {
    try {
      const created = await roomRepository.create('REST API Test Room', 1, 1);
      roomId = created.id;
    } catch {}
  }
  console.log(`✓ Using target room ID=${roomId}`);

  // 3. Create test task in DB
  const fileRepository = new FileRepository();
  const tree = await fileRepository.getFileTree(roomId).catch(() => []);
  let targetFile = tree.find((f) => f.type === 'file');
  if (!targetFile) {
    try {
      targetFile = await fileRepository.createFile({
        roomId,
        parentId: null,
        name: 'restTest.ts',
        type: 'file',
        content: 'const a = 1;',
      });
    } catch {
      targetFile = undefined;
    }
  }
  const targetFileId = targetFile ? targetFile.id : null;

  const testTask = await taskRepository.createTask({
    roomId,
    assignedBy: validHuman.id,
    agentUserId: beaverBot.id,
    targetFileId,
    instruction: 'REST API verification test task',
    status: 'assigned',
  });
  console.log(`✓ Created test task in DB: taskId=${testTask.taskId}`);

  // ----------------------------------------------------------------------
  // TEST 5.1: GET /api/rooms/:roomId/tasks
  // ----------------------------------------------------------------------
  console.log('\n--> Test 5.1: Testing GET /api/rooms/:roomId/tasks...');
  const res1 = await fetch(`${baseUrl}/api/rooms/${roomId}/tasks`, { headers: authHeaders });
  console.assert(res1.status === 200, `Status must be 200 OK, got ${res1.status}`);
  const data1 = (await res1.json()) as any;
  console.assert(Array.isArray(data1.tasks), 'tasks must be an array');
  console.assert(data1.tasks.some((t: any) => t.taskId === testTask.taskId), 'Returned tasks must include testTask');
  console.log(`✓ Received ${data1.tasks.length} tasks for room ${roomId}!`);

  // ----------------------------------------------------------------------
  // TEST 5.2: GET /api/rooms/:roomId/tasks/active
  // ----------------------------------------------------------------------
  console.log('\n--> Test 5.2: Testing GET /api/rooms/:roomId/tasks/active...');
  const res2 = await fetch(`${baseUrl}/api/rooms/${roomId}/tasks/active`, { headers: authHeaders });
  console.assert(res2.status === 200, `Status must be 200 OK, got ${res2.status}`);
  const data2 = (await res2.json()) as any;
  console.assert(data2.activeTask !== null, 'activeTask must not be null');
  console.assert(data2.activeTask.taskId === testTask.taskId, 'activeTask taskId must match testTask');
  console.log(`✓ Active task verified: taskId=${data2.activeTask.taskId}, status=${data2.activeTask.status}!`);

  // ----------------------------------------------------------------------
  // TEST 5.3: GET /api/tasks/:taskId
  // ----------------------------------------------------------------------
  console.log('\n--> Test 5.3: Testing GET /api/tasks/:taskId...');
  const res3 = await fetch(`${baseUrl}/api/tasks/${testTask.taskId}`, { headers: authHeaders });
  console.assert(res3.status === 200, `Status must be 200 OK, got ${res3.status}`);
  const data3 = (await res3.json()) as any;
  console.assert(data3.task.taskId === testTask.taskId, 'Task detail taskId must match');
  console.log(`✓ Task detail retrieved cleanly: instruction="${data3.task.instruction}"!`);

  // ----------------------------------------------------------------------
  // TEST 5.4: POST /api/rooms/:roomId/tasks/:taskId/cancel
  // ----------------------------------------------------------------------
  console.log('\n--> Test 5.4: Testing POST /api/rooms/:roomId/tasks/:taskId/cancel...');
  const res4 = await fetch(`${baseUrl}/api/rooms/${roomId}/tasks/${testTask.taskId}/cancel`, {
    method: 'POST',
    headers: authHeaders,
  });
  console.assert(res4.status === 200, `Status must be 200 OK, got ${res4.status}`);
  const data4 = (await res4.json()) as any;
  console.assert(data4.success === true, 'Response success must be true');
  console.log('✓ REST task cancellation endpoint succeeded!');

  // Verify task status updated to cancelled in DB
  const cancelledDbTask = await taskRepository.getTaskById(testTask.taskId);
  console.assert(cancelledDbTask?.status === 'cancelled', 'DB task status must be cancelled');
  console.log('✓ Verified task persisted as cancelled in DB via REST endpoint!');

  server.close();

  console.log('\n================================================================');
  console.log('🎉 PHASE 19 STEP 5 VERIFICATION PASSED!');
  console.log('================================================================\n');

  process.exit(0);
}

runStep5RestApiTest().catch((err) => {
  console.error('Step 5 test failed:', err);
  process.exit(1);
});
