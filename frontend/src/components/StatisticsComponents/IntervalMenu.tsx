import Dropdown from "react-bootstrap/Dropdown";
import type { StatsInterval } from "../../types/analytics.ts";
import "./IntervalMenu.css";

function intervalLabel(value: StatsInterval): string {
    switch (value) {
        case "RECENT":
            return "Last";
        case "CURRENT_MONTH":
            return "Current Month";
        case "LAST_MONTH":
            return "Last Month";
        case "LAST_3_MONTHS":
            return "Last 3 Months";
        case "LAST_6_MONTHS":
            return "Last 6 Months";
        case "LAST_12_MONTHS":
            return "Last 12 Months";
        case "ALL_TIME":
            return "All Time";
    }
}
type IntervalMenuProps = {
    value: StatsInterval;
    options: StatsInterval[];
    onChange: (value: StatsInterval) => void;
};

export default function IntervalMenu({ value, options, onChange }: IntervalMenuProps) {
    return (
        <Dropdown align="end" className="interval-dropdown">
            <Dropdown.Toggle
                size="sm"
                variant="secondary"
                className="interval-toggle"
            >
                {intervalLabel(value)}
            </Dropdown.Toggle>

            <Dropdown.Menu className="interval-menu">
                {options.map((option) => (
                    <Dropdown.Item
                        key={option}
                        active={option === value}
                        className="interval-menu-item"
                        onClick={() => onChange(option)}
                    >
                        {intervalLabel(option)}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>

    );
}
