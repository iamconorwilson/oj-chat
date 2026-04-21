import { concurrently } from 'concurrently';

concurrently([
  { command: 'npm run dev:server', name: 'Server', prefixColor: 'blue' },
  { command: 'npm run dev:client', name: 'Client', prefixColor: 'green' }
], {
  prefix: 'name',
  killOthersOn: ['failure', 'success'],
  restartTries: 1
});