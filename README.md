# OJChat
Simple application that displays onscreen Twitch chat with support for channel point redemptions, built using Express.

## Prerequisites
* Twitch App Client ID and Secret - [Create a new application](https://dev.twitch.tv/console/apps)

## Instructions
1. Clone repository and update .env file with Twitch Client/Secret, User ID and Secrets file path.
2. Run `npm run auth` to authenticate with Twitch and generate a secrets.json file. Scopes required are:
    * `"chat:read"`
    * `"channel:read:redemptions"`
3. Build the application using `npm start`. The application will start on port 3000.

## Development
* Run `npm run dev` to start the application in development mode. The application will restart on file changes.

## Features
* Real-time onscreen chat display for Twitch channels
* Supports channel point redemptions
* Query parameters for changing styles:
    * `?horizontal=true` - Horizontal chat layout
    * `?large=true` - Large chat font
    * `?transparent=true` - Transparent chat background

## Dependencies
* [Express](https://expressjs.com/)
* [dotenv](https://www.npmjs.com/package/dotenv)