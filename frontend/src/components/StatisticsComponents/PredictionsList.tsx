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
            <h2>Included predictions</h2>
            {predictions.length === 0 ? (
                <p>No predictions found for this interval.</p>
            ) : (
                <ul>
                    {predictions.map((prediction) => (
                        <li 
                            key={prediction.prediction_id}
                            className="prediction-item"
                            onClick={() => onSelect?.(prediction)}
                        >
                            <strong>{prediction.prediction_title}</strong>
                            <div className="prediction-time">
                                {parseDateToLocaleStringShort(new Date(prediction.prediction_start_time))}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}