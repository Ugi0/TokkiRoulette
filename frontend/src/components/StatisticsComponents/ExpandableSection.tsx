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
  const collapsible = interval !== "RECENT";

  return (
    <section className="stats-section">
      {collapsible && (
        <div className="stats-section__header">
          <h2>{title}</h2>
          <button
            type="button"
            className="btn-ghost"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Show less" : "Show more"}
            <span className={`chevron${expanded ? " chevron--up" : ""}`} aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="stats-section__grid">
        {children(expanded)}
      </div>
    </section>
  );
}
