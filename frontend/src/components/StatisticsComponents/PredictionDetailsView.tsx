import { useEffect, useState } from "react";
import type { PredictionDetails, PredictionEntry } from "../../types/analytics";
import { loadPredictionDetails } from "../../utils/statisticsQueries";
import "./PredictionDetailsView.css";
import { ProfileAvatar, ProfileName } from "../Profiles/ProfileAvatar";
import { parseDateToLocaleString } from "../../utils/statisticsCommon";
import { sortPredictionOptions } from "../../utils/statisticsTitles";

type PredictionDetailsViewProps = {
    prediction: PredictionEntry;
    onClose: () => void;
};

type LoadState =
    | { status: "loading" }
    | { status: "partial" }
    | { status: "ready"; details: PredictionDetails };

export default function PredictionDetailsView({ prediction, onClose }: PredictionDetailsViewProps) {
    const [state, setState] = useState<LoadState>({ status: "loading" });

    useEffect(() => {
        // The parent keys this component by prediction id, so state starts as "loading" for each prediction.
        let cancelled = false;

        loadPredictionDetails(prediction.prediction_id).then((details) => {
            if (cancelled) return;
            if (!details || details.options.length < 2) {
                setState({ status: "partial" });
            } else {
                setState({ status: "ready", details });
            }
        });

        return () => {
            cancelled = true;
        };
    }, [prediction.prediction_id]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div
            className="pd-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="pd-dialog" role="dialog" aria-modal="true" aria-labelledby="pd-title">
                <header className="pd-header">
                    <div>
                        <h3 id="pd-title">{prediction.prediction_title}</h3>
                        <p>{parseDateToLocaleString(new Date(prediction.prediction_start_time))}</p>
                    </div>
                    <button type="button" className="pd-close" onClick={onClose} aria-label="Close prediction details">
                        &times;
                    </button>
                </header>

                {state.status === "loading" && (
                    <div className="state-message" aria-busy="true">
                        <div className="spinner" />
                    </div>
                )}

                {state.status === "partial" && (
                    <div className="state-message">
                        <p className="pd-sad">˙◠˙</p>
                        <p>Seems that this prediction was faced with an error and only partial data was saved</p>
                    </div>
                )}

                {state.status === "ready" && (
                    <div className="pd-options">
                        {[...state.details.options].sort(sortPredictionOptions).map((option) => (
                            <div key={option.title} className={`pd-option ${option.won ? "pd-option--won" : "pd-option--lost"}`}>
                                <div className="pd-option__header">
                                    <h4>{option.title}</h4>
                                    {option.won && <span className="pd-badge">Winner</span>}
                                </div>

                                {option.votes.length === 0 ? (
                                    <p className="pd-option__empty">No bets</p>
                                ) : (
                                    <>
                                        <div className="pd-row pd-row--head">
                                            <span />
                                            <span>Player</span>
                                            <span>{option.won ? "Bet" : null}</span>
                                            <span>{option.won ? "Won" : "Lost"}</span>
                                        </div>

                                        {[...option.votes].sort((a, b) => b.bet_amount - a.bet_amount).map((entry) => (
                                            <div className="pd-row" key={entry.user_id}>
                                                <ProfileAvatar className="pd-avatar" userId={entry.user_id} userName={entry.user_name} imageUrl={entry.profile_image_url} />
                                                <ProfileName className="pd-name" userId={entry.user_id} userName={entry.user_name} />
                                                <span className="pd-num">
                                                    {entry.won_amount === null ? null : entry.bet_amount}
                                                </span>
                                                <span className={`pd-num ${entry.won_amount === null ? "negative" : "positive"}`}>
                                                    {entry.won_amount === null ? `-${entry.bet_amount}` : `+${entry.won_amount}`}
                                                </span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
