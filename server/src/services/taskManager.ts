import { Server as SocketServer } from 'socket.io';
import { Socket as ClientSocketType } from 'socket.io-client';
import * as Y from 'yjs';
import { taskRepository } from '../repositories/taskRepository.js';
import { FileRepository } from '../repositories/fileRepository.js';
import { eventService } from './eventService.js';
import { agentService } from './agentService.js';
import { llmService } from './llmService.js';
import { computeScopeHash } from '../utils/contentHash.js';
import { updateLockContentHash } from '../sockets/lockStore.js';
import { getDoc, getOrCreateDoc, getOrCreateFileText, getFileContent, updateDoc } from '../sockets/docStore.js';
import { AgentTask } from '../types/taskTypes.js';
import { metricsService } from '../utils/metricsService.js';

const fileRepository = new FileRepository();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class TaskManager {
  private activeTaskControllers = new Map<string, AbortController>();

  /**
   * Cancels an active in-flight task by aborting its execution controller.
   */
  cancelTask(taskId: string): boolean {
    const controller = this.activeTaskControllers.get(taskId);
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  }

  /**
   * Main entry point to orchestrate a task through its lifecycle state machine.
   */
  async executeTask(taskId: string, roomId: number, io: SocketServer, port = 3000): Promise<void> {
    const task = await taskRepository.getTaskById(taskId);
    if (!task) {
      console.error(`[TaskManager] Task ${taskId} not found in database`);
      return;
    }

    const controller = new AbortController();
    this.activeTaskControllers.set(taskId, controller);

    const checkAborted = () => {
      if (controller.signal.aborted) {
        throw new Error('TASK_CANCELLED_BY_USER');
      }
    };

    let agentSocket: ClientSocketType | null = null;
    let heldGroupId: string | null = null;
    let targetFileIds: number[] = task.targetFileId ? [task.targetFileId] : [];

    try {
      checkAborted();
      // ----------------------------------------------------------------------
      // STAGE 1: PLANNING
      // ----------------------------------------------------------------------
      await sleep(1500);
      checkAborted();
      console.log(`[TaskManager] Task ${taskId} entering PLANNING stage...`);

      // Determine initial file for context
      const tree = await fileRepository.getFileTree(roomId).catch(() => []);
      let initialFileId = targetFileIds[0] || tree.find((f) => f.type === 'file')?.id;
      if (!initialFileId) {
        throw new Error('No target project file found in room for BeaverBot task execution');
      }

      const initialTargetRow = await fileRepository.getFileById(initialFileId);
      const initialFileName = initialTargetRow?.name || 'untitled.ts';
      const initialYText = getOrCreateFileText(roomId, initialFileId);
      const existingContentAtPlan = initialYText.toString();

      const planResult = await llmService.generatePlan(task.instruction, existingContentAtPlan, initialFileName);
      const planSummary = planResult.planSummary;
      
      targetFileIds = [];
      for (const reqFileName of planResult.targetFiles) {
        let matchedFile = tree.find(f => f.type === 'file' && f.name.endsWith(reqFileName.split('/').pop() || reqFileName));
        if (matchedFile) {
           targetFileIds.push(matchedFile.id);
        }
      }
      
      if (targetFileIds.length === 0) {
         targetFileIds.push(initialFileId);
      }

      await taskRepository.updateTaskStatus(taskId, 'planning', 'planning', {
        planSummary,
        metadata: { targetFileIds },
      });

      this.broadcastTaskUpdate(roomId, io, {
        taskId,
        status: 'planning',
        currentStage: 'planning',
        planSummary,
      });

      eventService.emit({
        roomId,
        actorId: task.agentUserId,
        actorName: 'BeaverBot',
        actorType: 'agent',
        eventType: 'agent_stage_planning',
        targetFileId: targetFileIds[0],
        targetScope: 'file',
        outcome: 'applied',
        metadata: { taskId, planSummary, targetFileIds },
      });

      // ----------------------------------------------------------------------
      // STAGE 2: WAITING (Lock Acquisition)
      // ----------------------------------------------------------------------
      await sleep(1500);
      checkAborted();
      console.log(`[TaskManager] Task ${taskId} entering WAITING stage for usage lock...`);

      await taskRepository.updateTaskStatus(taskId, 'waiting', 'waiting');
      this.broadcastTaskUpdate(roomId, io, {
        taskId,
        status: 'waiting',
        currentStage: 'waiting',
      });

      eventService.emit({
        roomId,
        actorId: task.agentUserId,
        actorName: 'BeaverBot',
        actorType: 'agent',
        eventType: 'agent_stage_waiting',
        targetFileId: targetFileIds[0],
        targetScope: 'file',
        outcome: 'queued',
        metadata: { taskId, targetFileIds },
      });

      const { socket } = await agentService.connectAgentToRoom(roomId, port);
      agentSocket = socket as unknown as ClientSocketType;
      checkAborted();

      const lockAcquiredPromise = new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timed out waiting for usage lock acquisition')), 30000);

        const onUsageAcquired = (data: any) => {
          clearTimeout(timer);
          agentSocket?.off('lock:usage-acquired', onUsageAcquired);
          resolve(data.metadata?.groupId || data.groupId || 'agent-group');
        };

        agentSocket?.on('lock:usage-acquired', onUsageAcquired);
      });

      const queueStartTime = Date.now();
      const usageSpans = targetFileIds.map(fId => ({ fileId: fId, startLine: 1, endLine: 999999 }));
      const groupId = `agent-task-${taskId}`;
      agentService.requestAgentUsageLock(agentSocket as any, { groupId, usageSpans });
      
      heldGroupId = await lockAcquiredPromise;
      const waitTime = Date.now() - queueStartTime;
      metricsService.recordQueueWaitTime(taskId, waitTime);
      checkAborted();

      console.log(`[TaskManager] BeaverBot acquired usage lock group ${heldGroupId} for files ${targetFileIds.join(',')}`);

      // ----------------------------------------------------------------------
      // STAGE 3: WRITING (Code Generation & Yjs Sync)
      // ----------------------------------------------------------------------
      await sleep(1500);
      checkAborted();
      console.log(`[TaskManager] Task ${taskId} entering WRITING stage...`);

      await taskRepository.updateTaskStatus(taskId, 'writing', 'writing');
      this.broadcastTaskUpdate(roomId, io, {
        taskId,
        status: 'writing',
        currentStage: 'writing',
      });

      const doc = await getOrCreateDoc(roomId);
      
      let allGeneratedCode = '';

      for (const fileId of targetFileIds) {
        eventService.emit({
          roomId,
          actorId: task.agentUserId,
          actorName: 'BeaverBot',
          actorType: 'agent',
          eventType: 'agent_stage_writing',
          targetFileId: fileId,
          targetScope: 'file',
          outcome: 'applied',
          metadata: { taskId, groupId: heldGroupId },
        });

        const yText = getOrCreateFileText(roomId, fileId);
        const existingContent = yText.toString();
        const targetFileRow = await fileRepository.getFileById(fileId);
        const targetFileName = targetFileRow?.name || 'untitled.ts';

        const generatedCode = await llmService.generateCode(
          task.instruction,
          existingContent,
          targetFileName,
          planSummary
        );
        allGeneratedCode += `\n// File: ${targetFileName}\n${generatedCode}`;

        checkAborted();

        let serverUpdate: Uint8Array | null = null;
        const onUpdate = (update: Uint8Array) => {
          serverUpdate = update;
        };
        doc.on('update', onUpdate);
        doc.transact(() => {
          yText.delete(0, yText.length);
          yText.insert(0, generatedCode);
        });
        doc.off('update', onUpdate);

        if (serverUpdate) {
          io.of('/room').to(`room:${roomId}`).emit('sync:update', serverUpdate);
          updateDoc(roomId, serverUpdate, task.agentUserId);
        }

        const newHash = computeScopeHash(generatedCode, 'file');
        
        // Let the client know the write is accepted
        if (agentSocket && agentSocket.connected) {
          agentSocket.emit('write:accepted', { fileId, contentHash: newHash });
        }
      }

      await taskRepository.updateTaskStatus(taskId, 'writing', 'writing', {
        generatedCode: allGeneratedCode,
      });

      // ----------------------------------------------------------------------
      // STAGE 4: VERIFYING
      // ----------------------------------------------------------------------
      await sleep(1500);
      checkAborted();
      console.log(`[TaskManager] Task ${taskId} entering VERIFYING stage...`);

      await taskRepository.updateTaskStatus(taskId, 'verifying', 'verifying');
      this.broadcastTaskUpdate(roomId, io, {
        taskId,
        status: 'verifying',
        currentStage: 'verifying',
      });

      for (const fileId of targetFileIds) {
        eventService.emit({
          roomId,
          actorId: task.agentUserId,
          actorName: 'BeaverBot',
          actorType: 'agent',
          eventType: 'agent_stage_verifying',
          targetFileId: fileId,
          targetScope: 'file',
          outcome: 'applied',
          metadata: { taskId },
        });

        const finalContent = getFileContent(roomId, fileId) || '';
        const targetFileRow = await fileRepository.getFileById(fileId);
        const targetFileName = targetFileRow?.name || 'untitled.ts';

        const verification = await llmService.verifyCode(task.instruction, finalContent, targetFileName);
        if (!verification.isValid) {
          throw new Error(`Verification failed for ${targetFileName}: ${verification.issues.join(', ')}`);
        }
      }

      checkAborted();

      // ----------------------------------------------------------------------
      // STAGE 5: COMPLETED
      // ----------------------------------------------------------------------
      console.log(`[TaskManager] Task ${taskId} COMPLETED cleanly!`);
      const completedAt = new Date();

      if (heldGroupId) {
        agentService.releaseAgentUsageLock(agentSocket as any, { groupId: heldGroupId });
        heldGroupId = null;
      }

      if (agentSocket) {
        agentService.disconnectAgent(agentSocket as any);
        agentSocket = null;
      }

      await taskRepository.updateTaskStatus(taskId, 'completed', 'completed', {
        completedAt,
      });

      const targetFileRowCompleted = await fileRepository.getFileById(targetFileIds[0]);
      const targetFileNameCompleted = targetFileRowCompleted?.name || 'untitled.ts';

      this.broadcastTaskUpdate(roomId, io, {
        taskId,
        status: 'completed',
        currentStage: 'completed',
        targetFileId: targetFileIds[0],
        targetFileName: targetFileNameCompleted,
        planSummary: task.planSummary,
        completedAt: completedAt.toISOString(),
      });

      eventService.emit({
        roomId,
        actorId: task.agentUserId,
        actorName: 'BeaverBot',
        actorType: 'agent',
        eventType: 'agent_task_completed',
        targetFileId: targetFileIds[0],
        targetScope: 'file',
        outcome: 'completed',
        metadata: { taskId, targetFileIds },
      });
      
      metricsService.recordAgentTaskOutcome('completed');
    } catch (err: any) {
      if (heldGroupId && agentSocket && agentSocket.connected) {
        try {
          agentService.releaseAgentUsageLock(agentSocket as any, { groupId: heldGroupId });
        } catch {}
      }

      if (agentSocket) {
        try {
          agentService.disconnectAgent(agentSocket as any);
        } catch {}
      }

      const isCancelled = err?.message === 'TASK_CANCELLED_BY_USER' || controller.signal.aborted;
      const completedAt = new Date();

      if (isCancelled) {
        console.log(`[TaskManager] Task ${taskId} CANCELLED by user cleanly.`);
        await taskRepository.updateTaskStatus(taskId, 'cancelled', 'cancelled', {
          completedAt,
        });

        this.broadcastTaskUpdate(roomId, io, {
          taskId,
          status: 'cancelled',
          currentStage: 'cancelled',
          completedAt: completedAt.toISOString(),
        });

        eventService.emit({
          roomId,
          actorId: task.assignedBy,
          actorName: 'Human',
          actorType: 'human',
          eventType: 'agent_task_cancelled',
          targetFileId: targetFileIds[0] ?? undefined,
          outcome: 'cancelled',
          reason: 'cancelled_by_participant',
          metadata: { taskId, targetFileIds },
        });

        metricsService.recordAgentTaskOutcome('cancelled');
      } else {
        console.error(`[TaskManager] Task ${taskId} failed:`, err);
        const failureReason = err instanceof Error ? err.message : 'Unknown task execution error';

        await taskRepository.updateTaskStatus(taskId, 'failed', 'failed', {
          failureReason,
          completedAt,
        });

        this.broadcastTaskUpdate(roomId, io, {
          taskId,
          status: 'failed',
          currentStage: 'failed',
          failureReason,
          completedAt: completedAt.toISOString(),
        });

        eventService.emit({
          roomId,
          actorId: task.agentUserId,
          actorName: 'BeaverBot',
          actorType: 'agent',
          eventType: 'agent_task_failed',
          targetFileId: targetFileIds[0] ?? undefined,
          outcome: 'failed',
          reason: 'execution_error',
          metadata: { taskId, failureReason, targetFileIds },
        });

        metricsService.recordAgentTaskOutcome('failed');
      }
    } finally {
      this.activeTaskControllers.delete(taskId);
    }
  }

  /**
   * Broadcasts real-time task stage update and live activity feed to all room clients.
   */
  private async broadcastTaskUpdate(roomId: number, io: SocketServer, payload: Record<string, unknown>): Promise<void> {
    io.of('/room').to(`room:${roomId}`).emit('agent:task_update', payload);
    try {
      const activities = await eventService.getLiveActivity(roomId);
      io.of('/room').to(`room:${roomId}`).emit('activity:update', activities);
    } catch (err) {
      console.error(`[TaskManager] Failed to broadcast live activity feed for room ${roomId}:`, err);
    }
  }
}

export const taskManager = new TaskManager();
