import type { StatsInterval } from "../../types/analytics.ts";
import "./IntervalMenu.css";

// eslint-disable-next-line react-refresh/only-export-components
export function intervalLabel(value: StatsInterval): string {
    switch (value) {
        case "RECENT":
            return "Last";
        case "CURRENT_MONTH":
            return "This month";
        case "LAST_MONTH":
            return "Last month";
        case "LAST_3_MONTHS":
            return "3 months";
        case "LAST_6_MONTHS":
            return "6 months";
        case "LAST_12_MONTHS":
            return "12 months";
        case "ALL_TIME":
            return "All time";
    }
}

type IntervalMenuProps = {
    value: StatsInterval;
    options: StatsInterval[];
    onChange: (value: StatsInterval) => void;
};

export default function IntervalMenu({ value, options, onChange }: IntervalMenuProps) {
    // Until the available intervals have loaded, still show the selected one.
    const items = options.length > 0 ? options : [value];

    return (
        <div className="interval-tabs" role="tablist" aria-label="Time range">
            {items.map((option) => (
                <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={option === value}
                    className={`interval-tab${option === value ? " interval-tab--active" : ""}`}
                    onClick={() => onChange(option)}
                >
                    {intervalLabel(option)}
                </button>
            ))}
        </div>
    );
}
