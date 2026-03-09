// Load .env from backend root (for CLERK_SECRET_KEY, DYNAMODB_ENDPOINT, etc.)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile =
  process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '..', '.env.development')
    : path.join(__dirname, '..', '.env');
dotenv.config({ path: envFile });
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});