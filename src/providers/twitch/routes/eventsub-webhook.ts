import { EventEmitter } from 'events';
import crypto from 'crypto';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { TwitchProvider } from '../api.js';
import type {
  TwitchEventSubMessage,
  EventSubSubscription,
  EventSubSubscriptionResponse,
  NotificationPayload,
  VerificationPayload
} from '../../../types/twitch/index.js';

export class TwitchEventSubWebhook extends EventEmitter {
  private static instance: TwitchEventSubWebhook | null = null;
  private apiClient: TwitchProvider;
  private secret: string;

  private constructor(apiClient: TwitchProvider) {
    super();
    this.apiClient = apiClient;
    this.secret = process.env.TWITCH_EVENTSUB_SECRET || '';
    if (!this.secret) {
      console.warn('TWITCH_EVENTSUB_SECRET is not defined. Webhook signature verification will fail.');
    }
  }

  public static getInstance(apiClient?: TwitchProvider): TwitchEventSubWebhook {
    if (!TwitchEventSubWebhook.instance) {
      if (!apiClient) throw new Error('apiClient must be provided on first use');
      TwitchEventSubWebhook.instance = new TwitchEventSubWebhook(apiClient);
    }
    return TwitchEventSubWebhook.instance;
  }

  /**
   * Middleware to handle Twitch EventSub webhook requests.
   * This uses express.raw() to get the raw body for signature verification.
   */
  public handleWebhook: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['twitch-eventsub-message-signature'] as string;
    const messageId = req.headers['twitch-eventsub-message-id'] as string;
    const timestamp = req.headers['twitch-eventsub-message-timestamp'] as string;

    if (!signature || !messageId || !timestamp) {
      res.status(400).send('Missing required Twitch EventSub headers');
      return;
    }

    // Verify signature
    const rawBody = req.body.toString();
    const message = messageId + timestamp + rawBody;
    const hmac = 'sha256=' + crypto.createHmac('sha256', this.secret).update(message).digest('hex');

    if (hmac !== signature) {
      console.error('Twitch EventSub signature verification failed');
      res.status(403).send('Forbidden');
      return;
    }

    const data: TwitchEventSubMessage = JSON.parse(rawBody);

    // Handle different message types based on headers
    const messageType = req.headers['twitch-eventsub-message-type'];

    if (messageType === 'webhook_callback_verification') {
      res.status(200).send(data.challenge);
      return;
    }

    if (messageType === 'notification') {
      const eventType = data.subscription.type;
      const eventData = data.event;

      this.emit(eventType, eventData);
      res.status(204).send();
      return;
    }

    if (messageType === 'revocation') {
      const revokedSub = data.subscription;
      console.warn(`Twitch EventSub subscription revoked: ${revokedSub.type} (Status: ${revokedSub.status})`);
      this.emit('revocation', revokedSub);
      res.status(204).send();
      return;
    }

    res.status(204).send();
  };

  /**
   * Subscribes to a specific EventSub topic.
   */
  public async createSubscription(type: string, version: string, condition: object) {
    const callbackUrl = process.env.TWITCH_EVENTSUB_CALLBACK;
    if (!callbackUrl) {
      throw new Error('TWITCH_EVENTSUB_CALLBACK is not defined.');
    }

    try {
      const response = await this.apiClient.makeApiRequest(
        'eventsub/subscriptions',
        'app', // Webhooks MUST use App Access Tokens for creation
        'POST',
        {
          type,
          version,
          condition,
          transport: {
            method: 'webhook',
            callback: callbackUrl,
            secret: this.secret,
          },
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to create webhook subscription for ${type}:`, error);
      throw error;
    }
  }

  public async getSubscriptions(id?: string): Promise<EventSubSubscription[]> {
    try {
      const response: EventSubSubscriptionResponse = await this.apiClient.makeApiRequest(
        `eventsub/subscriptions${id ? `?id=${id}` : ''}`,
        'app',
        'GET'
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get EventSub subscriptions:', error);
      throw error;
    }
  }

  public async deleteSubscription(id: string): Promise<void> {
    try {
      await this.apiClient.makeApiRequest(
        `eventsub/subscriptions?id=${id}`,
        'app',
        'DELETE'
      );
    } catch (error) {
      console.error(`Failed to delete EventSub subscription with ID ${id}:`, error);
      throw error;
    }
  }
}


