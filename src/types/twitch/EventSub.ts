export interface TwitchEventSubMessage {
  subscription: EventSubSubscription;
  event?: Record<string, any>;
  challenge?: string;
}

export interface VerificationPayload {
  challenge: string;
  subscription: EventSubSubscription;
}

export interface NotificationPayload {
  subscription: EventSubSubscription;
  event: Record<string, any>;
}

export interface EventSubSubscription {
  id: string;
  status: string;
  type: string;
  version: string;
  cost: number;
  condition: Record<string, any>;
  transport: {
    method: 'webhook' | 'websocket';
    callback?: string;
    session_id?: string;
  };
  created_at: string;
}

export interface EventSubSubscriptionResponse {
  data: EventSubSubscription[];
}


