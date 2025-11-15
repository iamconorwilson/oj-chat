import { EventEmitter } from 'events';
import WebSocket from 'ws';
import type { TwitchProvider } from '../twitch.js';

export class TwitchEventSubClient extends EventEmitter {
  private WEBSOCKET_URL: string | undefined;

  private apiClient: TwitchProvider;
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;

  constructor(apiClient: TwitchProvider) {
    super();
    this.apiClient = apiClient;
  }

  /**
   * Connects to the Twitch EventSub WebSocket server.
   */
  public async connect() {
    
    this.WEBSOCKET_URL = process.env.TWITCH_WS_ENDPOINT;

    if (!this.WEBSOCKET_URL) {
      throw new Error('Twitch EventSub WebSocket URL is not defined in environment variables.');
    }

    const wsUrl = `${this.WEBSOCKET_URL}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log('Connected to Twitch EventSub Websocket');
    });

    this.ws.on('message', (data) => {
      const message: TwitchEventSubMessage = JSON.parse(data.toString());
      this.handleMessage(message);
    });

    this.ws.on('close', () => {
      console.log('Twitch EventSub WS connection closed.');
      this.emit('disconnect');
      this.sessionId = null;
      this.ws = null;
    });

    this.ws.on('error', (error) => {
      console.error('Twitch EventSub WS error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Handles incoming WebSocket messages and emits corresponding events.
   */
  private handleMessage(message: TwitchEventSubMessage) {
    switch (message.metadata.message_type) {
      
      case 'session_welcome': {
        const welcomePayload = message.payload as WelcomePayload;
        this.sessionId = welcomePayload.session.id;
      
        this.emit('connect', this.sessionId);
        break;
      }
      case 'notification': {
        const notifyPayload = message.payload as NotificationPayload;
        const eventType = notifyPayload.subscription.type;
        const eventData = notifyPayload.event;
        
        this.emit(eventType, eventData);
        break;
      }
      case 'session_keepalive': {
        break;
      }
      case 'session_reconnect': {
        this.ws?.close();
        this.connect(); 
        break;
      }
      case 'revocation': {  
        const revocationPayload = message.payload as NotificationPayload;
        const revokedSub = revocationPayload.subscription;
        console.warn(`Twitch EventSub WS subscription revoked: ${revokedSub.type} (Status: ${revokedSub.status})`);
        this.emit('revocation', revokedSub);
        break;
      }
      default: {
        console.warn('Received unknown Twitch EventSub WS message type:', message.metadata.message_type);
        break;
      }
    }
  }

  /**
   * Subscribes to a specific EventSub topic (e.g., 'channel.follow').
   * This uses the REST API (via TwitchProvider) to create the subscription.
   *
   * @param type The subscription type (e.g., 'channel.follow')
   * @param version The subscription version (e.g., '2')
   * @param condition The condition object (e.g., { broadcaster_user_id: '123' })
   */
  public async subscribe(type: string, version: string, condition: object) {
    if (!this.sessionId) {
      throw new Error('Cannot subscribe. WebSocket is not connected or session ID is not set.');
    }

    try {
      const response = await this.apiClient.makeApiRequest(
        'eventsub/subscriptions',
        'user',
        'POST',
        {
          type: type,
          version: version,
          condition: condition,
          transport: {
            method: 'websocket',
            session_id: this.sessionId,
          },
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to create subscription for ${type}:`, error);
      throw error;
    }
  }

  public disconnect() {
    this.ws?.close();
  }
}