declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'development' | 'production' | 'test';
        TWITCH_CLIENT_ID: string;
        TWITCH_CLIENT_SECRET: string;
        SECRETS_DIR: string;
        TWITCH_HELIX_ENDPOINT: string;
        TWITCH_AUTH_ENDPOINT: string;
        TWITCH_WS_ENDPOINT: string;
        SEVENTV_API_ENDPOINT: string;
        SEVENTV_WS_ENDPOINT: string;
    }
}