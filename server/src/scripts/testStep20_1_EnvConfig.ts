import { env } from '../config/env.js';

async function main() {
  console.log('--- Step 20.1 Environment Configuration Test ---');
  
  if (typeof env.OLLAMA_BASE_URL !== 'string' || !env.OLLAMA_BASE_URL.startsWith('http')) {
    throw new Error(`Invalid OLLAMA_BASE_URL: ${env.OLLAMA_BASE_URL}`);
  }
  console.log(`✓ OLLAMA_BASE_URL: ${env.OLLAMA_BASE_URL}`);

  if (typeof env.OLLAMA_MODEL !== 'string' || env.OLLAMA_MODEL.length === 0) {
    throw new Error(`Invalid OLLAMA_MODEL: ${env.OLLAMA_MODEL}`);
  }
  console.log(`✓ OLLAMA_MODEL: ${env.OLLAMA_MODEL}`);

  console.log('✓ Step 20.1 env config verification successful!');
}

main().catch((err) => {
  console.error('❌ Step 20.1 Test Failed:', err);
  process.exit(1);
});
