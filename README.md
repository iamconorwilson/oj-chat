# OJ Chat

Simple application that displays onscreen Twitch chat.

## Instructions

1. Clone repository and update .env file with Twitch Client/Secret and User ID
2. Create secrets.json file in the root and follow [Twurple instructions for Refreshing Auth provider](https://twurple.js.org/docs/auth/providers/refreshing.html) (Scopes required are:
    * `"channel:manage:redemptions"`
    * `"channel:read:redemptions"`
    * `"chat:edit"`
    * `"chat:read"`
    * `"user:read:email"`
3. Run the application using `node index.js`. The application will start on port 3000.


