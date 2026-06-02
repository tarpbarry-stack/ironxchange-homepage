const COLOR_CONTROLS = [
  "none",
  "green",
  "yellow",
  "red",
  "cyan",
  "white",
  "blue",
  "orange"
];

const OUTLINE_CONTROLS = [1, 3, 5];

function getExistingColors(ixiCardState = {}) {
  const colors = new Set();

  Object.values(ixiCardState || {}).forEach(state => {
    if (state?.color) colors.add(state.color);
  });

  return colors;
}

function getExistingOutlines(ixiCardState = {}) {
  const outlines = new Set();

  Object.values(ixiCardState || {}).forEach(state => {
    if (state?.outline) outlines.add(String(state.outline));
  });

  return outlines;
}

export default function IXIRelationshipControls({
  ixiCardState = {},

  activeColors = [],
  onToggleColor = () => {},

  activeOutline = "all",
  onToggleOutline = () => {},

  className = ""
}) {
  const existingColors = getExistingColors(ixiCardState);
  const existingOutlines = getExistingOutlines(ixiCardState);

  function getColorStage(color) {
    if (activeColors.includes(color)) return "selected";
    if (existingColors.has(color)) return "exists";
    return "dead";
  }

  function getOutlineStage(outline) {
    if (String(activeOutline) === String(outline)) return "selected";
    if (existingOutlines.has(String(outline))) return "exists";
    return "dead";
  }

function handleOutlineClick(outline) {
  if (!activeColors.includes("none")) {
    onToggleColor("none");
  }

  onToggleOutline(outline);
}
  
  return (
    <div className={`ixi-relationship-controls ${className}`}>
      {COLOR_CONTROLS.map(color => (
        <button
          key={color}
          type="button"
          className={`ixi-relationship-color color-${color} stage-${getColorStage(color)}`}
          onClick={() => onToggleColor(color)}
          aria-label={`Filter ${color}`}
        />
      ))}

      {OUTLINE_CONTROLS.map(outline => (
        <button
          key={outline}
          type="button"
          className={`ixi-relationship-outline outline-${outline} stage-${getOutlineStage(outline)}`}
          onClick={() => handleOutlineClick(outline)}
          aria-label={`Filter outline ${outline}`}
        />
      ))}

      <style jsx>{`
        .ixi-relationship-controls {
          width: max-content;
          max-width: 100%;

          margin: 18px auto 0;
          padding: 0;

          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          align-items: center;

          gap: 14px;
        }

        .ixi-relationship-color,
        .ixi-relationship-outline {
          border: 1px solid rgba(255,255,255,.045);
          background: transparent;
          padding: 0;
          cursor: pointer;

          opacity: .22;

          transition:
            opacity .14s ease,
            box-shadow .14s ease,
            border-color .14s ease,
            transform .14s ease;
        }

        .ixi-relationship-color {
          width: 20px;
          height: 8px;
          border-radius: 1px;
        }

        .ixi-relationship-outline {
          width: 24px;
          height: 14px;
          border-radius: 3px;
          position: relative;
          margin-left: -2px;
          margin-right: -2px;
        }

        .ixi-relationship-outline.stage-dead {
  opacity: .38;
  background: transparent;
  border-color: rgba(255,255,255,.055);
  box-shadow: none;
}

.ixi-relationship-outline.stage-dead::after {
  background: rgba(255,255,255,.16);
}

.ixi-relationship-outline.stage-exists {
  opacity: .72;
  border-color: rgba(255,255,255,.10);
}

.ixi-relationship-outline.stage-exists::after {
  background: rgba(255,255,255,.42);
}

.ixi-relationship-outline.stage-selected {
  opacity: 1;
  border-color: rgba(255,255,255,.18);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.06),
    0 0 10px rgba(255,255,255,.10);
}

.ixi-relationship-outline.stage-selected::after {
  background: rgba(255,255,255,.76);
}
        

        .ixi-relationship-outline::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 15px;
          transform: translate(-50%, -50%);
          background: rgba(255,255,255,.22);
        }

        .outline-1::after {
          height: 1px;
        }

        .outline-3::after {
          height: 3px;
        }

        .outline-5::after {
          height: 5px;
        }

       .stage-dead {
  opacity: .34;

  background: transparent !important;

  border-color: rgba(255,255,255,.055);

  box-shadow: none;

  filter: none;
}

.ixi-relationship-color.stage-dead {
  background: transparent !important;

  border: 1px solid rgba(255,255,255,.055);
}

        .stage-exists {
          opacity: .62;
          filter: grayscale(.18);
          box-shadow:
            0 0 8px rgba(255,255,255,.045);
        }

        .stage-selected {
          opacity: 1;
          filter: grayscale(0);

          border-color: rgba(255,196,0,.34);

          box-shadow:
            0 0 0 1px rgba(255,196,0,.12),
            0 0 14px rgba(255,196,0,.20);
        }

        .ixi-relationship-color:hover,
        .ixi-relationship-outline:hover {
          transform: translateY(-1px);
        }

        .color-none {
          background: rgba(255,255,255,.12);
        }

        .color-green {
          background: rgba(56,161,105,.82);
        }

        .color-yellow {
          background: rgba(255,196,0,.82);
        }

        .color-red {
          background: rgba(229,62,62,.82);
        }

        .color-cyan {
          background: rgba(0,194,255,.82);
        }

        .color-white {
          background: rgba(255,255,255,.72);
        }

        .color-blue {
          background: rgba(49,130,206,.82);
        }

        .color-orange {
          background: rgba(249,133,18,.82);
        }

        @media (max-width: 850px) {
          .ixi-relationship-controls {
            margin: 14px auto 0;
            gap: 14px;
          }
        }
      `}</style>
    </div>
  );
}
