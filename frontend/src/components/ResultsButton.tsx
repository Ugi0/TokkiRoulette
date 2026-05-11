import "./ResultsButton.css";

export default function ResultsButton({
  onClick,
  disabled = false,
}: {
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="results-button-container">
      <button
        className="results-button"
        onClick={onClick}
        disabled={disabled}
      >
        Show results
      </button>
    </div>
  );
}
