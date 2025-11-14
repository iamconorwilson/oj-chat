import dotenv from 'dotenv';
if (process.env.NODE_ENV === 'development') {
  console.log('Loading .env.dev file for development environment...');
  dotenv.config({ path: '.env.dev', quiet: true });
} else {
  dotenv.config({ quiet: true });
}

import { Server } from './server.js';
import { createClient } from './api/client.js';
import { messageHandler } from './handler/message.js';
import { createCaches } from './handler/caches.js';
import path from 'path';

async function main() {

  const secretsFile = path.resolve(process.env.SECRETS_DIR || '', 'twitch_user_token.json');
  console.log(`Using secrets file at: ${secretsFile}`);

  Server.getInstance();
  await createCaches();
  await createClient();
  await messageHandler();
}

main();