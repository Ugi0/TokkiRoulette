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

## Verifying the production database

`db-init.sql` only runs when the database volume is first created, so schema changes on an existing database are applied by hand. Two read-only checks show whether the database is in the state the code expects. Run them on the server from the project folder.

**1. Back up first** (before changing anything based on the results):

```sh
docker exec roulette-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > backup-$(date +%F).sql
```

**2. Schema check:** compares the live schema with what `db-init.sql` creates, using a temporary container from the same Postgres image:

```sh
backend/scripts/compare-schema.sh
```

In the diff, `-` lines are expected but missing or different in production, and `+` lines exist only in production. Known harmless differences:
- The participants primary key is called `participants_new_pkey` in production, because the migration created the table as `participants_new` and then renamed it. To make it match: `ALTER TABLE participants RENAME CONSTRAINT participants_new_pkey TO participants_pkey;`
- Columns added later with `ALTER TABLE` appear in a different order. The order doesn't matter to the app.

**3. Data check:** looks for predictions stuck without results, inconsistent flags, unchecked constraints and similar:

```sh
docker exec -i roulette-db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backend/scripts/check-data.sql
```

Sections marked PROBLEM should be empty; INFO sections are for review.

**Recovering predictions whose results were never saved** (check 3): this fetches the prediction from Twitch and saves it through the normal end-of-prediction code. It previews by default; add `--apply` to write.

```sh
docker exec backend node dist/scripts/recoverPredictions.js <prediction-id> [<prediction-id> ...]
``` You can try both checks on the dev database first (it uses the same container name).

## Deployment

Currently deployment is done through a script that is not included in this project.
