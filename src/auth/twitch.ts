import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { ChatClient } from '@twurple/chat';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { promises as fs } from 'fs';
import path from 'path';

import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

const secretsPath = path.resolve(process.cwd(), process.env.SECRETS_PATH);

export let client: ApiClient | null = null;
export let listener: EventSubWsListener | null = null;

export async function setupAuth() {
    //if secrets file doesn't exist, warn user and exit
    try {
        await fs.access(secretsPath);
    } catch (error) {
        console.error('Secrets file not found. Please create a secrets file at the specified path and try again.');
        console.log('Secrets file path:', secretsPath);
        return false;
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const targetUserId = process.env.TWITCH_USER_ID;
    const tokenData = JSON.parse(await fs.readFile(secretsPath, 'utf-8'));
    const authProvider = new RefreshingAuthProvider(
        {
            clientId,
            clientSecret
        }
    );

    authProvider.onRefresh(async (userId, newTokenData) => await fs.writeFile(secretsPath, JSON.stringify(newTokenData, null, 4), 'utf-8'));

    await authProvider.addUserForToken(tokenData, ['chat']);

    client = new ApiClient({ authProvider });

    const user = await client.users.getUserById(targetUserId);

    if (!user) {
        throw new Error('User not found');
    }

    console.log(`Logged in as ${user.name}`);

    listener = new EventSubWsListener({
        apiClient: client
    });

    return { client, listener };
}