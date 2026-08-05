import { io, Socket } from 'socket.io-client';
import { UserRepository } from '../repositories/userRepository.js';
import { AuthService } from './authService.js';
import type { User } from '../repositories/userRepository.js';

export interface AgentLockPayload {
  fileId: number;
  lockScope?: 'file' | 'function';
  startLine?: number;
  endLine?: number;
  unitName?: string;
  includeUsages?: boolean;
}

export interface AgentWritePayload {
  fileId: number;
  update: Uint8Array | string;
  contentHash: string;
}

export interface AgentReleaseLockPayload {
  fileId: number;
  lockId: string;
}

export interface AgentRefreshBaselinePayload {
  fileId: number;
  lockId: string;
}

export class AgentService {
  private userRepository: UserRepository;
  private authService: AuthService;

  constructor(userRepository = new UserRepository(), authService = new AuthService(userRepository)) {
    this.userRepository = userRepository;
    this.authService = authService;
  }

  /**
   * Ensures the system agent user (BeaverBot) exists in the database.
   */
  async ensureAgentUser(): Promise<User> {
    let agent = await this.userRepository.findAgentUser();
    if (!agent) {
      agent = await this.userRepository.create({
        email: 'beaverbot@beaveride.internal',
        username: 'BeaverBot',
        firstName: 'Beaver',
        lastName: 'Bot 🤖',
        passwordHash: '$2b$12$eImiTXuWVxfM37uY4JANjO5E.y5bA5KxVdFvN7i2H/h6i2g5a4h/K',
        isAgent: true,
      });
    }
    return agent;
  }

  /**
   * Connects the BeaverBot agent to a specified room over WebSockets using standard JWT auth.
   * STRICT PARITY: The agent uses the exact same /room namespace and socket handshakes as human users.
   */
  async connectAgentToRoom(
    roomId: number,
    serverPort = 3000
  ): Promise<{ socket: Socket; agentUser: User }> {
    const agentUser = await this.ensureAgentUser();

    const safeAgentUser = {
      id: agentUser.id,
      email: agentUser.email,
      username: agentUser.username,
      firstName: agentUser.firstName,
      lastName: agentUser.lastName,
      isAgent: true,
      createdAt: agentUser.createdAt,
      updatedAt: agentUser.updatedAt,
    };

    const token = (this.authService as any).signToken(safeAgentUser);

    const socketUrl = `http://localhost:${serverPort}/room`;
    const socket = io(socketUrl, {
      auth: {
        token,
        roomId,
      },
      transports: ['websocket'],
      autoConnect: false,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error(`Agent socket connection timed out connecting to ${socketUrl}`));
      }, 10_000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        resolve({ socket, agentUser });
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(err);
      });

      socket.connect();
    });
  }

  /**
   * Emits standard lock:acquire socket event for the agent.
   */
  requestAgentLock(socket: Socket, payload: AgentLockPayload): void {
    socket.emit('lock:acquire', payload);
  }

  /**
   * Emits standard sync:update socket event carrying update payload & contentHash version reference.
   */
  applyAgentWrite(socket: Socket, payload: AgentWritePayload): void {
    socket.emit('sync:update', payload);
  }

  /**
   * Emits standard lock:refresh-baseline socket event to fetch fresh scope content hash.
   */
  refreshAgentBaseline(socket: Socket, payload: AgentRefreshBaselinePayload): void {
    socket.emit('lock:refresh-baseline', payload);
  }

  /**
   * Emits standard lock:release socket event for the agent.
   */
  releaseAgentLock(socket: Socket, payload: AgentReleaseLockPayload): void {
    socket.emit('lock:release', payload);
  }

  /**
   * Disconnects the agent socket cleanly, triggering server socket teardown and heartbeat cleanup.
   */
  disconnectAgent(socket: Socket): void {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  }
}

export const agentService = new AgentService();
