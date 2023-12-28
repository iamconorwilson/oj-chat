import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { ChatClient, toChannelName } from '@twurple/chat';
import { promises as fs } from 'fs';

import * as dotenv from 'dotenv';
dotenv.config()


export async function setupAuth() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const targetUserId = process.env.TWITCH_USER_ID;
    const tokenData = JSON.parse(await fs.readFile('./secrets.json', 'UTF-8'));
    const authProvider = new RefreshingAuthProvider(
        {
            clientId,
            clientSecret
        }
    );

    authProvider.onRefresh(async (userId, newTokenData) => await fs.writeFile(`./secrets.json`, JSON.stringify(newTokenData, null, 4), 'UTF-8'));

    await authProvider.addUserForToken(tokenData, ['chat']);

    const client = new ApiClient({ authProvider });

    const username = (await client.users.getUserById(targetUserId)).name;

    console.log(`Logged in as ${username}`);

    const chat = new ChatClient({ authProvider, channels: [username] });

    return { client, chat };
}