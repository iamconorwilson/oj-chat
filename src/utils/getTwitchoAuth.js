import express from "express";
import axios from "axios";
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const scopes = [
  "chat:read",
  "channel:read:redemptions",
]

const secretsPath = process.env.SECRETS_PATH;

const redirectUri = "http://localhost:3000"

app.get('/auth', (req, res) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
  


    res.redirect(
      `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join('%20')}`
    );
});
  
app.get('/', async (req, res) => {
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
  
      // Display the received token

      const accessToken = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scope: response.data.scope,
        obtainmentTimestamp: Date.now()
      }

      fs.writeFileSync(secretsPath, JSON.stringify(accessToken, null, 4));

      res.send(JSON.stringify(accessToken, null, 4));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred while retrieving tokens.');
    }
});
  


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});