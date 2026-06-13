import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ListingCard from "../ListingCard";

export default function IXIActiveStack({
  id,
  items = [],
  savedIds = [],
  boardColors = {},
  boardOutlines = {},
  stackDirection = "horizontal",
  onToggleSaved,
  onCycleColor,
  onCycleOutline,
  onSendFront,
  onSendBack
}) {
  const strategy =
    stackDirection === "vertical"
      ? verticalListSortingStrategy
      : horizontalListSortingStrategy;

  return (
    <SortableContext items={items.map(item => item.id)} strategy={strategy}>
      <div className={`ixi-active-stack ${id}`}>
        {items.map(item => (
          <ListingCard
            key={item.id}
            listing={item}
            saved={savedIds.includes(item.id)}
            boardColor={boardColors[item.id]}
            boardOutline={boardOutlines[item.id]}
            onToggleSaved={() => onToggleSaved?.(item)}
            onCycleColor={() => onCycleColor?.(item.id)}
            onCycleOutline={() => onCycleOutline?.(item.id)}
            onSendFront={() => onSendFront?.(item)}
            onSendBack={() => onSendBack?.(item)}
          />
        ))}
      </div>
    </SortableContext>
  );
}
