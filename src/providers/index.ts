import { createClient as createTwitchClient } from './twitch/client.js';

const createClients = async () => {
  try {
    await Promise.all([
      createTwitchClient()
    ]);
  } catch (error) {
    console.error(`Failed to initialize clients: ${error}`);
  }
}

export { createClients };