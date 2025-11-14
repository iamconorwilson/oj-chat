import express from "express";
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 3000;

const scopes = [
  "user:read:chat",
  "channel:read:redemptions"
]

const clientId = process.env.TWITCH_CLIENT_ID;
const secretsDir = process.env.SECRETS_DIR;
const redirectUri = "http://localhost:3000/callback";

app.get('/', (req, res) => {
  console.log('Redirecting to Twitch for authentication...');
  res.redirect(
    `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join('%20')}`
  );
});

app.get('/callback', async (req, res) => {
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const code = req.query.code;

  try {
    // Exchange the authorization code for access and refresh tokens
    const params = new URLSearchParams({
      client_id: clientId as string,
      client_secret: clientSecret as string,
      code: code as string,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const fetchResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP error! status: ${fetchResponse.status}`);
    }

    const responseData = await fetchResponse.json();

    const accessToken = {
      accessToken: responseData.access_token,
      refreshToken: responseData.refresh_token,
      expiresIn: responseData.expires_in,
      scope: responseData.scope,
      obtainmentTimestamp: Date.now()
    }

    if (!fs.existsSync(secretsDir!)){
      console.log(`Creating secrets directory at: ${secretsDir}`);
      fs.mkdirSync(secretsDir!);
    }

    const secretsFile = `${secretsDir}/twitch_user_token.json`;

    console.log(`Saving tokens to file: ${secretsFile}`);

    fs.writeFileSync(secretsFile, JSON.stringify(accessToken, null, 4));

    res.header('Content-Type', 'text/plain');
    res.status(200).send('Token retrieved and saved successfully! You can close this tab.');

    console.log(`Token retrieved and saved to file: ${secretsFile}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while retrieving tokens.');
  }
});


// Start the server
app.listen(port, () => {
  if (!clientId || !secretsDir) {
    console.error('Client ID and secrets directory must be set in environment variables.');
    process.exit(1);
  }
  console.log(`Visit http://localhost:${port} in your browser to authenticate.`);
});