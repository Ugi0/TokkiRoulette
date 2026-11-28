# Tokki Roulette

This project is made for TokkiCorp, to have a new roulette page, since the old one turned into a subsription based service. Having a dedicated page also allows us to gather data about predictions being made, for the purpose of monthly prediction reports.

## Development

To start developing the project, you should run `npm install` in both backend and frontend folders to install required packages. A hotloaded version of the project can be started with `docker-compose -f docker-compose.dev.yml up -d --build`, after which the frontend can be accessed at `localhost:80`

### Testing without Twitch

The dev compose file starts the backend with `TWITCH_MOCK=true`, which replaces every Twitch call (OAuth, Helix, EventSub) with an in-process fake. No Twitch credentials or public webhook URL are needed; copy `backend/.env.example` to `backend/.env` for a fresh setup.

Open the control panel at `http://localhost/api/dev`:

1. **Log in as broadcaster** – creates a session for `TOKKI_USER_ID` without going through Twitch OAuth (`/api/auth/login` redirects here too).
2. **Start prediction → Place random bets → Lock** – the mock sends signed `channel.prediction.*` EventSub messages to `/api/webhooks/twitch`, so the real webhook code, signature check and DB writes run. Payloads mimic Twitch, including only sending the top 10 predictors per outcome.
3. Open `http://localhost/` and **spin**. The backend resolves the locked prediction through the (mocked) Helix API, the mock sends the `end` event ~1.5 s later, and the results panel appears.

Other buttons resolve or cancel a prediction manually (as the streamer would on Twitch), and **Simulate full roulette rounds** fills the database with data for the analytics page.

Mock state lives in memory, so a backend hot reload forgets the running mock prediction; start a new one.
To use real Twitch locally instead, run `TWITCH_MOCK=false docker-compose -f docker-compose.dev.yml up -d --build`.
Mock mode refuses to start unless `NODE_ENV=development`.

If your dev database volume was created before the participants migration, recreate it so `db-init.sql` runs again: `docker-compose -f docker-compose.dev.yml down -v`.

### Unit tests

`cd backend && npm test` runs the backend unit tests (no database needed).

## Deployment

Currently deployment is done through a script that is not included in this project.
