type ExpandableListProps<T> = {
  data: T[];
  expanded: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  initialCount?: number;
  expandedCount?: number;
};

export function ExpandableList<T>({
  data,
  expanded,
  renderItem,
  initialCount = 1,
  expandedCount = 10,
}: ExpandableListProps<T>) {
  const visibleItems = expanded
    ? data.slice(0, expandedCount)
    : data.slice(0, initialCount);

  return <>{visibleItems.map((item, i) => renderItem(item, i))}</>;
}
