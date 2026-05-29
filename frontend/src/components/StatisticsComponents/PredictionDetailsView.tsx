import { useEffect, useState } from "react";
import type { PredictionDetails, PredictionEntry } from "../../types/analytics";
import { loadPredictionDetails } from "../../utils/statisticsQueries";
import "./PredictionDetailsView.css";
import { parseDateToLocaleString } from "../../utils/statisticsCommon";
import { sortPredictionOptions } from "../../utils/statisticsTitles";

type PredictionDetailsViewProps = {
    prediction: PredictionEntry;
    onClose: () => void;
};

export default function PredictionDetailsView({ prediction, onClose }: PredictionDetailsViewProps) {
    const [details, setDetails] = useState<PredictionDetails | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            const predictionDetails = await loadPredictionDetails(prediction.prediction_id);

            if (!predictionDetails || [0,1].includes(predictionDetails.options.length)) {
                setDetails(null);
            } else {
                setDetails(predictionDetails);
            }
        };

        fetchDetails();
    }, [onClose, prediction.prediction_id]);

    if ( !details ) {
        return (
            <div className="prediction-details modal">
                <div className="modal-content">
                    <div className="spacer" />
                    <div className="prediction-details-content">
                        <h3>{prediction.prediction_title}</h3>
                        <p>
                            {parseDateToLocaleString(new Date(prediction.prediction_start_time))}
                        </p>
                        <br/> <br/>
                        <p>Seems that this prediction was faced with an error and only partial data was saved</p>
                        <br/> <br/>
                        <p style={{ fontSize: "4rem" }}>˙◠˙</p>
                    </div>
                    <div className="spacer button-container">
                        <span className="close" onClick={onClose}>
                            &times;
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="prediction-details modal">
            <div className="modal-content">
                <div className="spacer" />
                <div className="prediction-details-content">
                    <h3>{prediction.prediction_title}</h3>
                    <p>
                        {parseDateToLocaleString(new Date(prediction.prediction_start_time))}
                    </p>
                    <div className="options">
                        {details?.options.sort((a, b) => sortPredictionOptions(a, b)).map((option, index) => (
                            <div key={index} className={`option ${option.won ? "won" : "lost"}`}>
                                <h4>{option.title}</h4>

                                <div className="entry header">
                                    <div /> {/* empty for pfp column */}
                                    <div /> {/* empty for user column */}
                                    <div className="bet">{option.won ? "Bet": null}</div>
                                    <div className="net">{option.won ? "Won" : "Lost"}</div>
                                </div>

                                {
                                    option.votes.sort((a, b) => b.bet_amount - a.bet_amount).map((entry) => (
                                        <div className="entry" key={entry.user_id}>
                                            <img
                                                className="pfp"
                                                src={entry.profile_image_url ?? "/default-pfp.jpg"}
                                                alt="˙◠˙"
                                            />
                            
                                            <div className="name">
                                                {entry.user_name}
                                            </div>
                            
                                            <div className="bet">
                                                {entry.won_amount === null ? null : entry.bet_amount}
                                            </div>
                            
                                            <div className="net">
                                                {entry.won_amount === null ? entry.bet_amount : entry.won_amount}
                                            </div>
                                            </div>
                                    ))
                                }
                            </div>
                        ))}
                    </div>
                </div>
                <div className="spacer button-container">
                    <span className="close" onClick={onClose}>
                        &times;
                    </span>
                </div>
            </div>
        </div>
    );
}