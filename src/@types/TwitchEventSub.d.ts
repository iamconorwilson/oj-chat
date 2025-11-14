
interface TwitchEventSubMessage {
  metadata: {
    message_id: string;
    message_type: 'session_welcome' | 'session_keepalive' | 'notification' | 'session_reconnect' | 'revocation';
    message_timestamp: string;
    subscription_type?: string;
    subscription_version?: string;
  };
  payload: WelcomePayload | NotificationPayload | ReconnectPayload | Record<string, never>;
}

interface WelcomePayload {
  session: {
    id: string;
    status: string;
    connected_at: string;
    keepalive_timeout_seconds: number;
    reconnect_url: string | null;
  };
}

interface NotificationPayload {
  subscription: {
    id: string;
    status: string;
    type: string;
    version: string;
    cost: number;
    condition: object;
    transport: {
      method: 'websocket';
      session_id: string;
    };
    created_at: string;
  };
  event: Record<string, unknown>;
}

interface ReconnectPayload {
  session: {
    id: string;
    status: string;
    connected_at: string;
    keepalive_timeout_seconds: number;
    reconnect_url: string;
  };
}