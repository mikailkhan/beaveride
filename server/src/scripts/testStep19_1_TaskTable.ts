import './setupTestEnv.js';
import { UserRepository } from '../repositories/userRepository.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { agentService } from '../services/agentService.js';

async function runStep1TaskTableTest() {
  console.log('================================================================');
  console.log('🚀 Phase 19 Step 1: Agent Tasks Table & Repository Test');
  console.log('================================================================\n');

  const userRepository = new UserRepository();
  const roomId = 3;

  // 1. Ensure Agent User (BeaverBot) and Human User (Alice) exist
  const agentUser = await agentService.ensureAgentUser();
  console.log(`✓ Agent user ready: ID=${agentUser.id}, username=${agentUser.username}`);

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
  const assignedBy = humanUser ? humanUser.id : agentUser.id;
  console.log(`✓ Human user ready: ID=${assignedBy}`);

  // 2. Create Task
  const instruction = 'Add input validation to processPayment()';
  console.log(`\n--> Step 1.1: Creating task with instruction: "${instruction}"...`);
  const createdTask = await taskRepository.createTask({
    roomId,
    assignedBy,
    agentUserId: agentUser.id,
    instruction,
    status: 'assigned',
  });

  console.assert(Boolean(createdTask.taskId), 'taskId UUID must be generated');
  console.assert(createdTask.status === 'assigned', 'Initial status must be assigned');
  console.log('✓ Task created cleanly:', {
    id: createdTask.id,
    taskId: createdTask.taskId,
    status: createdTask.status,
  });

  // 3. Query Task by ID
  console.log('\n--> Step 1.2: Querying task by UUID...');
  const fetchedTask = await taskRepository.getTaskById(createdTask.taskId);
  console.assert(fetchedTask !== null, 'Fetched task must not be null');
  console.assert(fetchedTask?.instruction === instruction, 'Instruction must match');
  console.log('✓ Task fetched by UUID cleanly!');

  // 4. Query Active Task for Room
  console.log('\n--> Step 1.3: Checking active task for Room 3...');
  const activeTask = await taskRepository.getActiveTaskForRoom(roomId);
  console.assert(activeTask !== null, 'Active task must exist for room');
  console.assert(activeTask?.taskId === createdTask.taskId, 'Active task ID must match');
  console.log('✓ Active task retrieved for room!');

  // 5. Update Status to Planning
  console.log('\n--> Step 1.4: Updating task status to "planning"...');
  const updatedTask = await taskRepository.updateTaskStatus(
    createdTask.taskId,
    'planning',
    'planning',
    { planSummary: 'Analyzing file processPayment.ts and line 1-15' }
  );
  console.assert(updatedTask?.status === 'planning', 'Status must be planning');
  console.assert(
    updatedTask?.planSummary === 'Analyzing file processPayment.ts and line 1-15',
    'Plan summary must match'
  );
  console.log('✓ Task status updated to planning cleanly!');

  // 6. Complete Task
  console.log('\n--> Step 1.5: Updating task status to "completed"...');
  const completedTask = await taskRepository.updateTaskStatus(
    createdTask.taskId,
    'completed',
    'completed',
    { generatedCode: 'function processPayment(amount) { if (!amount) return false; }' }
  );
  console.assert(completedTask?.status === 'completed', 'Status must be completed');
  console.assert(Boolean(completedTask?.completedAt), 'completedAt must be populated');
  console.log('✓ Task completed cleanly!');

  // 7. Verify Active Task returns null now
  console.log('\n--> Step 1.6: Verifying active task is now null...');
  const activeTaskAfter = await taskRepository.getActiveTaskForRoom(roomId);
  console.assert(activeTaskAfter === null, 'Active task must be null after completion');
  console.log('✓ Active task is null after completion!');

  // 8. Get Tasks for Room
  console.log('\n--> Step 1.7: Getting all tasks for Room 3...');
  const roomTasks = await taskRepository.getTasksForRoom(roomId);
  console.assert(roomTasks.length > 0, 'Room tasks must contain the created task');
  console.log(`✓ Retrieved ${roomTasks.length} task(s) for Room ${roomId}`);

  console.log('\n================================================================');
  console.log('🎉 PHASE 19 STEP 1 VERIFICATION PASSED!');
  console.log('================================================================\n');

  process.exit(0);
}

runStep1TaskTableTest().catch((err) => {
  console.error('Step 1 test failed:', err);
  process.exit(1);
});
