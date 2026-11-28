import type { PredictionEntry } from "../../types/analytics";
import { parseDateToLocaleStringShort } from "../../utils/statisticsCommon";
import "./PredictionsList.css";

type PredictionsListProps = {
  predictions: PredictionEntry[];
  onSelect: (prediction: PredictionEntry) => void;
};

export default function PredictionsList({ predictions, onSelect }: PredictionsListProps) {
    return (
        <div className="predictions-list">
            <h2>Included predictions <span className="predictions-list__count">{predictions.length}</span></h2>
            {predictions.length === 0 ? (
                <p className="predictions-list__empty">No predictions found for this interval.</p>
            ) : (
                <ul>
                    {predictions.map((prediction) => (
                        <li key={prediction.prediction_id}>
                            <button
                                type="button"
                                className="prediction-item"
                                onClick={() => onSelect?.(prediction)}
                            >
                                <span className="prediction-title">{prediction.prediction_title}</span>
                                <span className="prediction-time">
                                    {parseDateToLocaleStringShort(new Date(prediction.prediction_start_time))}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
