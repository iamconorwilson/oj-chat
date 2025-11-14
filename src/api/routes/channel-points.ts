import type { TwitchProvider } from "../twitch.js";

interface TwitchChannelPointsResponse {
  data: TwitchChannelPointsReward[];
}

export class ChannelPointsApi {
  private twitchProvider: TwitchProvider;

  constructor(twitchProvider: TwitchProvider) {
    this.twitchProvider = twitchProvider;
  }

  public async getRewardById(broadcasterId: string, rewardId: string) {
    return this.twitchProvider.makeApiRequest<TwitchChannelPointsResponse>(`channel_points/custom_rewards?broadcaster_id=${broadcasterId}&id=${rewardId}`, 'user');
  }
}