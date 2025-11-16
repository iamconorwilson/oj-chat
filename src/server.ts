import Express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { TwitchEventSubClient } from './api/routes/eventsub-ws.js';
import { EmoteCache } from './handler/cache/emotes.js';
import { runWithRetry } from './utils/runWithRetry.js';

const version = process.env.npm_package_version;

export class Server {
  private static instance: Server;
  private app!: Express.Express;
  private server!: ReturnType<typeof createServer>;
  private wss!: WebSocketServer;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): Server {
    if (!Server.instance) {
      Server.instance = new Server();
    }
    return Server.instance;
  }

  private initialize() {
    this.app = Express();
    this.server = createServer(this.app);

    this.app.use(Express.static('./public'));

    const PORT = process.env.PORT || 3000;

    this.wss = new WebSocketServer({ server: this.server, clientTracking: true, path: '/ws' });
    this.wss.on('connection', async (ws) => {
      console.log(`A user connected. Total clients: ${this.wss.clients.size}`);

      // Ensure Twitch EventSub WS connection
      const twitchListener = await runWithRetry(twitchConnect);

      const seventvListener = await runWithRetry(seventvConnect);

      ws.send(JSON.stringify({ type: 'version', data: version }));

      ws.on('message', (message) => {
        const messageObj = JSON.parse(message.toString());
        if (messageObj.type === "clientError") {
          console.error('Client Error:', messageObj.data);
        }
      });

      ws.on('close', async () => {
        console.log(`A user disconnected. Total clients: ${this.wss.clients.size}`);
        if (this.wss.clients.size === 0) {
          console.log('No clients connected. Disconnecting from Twitch EventSub WS and 7TV WebSocket.');
          if (twitchListener && await twitchListener.isConnected()) {
            twitchListener.disconnect();
          }
          if (seventvListener && seventvListener.isConnected()) {
            seventvListener.disconnect();
          }
        }
      });
    });

    this.app.get('/health', async (req, res) => {
      const listener = TwitchEventSubClient.getInstance();
      const twitchConnected = (listener && await listener.isConnected()) ? true : false;

      res.status(200).json({
        status: 'OK',
        version: version,
        uptime: formatUptime(Math.floor(process.uptime())),
        connectedClients: this.wss.clients.size,
        connectedToTwitch: twitchConnected
      });
    });

    this.server.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  }

  public emit(data: Record<string, unknown>) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }
}

function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs}h ${mins}m ${secs}s`;
}

async function twitchConnect() {
  if (TwitchEventSubClient.hasInstance()) {
    const listener = TwitchEventSubClient.getInstance();
    if (!(await listener.isConnected())) {
      await listener.connect();
      return listener;
    }
    return listener;
  } else {
    throw new Error('Listener singleton not yet created.');
  }

}

async function seventvConnect() {
  if (EmoteCache.hasInstance()) {
    const emoteCache = EmoteCache.getInstance();
    const seventvWs = emoteCache.getSevenTVWebSocket();
    if (seventvWs && !seventvWs.isConnected()) {
      seventvWs.connect();
      return seventvWs;
    }
    return seventvWs;
  } else {
    throw new Error('EmoteCache singleton not yet created.');
  }
}