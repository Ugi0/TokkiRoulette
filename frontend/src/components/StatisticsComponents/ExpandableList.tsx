type ExpandableListProps<T> = {
  data: T[];
  expanded: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  initialCount?: number;
  expandedCount?: number;
  emptyText?: string;
};

export function ExpandableList<T>({
  data,
  expanded,
  renderItem,
  initialCount = 1,
  expandedCount = 20,
  emptyText = "No entries for this period yet.",
}: ExpandableListProps<T>) {
  if (data.length === 0) {
    return <div className="lb-empty">{emptyText}</div>;
  }

  const visibleItems = expanded
    ? data.slice(0, expandedCount)
    : data.slice(0, initialCount);

  return <>{visibleItems.map((item, i) => renderItem(item, i))}</>;
}
