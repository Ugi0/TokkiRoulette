import { useState } from "react";
import type { StatsInterval } from "../../types/analytics";

type ExpandableSectionProps = {
  title: string;
  interval: StatsInterval;
  children: (expanded: boolean) => React.ReactNode;
};

export function ExpandableSection({
  title,
  interval,
  children,
}: ExpandableSectionProps) {
  const [expanded, setExpanded] = useState(interval == "RECENT");
  console.log(interval);

  return (
    <div className="stats">
      {interval !== "RECENT" && (
        <h1>{title}</h1>
      )}
      <div className="content">
        {children(expanded)}
      </div>

      {interval !== "RECENT" && (
        <div className="expand-controls">
          <button onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>
      )}
    </div>
  );
}