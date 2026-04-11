import type { TwitchProvider } from "../api.js";
import type { TwitchChannelPointsReward } from "../../../types/twitch/index.js";

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