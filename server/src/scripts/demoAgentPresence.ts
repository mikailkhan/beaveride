import './setupTestEnv.js';
import { AgentService } from '../services/agentService.js';

async function main() {
  const roomId = Number(process.argv[2] || 1);
  const fileId = Number(process.argv[3] || 1);
  const serverPort = Number(process.env.PORT || 3000);

  console.log(`\n======================================================`);
  console.log(`🤖  BeaverBot Interactive Visual Demo (Phase 18)`);
  console.log(`======================================================`);
  console.log(`Connecting to Room ID: ${roomId}, Server Port: ${serverPort}\n`);

  const agentService = new AgentService();
  const { socket } = await agentService.connectAgentToRoom(roomId, serverPort);

  console.log(`[1/3] ✅ BeaverBot connected to Room ${roomId}!`);
  console.log(`👉 Look at your browser: You will see 🤖 BeaverBot in the top right collaborators list!`);
  console.log(`Waiting 5 seconds before acquiring lock...\n`);
  
  await new Promise((r) => setTimeout(r, 5000));

  console.log(`[2/3] 🔒 Requesting lock on fileId ${fileId} for BeaverBot...`);
  const lockPromise = new Promise<any>((resolve) => {
    socket.on('lock:acquired', (lockData: any) => resolve(lockData));
  });

  agentService.requestAgentLock(socket, {
    fileId,
    lockScope: 'file',
  });

  const lock = await lockPromise;

  console.log(`✅ Lock acquired! Lock ID: ${lock.id}`);
  console.log(`👉 Look at your browser: LockStatusBar now shows "🤖 BeaverBot BOT"!`);
  console.log(`👉 Try locking this file in your browser: You will see the Queue Banner "Waiting for 🤖 BeaverBot (BOT)"!`);
  console.log(`Holding lock for 20 seconds so you can observe the UI...\n`);

  await new Promise((r) => setTimeout(r, 20000));

  console.log(`[3/3] 🔓 Releasing lock...`);
  agentService.releaseAgentLock(socket, { fileId, lockId: lock.id });
  console.log(`✅ Lock released!`);

  await new Promise((r) => setTimeout(r, 2000));
  agentService.disconnectAgent(socket);
  console.log(`👋 BeaverBot disconnected cleanly.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Demo error:', err);
  process.exit(1);
});
