import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Fix DATABASE_URL when executing scripts on host outside docker container (maps container port 5432 to host port 5431)
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('@postgres:5432')) {
  process.env.DATABASE_URL = 'postgresql://beaveride:beaveride_dev_password@127.0.0.1:5431/beaveride';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = '86cbc2868090266c3ee4ac7b68cf5f8b263f2155d28f05402d9f191acb773277ff4e2813bcc37c3c805fef3222d76cba';
}
