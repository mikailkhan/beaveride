import { eventService } from '../services/eventService.js';
import { EventRepository } from '../repositories/eventRepository.js';
import { db } from '../db/client.js';
import { rooms } from '../db/schema.js';

console.log('====================================');
console.log('Testing Socket Activity Instrumentation (Phase 13 Step 5)');
console.log('====================================\n');

async function runTest() {
  const repo = new EventRepository();

  // Fetch an existing room from database to satisfy foreign key constraint
  const existingRooms = await db.select().from(rooms).limit(1);
  let roomId = 1;
  if (existingRooms.length > 0 && existingRooms[0]) {
    roomId = existingRooms[0].id;
  } else {
    console.warn('No existing rooms found in DB. Skipping FK test.');
    return;
  }

  const correlationId = eventService.generateCorrelationId();
  console.log(`Using Room ID: ${roomId}, Correlation ID: ${correlationId}`);

  // 1. Emit lock_requested for calculateTotal
  eventService.emit({
    roomId,
    actorId: null,
    actorName: 'Alice',
    actorType: 'human',
    eventType: 'lock_requested',
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    correlationId,
  });

  // 2. Emit lock_granted for calculateTotal
  eventService.emit({
    roomId,
    actorId: null,
    actorName: 'Alice',
    actorType: 'human',
    eventType: 'lock_granted',
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    outcome: 'granted',
    correlationId,
    metadata: { startLine: 10, endLine: 15 },
  });

  // Wait 300ms for async queue to drain into DB
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Query events by correlationId
  const events = await repo.queryByCorrelation(correlationId);
  console.log(`Retrieved ${events.length} events for correlation ID`);

  let errors = 0;

  if (events.length !== 2) {
    console.error(`❌ Expected 2 events for correlation ID, got ${events.length}`);
    errors++;
  } else {
    console.log('✅ Correctly retrieved 2 correlated activity log entries');
  }

  const grantedEvent = events.find((e) => e.eventType === 'lock_granted');

  if (grantedEvent && grantedEvent.targetScope === 'function' && grantedEvent.targetUnitName === 'calculateTotal') {
    console.log(`✅ Event verified: targetScope = "${grantedEvent.targetScope}", targetUnitName = "${grantedEvent.targetUnitName}"`);
  } else {
    console.error('❌ Failed: Target scope or unit name mismatch');
    errors++;
  }

  if (errors === 0) {
    console.log('\n🎉 SOCKET ACTIVITY INSTRUMENTATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
