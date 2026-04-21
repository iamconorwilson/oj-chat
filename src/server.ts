import Express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { TwitchEventSubWebhook } from './providers/twitch/routes/eventsub-webhook.js';
import { EmoteCache } from './handler/caches/emotes.js';
import { runWithRetry } from './utils/runWithRetry.js';
import { EmittedMessage } from './types/emittedMessages.js';

const version = process.env.npm_package_version;

export class Server {
  private static instance: Server;
  private app!: Express.Express;
  private server!: ReturnType<typeof createServer>;
  private io!: SocketIOServer;
  private disconnectTimer?: NodeJS.Timeout;
  private readonly DISCONNECT_DELAY = 3 * 60 * 1000; // 3 minutes

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

    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.io.on('connection', async (socket) => {
      console.log(`A user connected. Total clients: ${this.io.engine.clientsCount}`);

      if (this.disconnectTimer) {
        clearTimeout(this.disconnectTimer);
        this.disconnectTimer = undefined;
        console.log('Cancelled scheduled disconnect because a client reconnected.');
      }

      const emoteListener = await runWithRetry(emoteConnect);

      socket.emit('version', version);

      socket.on('clientError', (data) => {
        console.error('Client Error:', data);
      });

      socket.on('disconnect', async () => {
        console.log(`A user disconnected. Total clients: ${this.io.engine.clientsCount}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (this.io.engine.clientsCount === 0) {
          console.log(`No clients connected. Scheduling disconnect in ${this.DISCONNECT_DELAY / 1000}s.`);
          if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
          }
          this.disconnectTimer = setTimeout(async () => {
            if (this.io.engine.clientsCount === 0) {
              if (emoteListener && emoteListener.isConnected()) {
                emoteListener.disconnect();
              }
            } else {
              console.log('Clients reconnected before disconnect. Aborting disconnect.');
            }
            this.disconnectTimer = undefined;
          }, this.DISCONNECT_DELAY);
        }
      });
    });

    this.app.post('/api/twitch/eventsub', Express.raw({ type: 'application/json' }), (req, res, next) => {
      TwitchEventSubWebhook.getInstance().handleWebhook(req, res, next);
    });

    this.app.get('/health', async (req, res) => {
      const twitchConnected = true; // Webhooks are always "connected" if the server is up

      res.status(200).json({
        status: 'OK',
        version: version,
        uptime: formatUptime(Math.floor(process.uptime())),
        connectedClients: this.io.engine.clientsCount,
        connectedToTwitch: twitchConnected
      });
    });

    this.server.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  }

  public emit(payload: EmittedMessage) {
    const data = 'data' in payload ? payload.data : {};
    this.io.emit(payload.type, data);
    console.log(JSON.stringify(payload));
  }
}

function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs}h ${mins}m ${secs}s`;
}



async function emoteConnect(): Promise<EmoteCache> {
  const emoteCache = await EmoteCache.getInstance();
  if (!emoteCache) throw new Error('EmoteCache singleton not yet created.');
  if (!emoteCache.isConnected()) {
    emoteCache.connect();
  }
  return emoteCache;
}
