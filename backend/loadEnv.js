/**
 * Load .env first so NODE_ENV and other vars are set before any other module runs.
 * override: true so .env wins over shell/system env (e.g. NODE_ENV=development in .env).
 */
import dotenv from 'dotenv';
dotenv.config({ override: true });
