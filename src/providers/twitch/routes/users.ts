import type { TwitchProvider } from "../api.js";
import type { TwitchUser } from "../../../types/twitch/index.js";

type TwitchUserResponse = {
  data: TwitchUser[];
}

export class UsersApi {
  private twitchProvider: TwitchProvider;

  constructor(twitchProvider: TwitchProvider) {
    this.twitchProvider = twitchProvider;
  }

  public async getUserById(userId: string): Promise<TwitchUserResponse> {
    return this.twitchProvider.makeApiRequest<TwitchUserResponse>(`users?id=${userId}`, 'app');
  }

  public async getCurrentUser(): Promise<TwitchUserResponse> {
    return this.twitchProvider.makeApiRequest<TwitchUserResponse>('users', 'user');
  }
}