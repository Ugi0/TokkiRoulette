CREATE TABLE IF NOT EXISTS twitch_tokens (
    id SERIAL PRIMARY KEY,
    twitch_user_id TEXT NOT NULL UNIQUE,
    twitch_login TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    broadcaster_name TEXT NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    UNIQUE(prediction_id, user_id)
);

CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    vote_option_id INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
    result_time TIMESTAMP NOT NULL,
    prediction_won BOOLEAN NOT NULL
);