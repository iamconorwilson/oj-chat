if (process.env.NODE_ENV === 'development') {
  process.loadEnvFile('.env.dev');
}

import { Server } from './server.js';
import { createClients } from './providers/index.js';
import { messageHandler } from './handler/message.js';
import { createCaches } from './handler/caches.js';

async function main() {

  await Promise.all([
    createCaches(),
    createClients(),
    messageHandler()
  ]);
  Server.getInstance();

}

main();