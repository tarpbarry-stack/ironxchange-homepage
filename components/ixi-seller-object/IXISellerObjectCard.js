import SellerLogoDecal from "../SellerLogoDecal";
import IXIMachineRail from "../IXIMachineRail";
import ListingCard from "../ListingCard";

function formatMoney(value) {
  const amount = Number(value || 0);

  if (!amount) return "CALL";

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function IXISellerObjectCard({
  sellerObject,
  objectId,
  dragHandleProps,

  ixiState,
  onIxiStateChange,

  boardColor: boardColorProp = "none",
  boardOutline: boardOutlineProp = 1,
  saved = false,
  armedDestination,

  onCycleColor,
  onCycleOutline,
  onToggleSaved,
  onSendFront,
  onSendBack,
  onSendToArmedDestination,
  onCycleSellerFace
}) {
  const display = sellerObject?.sellerDisplay || {};
  const seed = sellerObject?.sellerSeedListing || {};
  const machines = sellerObject?.machines || [];

  const yardTitle =
    display.yardTitle ||
    sellerObject?.title ||
    "IronXchange Seller";

  const location =
    seed.sellerLocation ||
    seed.location ||
    "Location not listed";

  const logo =
    seed.sellerLogo ||
    seed.profileImage ||
    "";

  const categories = Array.from(
    new Set(
      machines
        .map(item => item.type || item.category)
        .filter(Boolean)
    )
  ).slice(0, 3);

  const yardSlug = slugify(yardTitle);

    const id = String(objectId || sellerObject?.id || "");

 const boardColor =
  ixiState?.color !== undefined
    ? ixiState.color
    : boardColorProp || "none";

const boardOutline =
  ixiState?.outline !== undefined
    ? Number(ixiState.outline)
    : Number(boardOutlineProp || 1);

  const boardColors = [
    "none",
    "green",
    "yellow",
    "red",
    "cyan",
    "white",
    "blue",
    "orange"
  ];

  function cycleBoardColor(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const currentIndex = boardColors.indexOf(boardColor);
    const nextColor =
      boardColors[(currentIndex + 1) % boardColors.length];

   if (onIxiStateChange && id) {
  onIxiStateChange(id, {
    color: nextColor,
    outline:
      Number(boardOutline) === 0
        ? 1
        : Number(boardOutline || 1)
  });
}

    onCycleColor?.(e);
  }

  function cycleBoardOutline(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const nextOutline =
      Number(boardOutline) === 1 ? 3 :
      Number(boardOutline) === 3 ? 5 :
      Number(boardOutline) === 5 ? 0 :
      1;

   if (onIxiStateChange && id) {
  onIxiStateChange(id, {
    outline: nextOutline
  });
}
    onCycleOutline?.(e);
  }

  const sellerFace =
  Number(ixiState?.face || sellerObject?.face || 1);

const isSellerIdentityFace =
  sellerFace === 1;

const endDeckFace = machines.length + 2;

const isEndDeckFace =
  sellerFace === endDeckFace;

const activeMachineIndex =
  sellerFace > 1 && sellerFace < endDeckFace
    ? sellerFace - 2
    : -1;

const activeMachine =
  activeMachineIndex >= 0
    ? machines[activeMachineIndex]
    : null;
  
  return (
      <section
  className={`seller-object-card card board-color-${boardColor || "none"} board-outline-${boardOutline || 1}`}
  {...(dragHandleProps || {})}
>
     <div className={isSellerIdentityFace ? "seller-object-main" : "seller-object-machine-face"}>
  {isSellerIdentityFace ? (
    <>
        <div className="seller-object-top">
          <SellerLogoDecal
            logo={logo}
            name={yardTitle}
            variant="card"
          />

          <div className="seller-object-title">
            <span>SELLER OBJECT</span>
            <h3>{yardTitle}</h3>
            <p>{location}</p>
          </div>
        </div>

        <div className="seller-object-stats">
          <div>
            <strong>{machines.length}</strong>
            <span>Machines</span>
          </div>

          <div>
            <strong>{formatMoney(sellerObject?.price)}</strong>
            <span>Inventory</span>
          </div>
        </div>

        <div className="seller-object-cats">
          {categories.length ? (
            categories.map(cat => <span key={cat}>{cat}</span>)
          ) : (
            <span>Mixed Iron</span>
          )}
        </div>

        <div className="seller-object-footer">
          <a
            href={`/yard/${yardSlug}`}
            onClick={event => event.stopPropagation()}
          >
            OPEN YARD
          </a>
        </div>
          </>
  ) : activeMachine ? (
    <ListingCard
      listing={activeMachine}
      saved={false}
      showSave={false}
      machineFace={1}
      useDndDrag={false}
    />
  ) : (
    <div className="seller-end-deck">
  <span>END DECK</span>
  <strong>{machines.length}</strong>
  <p>MACHINES REVIEWED</p>
</div>
  )}
</div>

<IXIMachineRail
  listing={sellerObject}
  saved={saved}
  boardColor={boardColor}
  boardOutline={boardOutline}
  machineFace={sellerFace}
  railMode={
  isSellerIdentityFace
    ? "next-lit"
    : "home-lit next-lit prev-lit end-lit"
}
  onCycleMachineFace={() => {
  const nextFace =
    sellerFace >= endDeckFace
      ? 1
      : sellerFace + 1;

  onIxiStateChange?.(id, {
    face: nextFace
  });
}}
onRailSend={() => {
  if (isSellerIdentityFace) return;

  const previousFace =
    sellerFace <= 2
      ? 1
      : sellerFace - 1;

  onIxiStateChange?.(id, {
    face: previousFace
  });
}}
  onSendFront={
  isSellerIdentityFace
    ? onSendFront
    : () => {
        onIxiStateChange?.(id, {
          face: 1
        });
      }
}
 onSendBack={
  isSellerIdentityFace
    ? () => {
        onIxiStateChange?.(id, {
          face: endDeckFace
        });
      }
    : () => {
        onIxiStateChange?.(id, {
          face: endDeckFace
        });
      }
}
  onCycleColor={cycleBoardColor}
  onCycleOutline={cycleBoardOutline}
  onToggleSaved={onToggleSaved}
  armedDestination={armedDestination}
  onSendToArmedDestination={
  isSellerIdentityFace
    ? undefined
    : onSendToArmedDestination
}
/>

      <style jsx>{`
        .seller-object-card {
  position: relative;
  width: 298px;
  min-width: 298px;
  max-width: 298px;

  height: 391px;
  min-height: 391px;
  max-height: 391px;

  display: flex;
  flex-direction: column;
  padding: 14px 14px 8px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.006)),
    radial-gradient(circle at top left, rgba(255,196,0,.055), transparent 55%),
    #101010;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 18px 34px rgba(0,0,0,.42);

border: 1px solid rgba(255,255,255,.08);
outline: 1px solid rgba(255,255,255,.018);
outline-offset: 0;
border-radius: 14px;
  overflow: hidden;
  cursor: grab;
}
        .seller-object-card,
        .seller-object-card * {
          box-sizing: border-box;
        }

        .seller-object-main {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .seller-object-top {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .seller-object-title {
          min-width: 0;
        }

        .seller-object-title span {
          display: block;
          margin-bottom: 5px;
          color: #ffc400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .seller-object-title h3 {
          margin: 0;
          color: #f4f4f4;
          font-size: 16px;
          font-weight: 950;
          line-height: 1.05;
          text-transform: uppercase;
        }

        .seller-object-title p {
          margin: 6px 0 0;
          color: rgba(255,255,255,.45);
          font-size: 10px;
          font-weight: 800;
        }

        .seller-object-stats {
          margin-top: 28px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .seller-object-stats div {
          padding: 14px 12px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 10px;
          background: rgba(0,0,0,.26);
        }

        .seller-object-stats strong {
          display: block;
          color: #f2f2f2;
          font-size: 24px;
          font-weight: 950;
          line-height: 1;
        }

        .seller-object-stats span {
          display: block;
          margin-top: 6px;
          color: rgba(255,255,255,.38);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .seller-object-cats {
          margin-top: 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .seller-object-cats span {
          padding: 5px 7px;
          border: 1px solid rgba(255,196,0,.18);
          border-radius: 999px;
          color: rgba(255,255,255,.62);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .seller-object-footer {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .seller-object-footer a {
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,196,0,.25);
          border-radius: 8px;
          background: rgba(255,196,0,.08);
          color: #ffc400;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .08em;
          text-decoration: none;
          cursor: pointer;
        }

        .seller-object-footer a:hover {
          background: rgba(255,196,0,.18);
        }
        .seller-object-card.board-outline-1 {
  outline: 1px solid rgba(255,255,255,.018);
}

.seller-object-card.board-outline-3 {
  outline-width: 3px;
}

.seller-object-card.board-outline-5 {
  outline-width: 5px;
}

.seller-object-card.board-outline-0 {
  outline-width: 0;
}

.seller-object-card.board-color-none {
  outline-color: rgba(255,255,255,.018);
}

.seller-object-card.board-color-green {
  outline-color: rgba(56,161,105,.95);
}

.seller-object-card.board-color-yellow {
  outline-color: rgba(255,196,0,.95);
}

.seller-object-card.board-color-red {
  outline-color: rgba(229,62,62,.95);
}

.seller-object-card.board-color-cyan {
  outline-color: rgba(0,194,255,.95);
}

.seller-object-card.board-color-white {
  outline-color: rgba(255,255,255,.85);
}

.seller-object-card.board-color-blue {
  outline-color: rgba(49,130,206,.95);
}

.seller-object-card.board-color-orange {
  outline-color: rgba(249,133,18,.95);
}

.seller-object-machine-face {
  position: absolute;
  inset: 0 0 16px 0;
  padding: 0;
  overflow: hidden;
}

.seller-end-deck {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;

  background:
    radial-gradient(circle at center, rgba(255,196,0,.08), transparent 55%),
    #101010;

  color: rgba(255,255,255,.72);
  text-align: center;
}

.seller-end-deck span {
  color: #ffc400;
  font-size: 10px;
  font-weight: 950;
  letter-spacing: .12em;
}

.seller-end-deck strong {
  color: #f4f4f4;
  font-size: 44px;
  font-weight: 950;
  line-height: 1;
}

.seller-end-deck p {
  margin: 0;
  color: rgba(255,255,255,.38);
  font-size: 9px;
  font-weight: 950;
  letter-spacing: .08em;
}
      `}</style>
    </section>
  );
}
