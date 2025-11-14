import type { TwitchProvider } from "../twitch.js";

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