if (process.env.NODE_ENV === 'development') {
  process.loadEnvFile('.env.dev');
}

import { Server } from './server.js';
import { createClient } from './api/client.js';
import { messageHandler } from './handler/message.js';
import { createCaches } from './handler/caches.js';

async function main() {

  await Promise.all([
    createCaches(),
    createClient(),
    messageHandler()
  ]);
  Server.getInstance();

}

main();