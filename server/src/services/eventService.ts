import { randomUUID } from 'crypto';
import { EventQueryFilters, EventRepository, PaginationOptions } from '../repositories/eventRepository.js';
import { ActivityEvent, NewActivityEvent } from '../types/activityTypes.js';

interface QueuedEvent {
  event: NewActivityEvent & { eventId: string; occurredAt: Date };
  attempts: number;
}

export class EventService {
  private repository: EventRepository;
  private queue: QueuedEvent[] = [];
  private isProcessing = false;
  private maxRetries = 5;
  private warningThreshold = 1000;

  constructor(repository = new EventRepository()) {
    this.repository = repository;
  }

  generateCorrelationId(): string {
    return randomUUID();
  }

  emit(event: NewActivityEvent): void {
    const stampedEvent = {
      ...event,
      eventId: event.eventId ?? randomUUID(),
      occurredAt: new Date(),
      actorType: event.actorType ?? 'human',
    };

    this.queue.push({ event: stampedEvent, attempts: 0 });

    if (this.queue.length > this.warningThreshold) {
      console.warn(`[EventService] WARN: Activity event queue depth reached ${this.queue.length} items.`);
    }

    this.scheduleDrain();
  }

  private scheduleDrain(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    setImmediate(() => {
      this.drainQueue().catch((err) => {
        console.error('[EventService] Unexpected error in drain loop:', err);
      });
    });
  }

  private async drainQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      try {
        await this.repository.append(item.event);
      } catch (err) {
        item.attempts += 1;
        console.error(
          `[EventService] Failed to persist event ${item.event.eventId} (attempt ${item.attempts}/${this.maxRetries}):`,
          err
        );

        if (item.attempts < this.maxRetries) {
          // Re-queue item with exponential backoff delay before processing next items for safety
          const delay = Math.pow(2, item.attempts - 1) * 100;
          await new Promise((res) => setTimeout(res, delay));
          this.queue.unshift(item);
        } else {
          console.error(
            `[EventService] EXHAUSTED RETRIES for event ${item.event.eventId} (type: ${item.event.eventType}, room: ${item.event.roomId}). Event dropped.`
          );
        }
      }
    }

    this.isProcessing = false;
  }

  async getLiveActivity(roomId: number, limit = 50): Promise<ActivityEvent[]> {
    return await this.repository.getRecentEvents(roomId, limit);
  }

  async queryByRoom(
    roomId: number,
    filters?: EventQueryFilters,
    pagination?: PaginationOptions
  ): Promise<{ events: ActivityEvent[]; total: number }> {
    return await this.repository.queryByRoom(roomId, filters, pagination);
  }

  async queryByCorrelation(correlationId: string): Promise<ActivityEvent[]> {
    return await this.repository.queryByCorrelation(correlationId);
  }

  async queryByFile(roomId: number, fileId: number): Promise<ActivityEvent[]> {
    return await this.repository.queryByFile(roomId, fileId);
  }

  async exportByRoom(roomId: number): Promise<ActivityEvent[]> {
    return await this.repository.exportByRoom(roomId);
  }
}

export const eventService = new EventService();
