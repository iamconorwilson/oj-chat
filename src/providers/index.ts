//for each folder in providers, import client.ts and run createClient function
import { readdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createClients = async () => {
  const providerFolders = readdirSync(__dirname, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  await Promise.all(providerFolders.map(async folder => {
    try {
      const clientModule = await import(`./${folder}/client.js`);
      if (clientModule.createClient) {
        await clientModule.createClient();
      }
    } catch (error) {
      console.error(`Failed to initialize client for provider: ${folder}`, error);
    }
  }));

}

export { createClients };