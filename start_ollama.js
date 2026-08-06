const { spawn, execSync } = require('child_process');

console.log("=========================================");
console.log("🦫 BeaverIDE - Docker Ollama Link");
console.log("=========================================");

// 1. Quit the Mac menu bar app if it is running so it frees up port 11434
try {
  // If this throws, Ollama isn't running
  execSync(`pgrep -x "Ollama"`, { stdio: 'ignore' });
  
  console.log("🛑 Quitting the background Ollama Mac app to free the port...");
  execSync(`osascript -e 'quit app "Ollama"'`);
  
  // Wait for 2 seconds to allow graceful shutdown
  execSync('sleep 2');
} catch (e) {
  // pgrep exited with non-zero, meaning Ollama is not running in the background. Safe to proceed.
}

console.log("🚀 Starting Ollama for Docker...");
console.log("🔒 Port is OPEN (Bound to 0.0.0.0)");
console.log("❌ Press Ctrl+C at any time to kill the server and CLOSE the port.");
console.log("-----------------------------------------");

// 2. Run ollama serve bound to 0.0.0.0 so Docker can reach it.
const ollamaProcess = spawn('ollama', ['serve'], {
  stdio: 'inherit', // Stream logs directly to this terminal
  env: {
    ...process.env,
    OLLAMA_HOST: '0.0.0.0'
  }
});

// 3. Gracefully kill the ollama process when the user stops the script
const shutdown = () => {
  console.log("\n🔌 Shutting down Ollama and closing the port...");
  ollamaProcess.kill('SIGTERM');
  process.exit(0);
};

// Listen for Ctrl+C
process.on('SIGINT', shutdown);
// Listen for standard kill signals
process.on('SIGTERM', shutdown);

ollamaProcess.on('close', (code) => {
  console.log(`Ollama exited with code ${code}`);
  process.exit(code || 0);
});
