CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    broadcaster_name TEXT NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    prediction_status TEXT NOT NULL
        CHECK (prediction_status IN ('active','locked','resolved','cancelled')),
    roulette_prediction BOOLEAN NOT NULL
);

CREATE TABLE options (
    prediction_id INTEGER NOT NULL
        REFERENCES predictions(id) ON DELETE CASCADE,
    option_id TEXT NOT NULL,
    title TEXT NOT NULL,
    PRIMARY KEY (prediction_id, option_id)
);

CREATE TABLE votes (
    prediction_id INTEGER NOT NULL,
    option_id TEXT NOT NULL,
    points_used INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_id INTEGER NOT NULL,

    PRIMARY KEY (prediction_id, user_id),

    FOREIGN KEY (prediction_id, option_id)
        REFERENCES options (prediction_id, option_id)
        ON DELETE CASCADE
);

CREATE TABLE prediction_outcomes (
    prediction_id INTEGER PRIMARY KEY
        REFERENCES predictions(id) ON DELETE CASCADE,

    winning_option_id TEXT NOT NULL,

    FOREIGN KEY (prediction_id, winning_option_id)
        REFERENCES options(prediction_id, option_id)
        ON DELETE RESTRICT
);

CREATE TABLE results (
    prediction_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    bet_amount INTEGER NOT NULL,
    won_amount INTEGER NOT NULL,
    result_time TIMESTAMPTZ NOT NULL,

    PRIMARY KEY (prediction_id, user_id),

    FOREIGN KEY (prediction_id, user_id)
        REFERENCES votes (prediction_id, user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (prediction_id)
        REFERENCES prediction_outcomes(prediction_id)
        ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION enforce_roulette_prediction()
RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM predictions
        WHERE id = NEW.prediction_id
          AND roulette_prediction = true
    ) THEN
        RAISE EXCEPTION
            'Prediction % is not a roulette prediction; results are not allowed',
            NEW.prediction_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER results_only_for_roulette_predictions
BEFORE INSERT OR UPDATE
ON results
FOR EACH ROW
EXECUTE FUNCTION enforce_roulette_prediction();

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
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
