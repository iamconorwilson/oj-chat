export interface TwitchEventSubMessage {
  subscription: EventSubSubscription;
  event?: Record<string, string>;
  challenge?: string;
}

export interface EventSubSubscription {
  id: string;
  status: string;
  type: string;
  version: string;
  cost: number;
  condition: Record<string, string>;
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


