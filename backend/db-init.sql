-- Schema matches production after 20261024_002_normalize_participants_up.sql.
-- user_name lives only in participants; votes, results and user_sessions reference it by user_id.
CREATE TABLE participants (
    user_id INTEGER PRIMARY KEY,
    user_name TEXT NOT NULL,
    profile_image_url TEXT
);

CREATE INDEX participants_user_name_lower_idx
    ON participants (LOWER(user_name));

CREATE TABLE predictions (
    id TEXT PRIMARY KEY,
    broadcaster_name TEXT NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    prediction_status TEXT NOT NULL
        CHECK (prediction_status IN ('active','locked','resolved','canceled')),
    roulette_prediction BOOLEAN NOT NULL
);

CREATE TABLE options (
    prediction_id TEXT NOT NULL
        REFERENCES predictions(id) ON DELETE CASCADE,
    option_id TEXT NOT NULL,
    title TEXT NOT NULL,
    PRIMARY KEY (prediction_id, option_id)
);

CREATE TABLE votes (
    prediction_id TEXT NOT NULL,
    option_id TEXT NOT NULL,
    points_used INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    PRIMARY KEY (prediction_id, user_id),

    FOREIGN KEY (prediction_id, option_id)
        REFERENCES options (prediction_id, option_id)
        ON DELETE CASCADE,

    CONSTRAINT votes_participant_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES participants (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE prediction_outcomes (
    prediction_id TEXT PRIMARY KEY
        REFERENCES predictions(id) ON DELETE CASCADE,

    winning_option_id TEXT NOT NULL,

    FOREIGN KEY (prediction_id, winning_option_id)
        REFERENCES options(prediction_id, option_id)
        ON DELETE RESTRICT
);

CREATE TABLE results (
    prediction_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,

    bet_amount INTEGER NOT NULL,
    won_amount INTEGER,
    result_time TIMESTAMPTZ NOT NULL,

    roulette_prediction BOOLEAN NOT NULL,

    PRIMARY KEY (prediction_id, user_id),

    FOREIGN KEY (prediction_id, user_id)
        REFERENCES votes (prediction_id, user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (prediction_id)
        REFERENCES prediction_outcomes(prediction_id)
        ON DELETE RESTRICT,

    CONSTRAINT results_participant_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES participants (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE spin_counter (
    number INTEGER PRIMARY KEY CHECK (number BETWEEN 0 AND 36),
    count BIGINT NOT NULL DEFAULT 0
);

INSERT INTO spin_counter (number)
SELECT generate_series(0, 36);

CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,

    UNIQUE (user_id),

    CONSTRAINT user_sessions_participant_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES participants (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
