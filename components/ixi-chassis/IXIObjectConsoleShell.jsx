export default function IXIObjectConsoleShell({
  consoleDepth = 1,
  panelWidth = 300,
  panelGap = 0,

  leftHandle,
  rightHandle,

  panels = []
}) {
  const safeDepth = Math.max(
    1,
    Math.min(
      Number(consoleDepth) || 1,
      panels.length || 1
    )
  );

  const visiblePanels =
    panels.slice(
      0,
      safeDepth
    );

  const shellWidth =
    (
      safeDepth *
      panelWidth
    ) +
    (
      Math.max(
        safeDepth - 1,
        0
      ) *
      panelGap
    );

  return (
    <div
      className="ixi-console-shell"
      style={{
        width: `${shellWidth}px`
      }}
      data-ixi-console-depth={
        safeDepth
      }
    >
      {leftHandle ? (
        <div className="console-left">
          {leftHandle}
        </div>
      ) : null}

      <div
        className="console-panels"
        style={{
          gap: `${panelGap}px`
        }}
      >
        {visiblePanels.map(
          (panel, index) => (
            <div
              key={index}
              className="console-panel"
              style={{
                width:
                  `${panelWidth}px`,

                flexBasis:
                  `${panelWidth}px`
              }}
            >
              {panel}
            </div>
          )
        )}
      </div>

      {rightHandle ? (
        <div className="console-right">
          {rightHandle}
        </div>
      ) : null}

      <style jsx>{`
        .ixi-console-shell {
          position: relative;

          display: flex;
          align-items: stretch;

          max-width: none;

          overflow: visible;
        }

        .console-panels {
          display: flex;
          align-items: stretch;

          width: 100%;
          min-width: 0;
        }

        .console-panel {
          min-width: 0;
          flex-grow: 0;
          flex-shrink: 0;

          position: relative;
        }

        .console-left,
        .console-right {
          position: absolute;
          top: 50%;

          transform:
            translateY(-50%);

          z-index: 100;

          pointer-events: auto;
        }

        .console-left {
          left: 0;
        }

        .console-right {
          right: 0;
        }
      `}</style>
    </div>
  );
}
