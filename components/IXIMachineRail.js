// IXI Machine Rail
// Card-level machine control strip.
// One half of IXI Machine Controls™.
// The other half is IXIEnvironmentRail.

export default function IXIMachineRail({
  listing,
  saved,
  boardColor,
  boardOutline,
  onSendFront,
  onSendBack,
  onCycleColor,
  onCycleOutline,
  onEndRelationship,
  onToggleSaved
}) {
 return (
  <div className="board-command-rail">
    <button
      type="button"
      className="rail-zone rail-half"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onSendFront?.(listing);
      }}
    />

    <button
      type="button"
      className="rail-zone rail-color"
      onClick={onCycleColor}
    />

    <div className="rail-zone rail-width rail-width-split">
      <button
        type="button"
        className="rail-width-half rail-width-strength"
        onClick={onCycleOutline}
        aria-label="Change relationship strength"
      />

      <button
        type="button"
        className="rail-width-half rail-width-end"
        onClick={onEndRelationship}
        aria-label="End relationship"
      />
    </div>

    <button
      type="button"
      className="rail-zone rail-pin"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />

    <button
      type="button"
      className={`rail-zone rail-save ${saved ? "saved" : ""}`}
      onClick={onToggleSaved}
      aria-label={saved ? "Unsave listing" : "Save listing"}
      title={saved ? "Saved" : "Save"}
    />

    <button
      type="button"
      className="rail-zone rail-half"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onSendBack?.(listing);
      }}
    />
  </div>
);
