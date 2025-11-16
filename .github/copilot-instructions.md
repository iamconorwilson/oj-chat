# Copilot Instructions for OJChat

## Project Overview
OJChat is a Node.js/Express application for displaying Twitch chat onscreen, with support for channel point redemptions. It is designed for real-time chat overlays and customizable display options.

## Architecture & Key Components
- **Express Server**: Main entry in `src/server.ts`. Handles HTTP requests and serves chat overlays.
- **Chat & Queue Logic**: Core chat handling in `src/app.ts` and `src/queue.ts`.
- **API Integrations**: Twitch API logic in `src/api/twitch.ts` and `src/api/client.ts`.
- **Handlers**: Message and cache logic in `src/handler/` (e.g., `message.ts`, `caches.ts`, `cache/` for badges/emotes/pronouns).
- **Public Assets**: Frontend files in `public/` (HTML, JS, CSS). Main overlay UI in `public/chat.html` and scripts in `public/script.js`.
- **Secrets & Config**: Twitch tokens in `secrets/`, environment variables in `.env`.

## Developer Workflows
- **Authentication**: Run `npm run auth` to generate Twitch secrets (requires Client ID/Secret, User ID).
- **Development**: Use `npm run dev` for live-reloading server (nodemon).
- **Production**: Use `npm start` to build and run the app.
- **Environment**: Copy `.env.example` to `.env` and fill in required Twitch credentials.

## Patterns & Conventions
- **Type Definitions**: Custom Twitch types in `src/@types/` (e.g., `TwitchChatMessages.d.ts`).
- **API Routing**: All API routes are under `src/api/routes/` (e.g., `chat.ts`, `channel-points.ts`).
- **Cache Layer**: Emotes, badges, and pronouns are cached in `src/handler/cache/` for performance.
- **Frontend Customization**: Overlay appearance is controlled via query parameters (see README for options).
- **Secrets Handling**: Never commit files in `secrets/`.

## Integration Points
- **Twitch API**: OAuth handled in `src/utils/getOAuth.ts`, API calls in `src/api/twitch.ts`.
- **Channel Points**: Redemption events handled in `src/api/routes/channel-points.ts`.
- **Chat Events**: Message parsing and display logic in `src/handler/message.ts`.

## Examples
- To add a new Twitch API route, create a file in `src/api/routes/` and register it in `src/api/twitch.ts`.
- To extend chat message handling, update logic in `src/handler/message.ts` and relevant type definitions.

## References
- See `README.md` for setup and feature details.
- See `src/@types/` for custom type definitions.
- See `public/` for overlay UI and customization.

---
For questions about unclear conventions or missing documentation, ask the user for clarification before making major changes.