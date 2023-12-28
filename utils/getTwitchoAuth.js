import express from "express";
import axios from "axios";
import * as dotenv from 'dotenv';


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const scopes = [
  "user:read:email",
  "chat:read",
  "chat:edit",
  "channel:read:redemptions", 
  "channel:manage:redemptions"
]

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
  
      const { access_token, refresh_token } = response.data;
  
      // Display the received tokens
      res.send(JSON.stringify({ access_token, refresh_token }, null, 4));
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).send('An error occurred while retrieving tokens.');
    }
});
  


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});