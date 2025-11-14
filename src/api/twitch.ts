import { promises as fs } from 'fs';
import path from 'path';

import { UsersApi } from './routes/users.js';
import { ChatApi } from './routes/chat.js';
import { ChannelPointsApi } from './routes/channel-points.js';

interface TwitchApiConfig {
  clientId: string;
  clientSecret: string;
}

interface TwitchAppToken {
  accessToken: string;
  expiresIn: number;
  obtainmentTimestamp: number;
}

interface TwitchUserToken extends TwitchAppToken {
  refreshToken: string;
  scope: string[];
}

export class TwitchProvider {
  private static readonly API_BASE_URL = process.env.TWITCH_HELIX_ENDPOINT || 'https://api.twitch.tv/helix';
  private static readonly API_AUTH_URL = process.env.TWITCH_AUTH_ENDPOINT || 'https://id.twitch.tv/oauth2';

  private static instance: TwitchProvider | null = null;
  private static instancePromise: Promise<TwitchProvider> | null = null;

  private config: TwitchApiConfig;
  private appToken: TwitchAppToken | null = null;
  private userToken: TwitchUserToken | null = null;
  public me: TwitchUser | null = null;

  // API namespaces
  public readonly users: UsersApi;
  public readonly chat: ChatApi;
  public readonly channelPoints: ChannelPointsApi;

  private constructor(config: TwitchApiConfig) {
    this.config = config;
    this.users = new UsersApi(this);
    this.chat = new ChatApi(this);
    this.channelPoints = new ChannelPointsApi(this);
  }

  // Singleton instance
  public static async getInstance(): Promise<TwitchProvider> {
    if (TwitchProvider.instance) return TwitchProvider.instance;
    if (TwitchProvider.instancePromise) return TwitchProvider.instancePromise;

    TwitchProvider.instancePromise = (async () => {
      const config: TwitchApiConfig = {
        clientId: process.env.TWITCH_CLIENT_ID || '',
        clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
      };
      if (!config.clientId || !config.clientSecret) {
        throw new Error('Twitch client ID and secret must be provided in environment variables.');
      }
      const instance = new TwitchProvider(config);
      await instance.initializeTokens();
      instance.me = await instance.users.getCurrentUser().then(res => res.data[0]);
      if (instance.me) {
        console.log(`Connected to Twitch as user: ${instance.me.display_name} (ID: ${instance.me.id})`);
      }
      TwitchProvider.instance = instance;
      return instance;
    })();
    return TwitchProvider.instancePromise;
  }

  private async initializeTokens(): Promise<void> {
    if (!this.appToken) await this.fetchAppToken();
    if (!this.userToken) await this.fetchUserToken();
  }

  private async fetchAppToken(): Promise<void> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'client_credentials',
    });
    const response = await fetch(`${TwitchProvider.API_AUTH_URL}/token`, { method: 'POST', body: params });
    if (!response.ok) throw new Error(`Failed to fetch App Access Token: ${await response.text()}`);
    const newToken = await response.json();
    this.appToken = {
      accessToken: newToken.access_token,
      expiresIn: newToken.expires_in,
      obtainmentTimestamp: Date.now(),
    };
  }

  private async fetchUserToken(): Promise<void> {
    const secretsFile = path.resolve(process.env.SECRETS_DIR || '', 'twitch_user_token.json');
    let oldUserToken: TwitchUserToken;
    try {
      const fileContent = await fs.readFile(secretsFile, 'utf-8');
      oldUserToken = JSON.parse(fileContent);
    } catch {
      throw new Error('Twitch user token secrets file not found or invalid.');
    }
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: oldUserToken.refreshToken,
    });
    const response = await fetch(`${TwitchProvider.API_AUTH_URL}/token`, {
      method: 'POST',
      body: params,
    });
    if (!response.ok) throw new Error(`Failed to fetch User Access Token: ${await response.text()}`);
    const newToken = await response.json();
    this.userToken = {
      accessToken: newToken.access_token,
      refreshToken: newToken.refresh_token,
      expiresIn: newToken.expires_in,
      scope: newToken.scope,
      obtainmentTimestamp: Date.now(),
    };
    await fs.writeFile(secretsFile, JSON.stringify(this.userToken, null, 2), 'utf-8');
  }

  private isTokenExpired(token: TwitchAppToken): boolean {
    return Date.now() >= token.obtainmentTimestamp + token.expiresIn * 1000;
  }

  public async getValidToken(type: 'app' | 'user'): Promise<string> {
    if (type === 'user') {
      if (!this.userToken || this.isTokenExpired(this.userToken)) {
        await this.fetchUserToken();
      }
      return this.userToken!.accessToken;
    } else {
      if (!this.appToken || this.isTokenExpired(this.appToken)) {
        await this.fetchAppToken();
      }
      return this.appToken!.accessToken;
    }
  }

  public async makeApiRequest<T>(
    endpoint: string,
    tokenType: 'app' | 'user',
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: object
  ): Promise<T> {
    const accessToken = await this.getValidToken(tokenType);
    const url = `${TwitchProvider.API_BASE_URL}/${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': this.config.clientId,
      'Content-Type': 'application/json',
    };
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`Twitch API Error: ${response.status} - ${await response.text()}`);
    if (response.status === 204) return null as T;
    return await response.json() as T;
  }
}