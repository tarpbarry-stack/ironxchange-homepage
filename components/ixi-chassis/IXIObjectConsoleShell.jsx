import {
  getConsoleGridSpan
} from "./IXIObjectConsoleEngine";

export default function IXIObjectConsoleShell({
  consoleDepth = 1,

  leftHandle,
  rightHandle,

  panels = []
}) {
  const visiblePanels =
    panels.slice(
      0,
      consoleDepth
    );

  return (
    <div
      className="ixi-console-shell"
      style={{
        gridColumn: `span ${getConsoleGridSpan(consoleDepth)}`
      }}
    >
      {leftHandle ? (
        <div className="console-left">
          {leftHandle}
        </div>
      ) : null}

      <div className="console-panels">
        {visiblePanels.map(
          (panel, index) => (
            <div
              key={index}
              className="console-panel"
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

          overflow: hidden;

          width: calc(
            300px * ${consoleDepth}
          );

          transition:
            width .18s ease;
        }

        .console-panels {
          display: flex;
          flex: 1;
        }

        .console-panel {
          width: 300px;
          flex: 0 0 300px;
        }

        .console-left,
        .console-right {
          position: absolute;

          top: 50%;

          transform:
            translateY(-50%);

          z-index: 100;
        }

        .console-left {
          left: -2px;
        }

        .console-right {
          right: -2px;
        }
      `}</style>
    </div>
  );
}
