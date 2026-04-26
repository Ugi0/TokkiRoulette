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

CREATE TABLE results (
    prediction_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    option_id TEXT NOT NULL,
    bet_amount INTEGER NOT NULL,
    won_amount INTEGER NOT NULL,
    prediction_won BOOLEAN NOT NULL,
    result_time TIMESTAMPTZ NOT NULL,

    PRIMARY KEY (prediction_id, user_id),

    FOREIGN KEY (prediction_id, user_id)
        REFERENCES votes (prediction_id, user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (prediction_id, option_id)
        REFERENCES options (prediction_id, option_id)
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
