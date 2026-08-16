export default function IXIAosCard007MediaGeometry() {
  return (
    <style jsx global>{`
      /*
       * Universal 007 media geometry.
       *
       * The original full-width 68px banner was far too panoramic for a
       * universal object card. Portraits, equipment photos, logos and document
       * previews all became aggressively cropped. 007 must accept arbitrary
       * media without assuming a subject or source aspect ratio.
       *
       * This treatment gives the media a neutral 4:3 presentation frame and
       * uses object-fit: contain so the source image is never stretched or
       * distorted. The remaining horizontal space deliberately reads as part
       * of the V12 information chassis rather than unused photo canvas.
       */
      .ixi-universal-card-007 .u007-media-shell {
        position: relative;
        flex: 0 0 86px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        padding: 6px;
        overflow: hidden;
        border: 1px solid #343a35;
        border-radius: 5px;
        background:
          linear-gradient(90deg, #0b0e0c 0 112px, #111512 112px 100%);
      }

      .ixi-universal-card-007 .u007-media-shell > img {
        flex: 0 0 96px;
        width: 96px;
        height: 72px;
        max-width: 96px;
        max-height: 72px;
        display: block;
        object-fit: contain;
        object-position: center;
        border: 1px solid #3b423d;
        border-radius: 4px;
        background: #070908;
      }

      .ixi-universal-card-007 .u007-media-shell:has(> img)::after {
        content: "PRIMARY MEDIA";
        min-width: 0;
        color: #737b76;
        font: 950 6px/1.25 Arial, Helvetica, sans-serif;
        letter-spacing: .09em;
      }

      .ixi-universal-card-007 .u007-media-empty {
        width: 100%;
        height: 72px;
        display: grid;
        grid-template-columns: 96px minmax(0, 1fr);
        align-items: center;
        justify-content: stretch;
        gap: 10px;
      }

      .ixi-universal-card-007 .u007-media-empty b {
        width: 96px;
        height: 72px;
        display: grid;
        place-items: center;
        border: 1px solid #343a35;
        border-radius: 4px;
        background: #090c0a;
        color: #ffc400;
        font-size: 13px;
        font-weight: 950;
        letter-spacing: .08em;
      }

      .ixi-universal-card-007 .u007-media-empty span {
        min-width: 0;
        color: #737b76;
        font-size: 6px;
        font-weight: 950;
        line-height: 1.25;
        letter-spacing: .09em;
        white-space: normal;
      }
    `}</style>
  );
}
