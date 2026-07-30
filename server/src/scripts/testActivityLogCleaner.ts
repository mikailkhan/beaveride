import { eventService } from '../services/eventService.js';
import { EventRepository } from '../repositories/eventRepository.js';
import { db } from '../db/client.js';
import { activityEvents, rooms } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

console.log('====================================');
console.log('Testing Automatic Activity Log Cleaner (7 Days Retention)');
console.log('====================================\n');

async function runTest() {
  const repo = new EventRepository();

  // Fetch an existing room from database to satisfy foreign key constraint
  const existingRooms = await db.select().from(rooms).limit(1);
  let roomId = 1;
  if (existingRooms.length > 0 && existingRooms[0]) {
    roomId = existingRooms[0].id;
  } else {
    console.error('❌ No existing rooms found in DB to run test.');
    process.exit(1);
  }

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const event8DaysOldId = randomUUID();
  const event5DaysOldId = randomUUID();
  const eventTodayId = randomUUID();

  console.log(`Inserting test events for Room ${roomId}:`);
  console.log(`  1. Event 8-Days-Old ID: ${event8DaysOldId} (Date: ${new Date(now - 8 * DAY_MS).toISOString()})`);
  console.log(`  2. Event 5-Days-Old ID: ${event5DaysOldId} (Date: ${new Date(now - 5 * DAY_MS).toISOString()})`);
  console.log(`  3. Event Today ID:      ${eventTodayId} (Date: ${new Date(now).toISOString()})\n`);

  // Directly insert 3 events with explicit timestamps
  await db.insert(activityEvents).values([
    {
      eventId: event8DaysOldId,
      roomId,
      seq: 900001,
      occurredAt: new Date(now - 8 * DAY_MS),
      actorName: 'TestCleaner',
      actorType: 'system',
      eventType: 'code_edited',
    },
    {
      eventId: event5DaysOldId,
      roomId,
      seq: 900002,
      occurredAt: new Date(now - 5 * DAY_MS),
      actorName: 'TestCleaner',
      actorType: 'system',
      eventType: 'code_edited',
    },
    {
      eventId: eventTodayId,
      roomId,
      seq: 900003,
      occurredAt: new Date(now),
      actorName: 'TestCleaner',
      actorType: 'system',
      eventType: 'code_edited',
    },
  ]);

  console.log('--- Triggering 7-Day Auto Cleaner ---');
  const purgedCount = await eventService.cleanOldEvents(7);
  console.log(`Cleaner returned: Purged ${purgedCount} log entries.\n`);

  // Verify DB state for all 3 test events
  const remainingEvents = await db
    .select()
    .from(activityEvents)
    .where(inArray(activityEvents.eventId, [event8DaysOldId, event5DaysOldId, eventTodayId]));

  const remainingIds = remainingEvents.map((e) => e.eventId);
  let errors = 0;

  // Check 1: 8-day-old event must be deleted
  if (remainingIds.includes(event8DaysOldId)) {
    console.error(`❌ FAILED: 8-day-old event (${event8DaysOldId}) was NOT deleted!`);
    errors++;
  } else {
    console.log('✅ PASSED: 8-day-old event was successfully deleted.');
  }

  // Check 2: 5-day-old event must remain
  if (remainingIds.includes(event5DaysOldId)) {
    console.log('✅ PASSED: 5-day-old event remains intact.');
  } else {
    console.error(`❌ FAILED: 5-day-old event (${event5DaysOldId}) was incorrectly deleted!`);
    errors++;
  }

  // Check 3: Today's event must remain
  if (remainingIds.includes(eventTodayId)) {
    console.log('✅ PASSED: Today\'s event remains intact.');
  } else {
    console.error(`❌ FAILED: Today's event (${eventTodayId}) was incorrectly deleted!`);
    errors++;
  }

  // Cleanup test records from DB
  await db.delete(activityEvents).where(inArray(activityEvents.eventId, [event5DaysOldId, eventTodayId]));

  if (errors === 0) {
    console.log('\n🎉 AUTOMATIC ACTIVITY LOG CLEANER TEST PASSED 100% SUCCESSFULLY!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
