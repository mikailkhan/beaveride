import { and, desc, eq, notInArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../db/client.js';
import { agentTasks } from '../db/schema.js';
import { AgentTask, AgentTaskStatus, NewAgentTask } from '../types/taskTypes.js';

export class TaskRepository {
  /**
   * Inserts a new agent task row into PostgreSQL.
   */
  async createTask(data: NewAgentTask): Promise<AgentTask> {
    const taskId = data.taskId || randomUUID();
    const status = data.status || 'assigned';
    const currentStage = data.currentStage || status;

    const [inserted] = await db
      .insert(agentTasks)
      .values({
        taskId,
        roomId: data.roomId,
        assignedBy: data.assignedBy,
        agentUserId: data.agentUserId,
        targetFileId: data.targetFileId ?? null,
        instruction: data.instruction,
        status,
        currentStage,
        planSummary: data.planSummary ?? null,
        generatedCode: data.generatedCode ?? null,
        failureReason: data.failureReason ?? null,
        metadata: data.metadata ?? null,
      })
      .returning();

    return inserted as AgentTask;
  }

  /**
   * Retrieves an agent task by its UUID.
   */
  async getTaskById(taskId: string): Promise<AgentTask | null> {
    const [row] = await db.select().from(agentTasks).where(eq(agentTasks.taskId, taskId));
    return (row as AgentTask) || null;
  }

  /**
   * Retrieves recent tasks for a room ordered by createdAt descending.
   */
  async getTasksForRoom(roomId: number, limit = 50): Promise<AgentTask[]> {
    const rows = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.roomId, roomId))
      .orderBy(desc(agentTasks.createdAt))
      .limit(limit);

    return rows as AgentTask[];
  }

  /**
   * Updates task status, current stage, and optional fields (planSummary, generatedCode, etc).
   */
  async updateTaskStatus(
    taskId: string,
    status: AgentTaskStatus,
    currentStage: string,
    extra: {
      planSummary?: string | null;
      generatedCode?: string | null;
      failureReason?: string | null;
      targetFileId?: number | null;
      completedAt?: Date | null;
      metadata?: Record<string, unknown> | null;
    } = {}
  ): Promise<AgentTask | null> {
    const now = new Date();
    const updateData: Record<string, unknown> = {
      status,
      currentStage,
      updatedAt: now,
    };

    if (extra.planSummary !== undefined) updateData.planSummary = extra.planSummary;
    if (extra.generatedCode !== undefined) updateData.generatedCode = extra.generatedCode;
    if (extra.failureReason !== undefined) updateData.failureReason = extra.failureReason;
    if (extra.targetFileId !== undefined) updateData.targetFileId = extra.targetFileId;
    if (extra.metadata !== undefined) updateData.metadata = extra.metadata;
    if (extra.completedAt !== undefined) updateData.completedAt = extra.completedAt;
    else if (['completed', 'failed', 'cancelled'].includes(status)) {
      updateData.completedAt = now;
    }

    const [updated] = await db
      .update(agentTasks)
      .set(updateData)
      .where(eq(agentTasks.taskId, taskId))
      .returning();

    return (updated as AgentTask) || null;
  }

  /**
   * Returns any task in the room that is currently active (status not in completed, failed, cancelled).
   */
  async getActiveTaskForRoom(roomId: number): Promise<AgentTask | null> {
    const [row] = await db
      .select()
      .from(agentTasks)
      .where(
        and(
          eq(agentTasks.roomId, roomId),
          notInArray(agentTasks.status, ['completed', 'failed', 'cancelled'])
        )
      )
      .orderBy(desc(agentTasks.createdAt))
      .limit(1);

    return (row as AgentTask) || null;
  }
}

export const taskRepository = new TaskRepository();
