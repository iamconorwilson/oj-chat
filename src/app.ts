const envFile = process.env.NODE_ENV === 'development' ? '.env.dev' : '';
process.loadEnvFile(envFile);

import { Server } from './server.js';
import { createClient } from './api/client.js';
import { messageHandler } from './handler/message.js';
import { createCaches } from './handler/caches.js';

async function main() {

  await createCaches();
  await createClient();
  await messageHandler();
  Server.getInstance();

}

main();