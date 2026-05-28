import type { PredictionEntry } from "../../types/analytics";

export default function PredictionDetails({ prediction }: { prediction: PredictionEntry }) {
    return (
        <div className="prediction-details">
            <h3>{prediction.prediction_title}</h3>
            <p>
            {new Date(prediction.prediction_start_time).toLocaleString()}
            </p>
            {/* add more fields */}
        </div>
    );
}