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
    let heldLockId: string | null = null;
    let targetFileId: number | null = task.targetFileId ?? null;

    try {
      checkAborted();
      // ----------------------------------------------------------------------
      // STAGE 1: PLANNING
      // ----------------------------------------------------------------------
      await sleep(1500);
      checkAborted();
      console.log(`[TaskManager] Task ${taskId} entering PLANNING stage...`);

      // Find a target file in the room if not already set
      if (!targetFileId) {
        const tree = await fileRepository.getFileTree(roomId).catch(() => []);
        const targetFile = tree.find((f) => f.type === 'file');
        if (!targetFile) {
          throw new Error('No target project file found in room for BeaverBot task execution');
        }
        targetFileId = targetFile.id;
      }

      const targetFileRow = await fileRepository.getFileById(targetFileId);
      const targetFileName = targetFileRow?.name || 'untitled.ts';
      const initialYText = getOrCreateFileText(roomId, targetFileId);
      const existingContentAtPlan = initialYText.toString();

      const planSummary = await llmService.generatePlan(task.instruction, existingContentAtPlan, targetFileName);
      await taskRepository.updateTaskStatus(taskId, 'planning', 'planning', {
        targetFileId,
        planSummary,
      });

      this.broadcastTaskUpdate(roomId, io, {
        taskId,
        status: 'planning',
        currentStage: 'planning',
        targetFileId,
        targetFileName,
        planSummary,
      });

      eventService.emit({
        roomId,
        actorId: task.agentUserId,
        actorName: 'BeaverBot',
        actorType: 'agent',
        eventType: 'agent_stage_planning',
        targetFileId,
        targetScope: 'file',
        outcome: 'applied',
        metadata: { taskId, planSummary },
      });

      // ----------------------------------------------------------------------
      // STAGE 2: WAITING (Lock Acquisition)
      // ----------------------------------------------------------------------
      await sleep(1500);
      checkAborted();
      console.log(`[TaskManager] Task ${taskId} entering WAITING stage...`);

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
        targetFileId,
        targetScope: 'file',
        outcome: 'queued',
        metadata: { taskId },
      });

      // Connect BeaverBot over Socket.IO
      const { socket } = await agentService.connectAgentToRoom(roomId, port);
      agentSocket = socket as unknown as ClientSocketType;
      checkAborted();

      // Request lock and wait for lock:acquired or lock:granted
      const lockAcquiredPromise = new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timed out waiting for lock acquisition')), 15000);

        const onAcquired = (data: any) => {
          clearTimeout(timer);
          agentSocket?.off('lock:acquired', onAcquired);
          agentSocket?.off('lock:granted', onGranted);
          resolve(data.lock || data);
        };

        const onGranted = (data: any) => {
          clearTimeout(timer);
          agentSocket?.off('lock:acquired', onAcquired);
          agentSocket?.off('lock:granted', onGranted);
          resolve(data.lock || data);
        };

        agentSocket?.on('lock:acquired', onAcquired);
        agentSocket?.on('lock:granted', onGranted);
      });

      const queueStartTime = Date.now();
      agentService.requestAgentLock(agentSocket as any, { fileId: targetFileId, lockScope: 'file' });
      const lockInfo = await lockAcquiredPromise;
      const waitTime = Date.now() - queueStartTime;
      metricsService.recordQueueWaitTime(taskId, waitTime);
      heldLockId = lockInfo.id;
      checkAborted();

      console.log(`[TaskManager] BeaverBot acquired lock ${heldLockId} on file ${targetFileId}`);

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

      eventService.emit({
        roomId,
        actorId: task.agentUserId,
        actorName: 'BeaverBot',
        actorType: 'agent',
        eventType: 'agent_stage_writing',
        targetFileId,
        targetScope: 'file',
        outcome: 'applied',
        metadata: { taskId, lockId: heldLockId },
      });

      // Get existing content and doc from Yjs store
      const doc = await getOrCreateDoc(roomId);
      const yText = getOrCreateFileText(roomId, targetFileId);
      const existingContent = yText.toString();
      const targetFileRowForWrite = await fileRepository.getFileById(targetFileId);
      const targetFileNameForWrite = targetFileRowForWrite?.name || 'untitled.ts';
      const currentPlanSummary = task.planSummary || `Plan: Implement instruction "${task.instruction}"`;

      const generatedCode = await llmService.generateCode(
        task.instruction,
        existingContent,
        targetFileNameForWrite,
        currentPlanSummary
      );

      checkAborted();

      // Apply update directly to Yjs text document and capture the sync update
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

      // Compute updated content hash and sync lockStore
      const newHash = computeScopeHash(generatedCode, 'file');
      if (heldLockId) {
        updateLockContentHash(roomId, targetFileId, heldLockId, newHash);
      }

      // Emit write:accepted back to BeaverBot agent socket
      if (agentSocket && agentSocket.connected) {
        agentSocket.emit('write:accepted', { fileId: targetFileId, contentHash: newHash });
      }

      await taskRepository.updateTaskStatus(taskId, 'writing', 'writing', {
        generatedCode,
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

      eventService.emit({
        roomId,
        actorId: task.agentUserId,
        actorName: 'BeaverBot',
        actorType: 'agent',
        eventType: 'agent_stage_verifying',
        targetFileId,
        targetScope: 'file',
        outcome: 'applied',
        metadata: { taskId },
      });

      // Read back final Yjs content and perform LLM verification
      const finalContent = getFileContent(roomId, targetFileId) || '';
      const targetFileRowForVerify = await fileRepository.getFileById(targetFileId);
      const targetFileNameForVerify = targetFileRowForVerify?.name || 'untitled.ts';

      const verification = await llmService.verifyCode(task.instruction, finalContent, targetFileNameForVerify);
      if (!verification.isValid) {
        throw new Error(`Verification failed: ${verification.issues.join(', ')}`);
      }

      checkAborted();

      // ----------------------------------------------------------------------
      // STAGE 5: COMPLETED
      // ----------------------------------------------------------------------
      console.log(`[TaskManager] Task ${taskId} COMPLETED cleanly!`);
      const completedAt = new Date();

      if (heldLockId) {
        agentService.releaseAgentLock(agentSocket as any, { fileId: targetFileId, lockId: heldLockId });
        heldLockId = null;
      }

      if (agentSocket) {
        agentService.disconnectAgent(agentSocket as any);
        agentSocket = null;
      }

      await taskRepository.updateTaskStatus(taskId, 'completed', 'completed', {
        completedAt,
      });

      const targetFileRowCompleted = await fileRepository.getFileById(targetFileId);
      const targetFileNameCompleted = targetFileRowCompleted?.name || 'untitled.ts';

      this.broadcastTaskUpdate(roomId, io, {
        taskId,
        status: 'completed',
        currentStage: 'completed',
        targetFileId,
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
        targetFileId,
        targetScope: 'file',
        outcome: 'completed',
        metadata: { taskId },
      });
      
      metricsService.recordAgentTaskOutcome('completed');
    } catch (err: any) {
      if (agentSocket && heldLockId && targetFileId) {
        try {
          agentService.releaseAgentLock(agentSocket as any, { fileId: targetFileId, lockId: heldLockId });
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
          targetFileId: targetFileId ?? undefined,
          outcome: 'cancelled',
          reason: 'cancelled_by_participant',
          metadata: { taskId },
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
          targetFileId: targetFileId ?? undefined,
          outcome: 'failed',
          reason: 'execution_error',
          metadata: { taskId, failureReason },
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
