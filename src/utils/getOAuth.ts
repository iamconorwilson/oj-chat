import express from "express";
import axios from "axios";
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 3000;

const scopes = [
  "chat:read",
  "channel:read:redemptions"
]

const clientId = process.env.TWITCH_CLIENT_ID;
const secretsPath = process.env.SECRETS_PATH;
const redirectUri = "http://localhost:3000/callback";

app.get('/', (req, res) => {
  console.log('Redirecting to Twitch for authentication...');
  res.redirect(
    `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join('%20')}`
  );
});

app.get('/callback', async (req, res) => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const code = req.query.code;

  try {
    // Exchange the authorization code for access and refresh tokens
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      },
    });


    const accessToken = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      scope: response.data.scope,
      obtainmentTimestamp: Date.now()
    }

    fs.writeFileSync(secretsPath, JSON.stringify(accessToken, null, 4));

    res.header('Content-Type', 'application/json');
    res.send(JSON.stringify(accessToken, null, 4));

    console.log(`Token retrieved and saved to file: ${secretsPath}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while retrieving tokens.');
  }
});


// Start the server
app.listen(port, () => {
  if (!clientId || !secretsPath) {
    console.error('Client ID and secrets path must be set in environment variables.');
    process.exit(1);
  }
  console.log(`Visit http://localhost:${port} in your browser to authenticate.`);
});