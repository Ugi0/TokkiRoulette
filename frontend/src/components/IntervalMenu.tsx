import Dropdown from "react-bootstrap/Dropdown";
import type { StatsInterval } from "../types/analytics.ts";
import "./IntervalMenu.css";

function intervalLabel(value: StatsInterval): string {
    switch (value) {
        case "RECENT":
            return "Recent";
        case "ONE_MONTH":
            return "1 Month";
        case "THREE_MONTHS":
            return "3 Months";
        case "SIX_MONTHS":
            return "6 Months";
        case "ONE_YEAR":
            return "1 Year";
        case "ALL":
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
