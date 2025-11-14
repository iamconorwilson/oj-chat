import type { TwitchProvider } from "../twitch.js";

type TwitchBadgeResponse = {
  data: TwitchBadge[];
}

export class ChatApi {
  private twitchProvider: TwitchProvider;

  constructor(twitchProvider: TwitchProvider) {
    this.twitchProvider = twitchProvider;
  }

  public async getChannelBadges(broadcasterId: string): Promise<TwitchBadgeResponse> {
    return this.twitchProvider.makeApiRequest<TwitchBadgeResponse>(`chat/badges?broadcaster_id=${broadcasterId}`, 'app');
  }

  public async getGlobalBadges(): Promise<TwitchBadgeResponse> {
    return this.twitchProvider.makeApiRequest<TwitchBadgeResponse>('chat/badges/global', 'app');
  }

}