export default function IXIAosLocationVisualCorrections() {
  return (
    <style jsx global>{`
      /* ============================================================
         AOS V12 VISUAL SYSTEM
         Keep the serious graphite chassis. Do not change data meaning.
         ============================================================ */
      .ixi-location-overview,.ixi-aos-location-f2,.f3-financial,.f4-obligations,.f5,.ixi-generic-face-v12{
        --loc-canvas:#0a0a0a;--loc-chassis:#0e0e0e;--loc-shell:#151515;--loc-shell-2:#191919;--loc-shell-3:#1f1f1f;--loc-line:#363636;--loc-line-soft:#292929;--loc-line-hi:#424242;--loc-text:#f5f5f5;--loc-text-2:#bcbcbc;--loc-text-3:#828282;--loc-yellow:#ffc400;--loc-green:#8bd92f;--loc-red:#ff4b3e;
      }
      .ixi-location-overview,.ixi-aos-location-f2,.f3-financial,.f4-obligations,.f5,.ixi-generic-face-v12{
        background:linear-gradient(180deg,rgba(255,255,255,.018),transparent 24%),var(--loc-chassis)!important;border-color:var(--loc-line)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 14px 34px rgba(0,0,0,.42)!important;
      }

      /* Legacy rich Location faces keep their original structures, only neutral chrome. */
      .ixi-aos-location-f2 .ops-header,.f3-financial .f3-header,.f4-obligations .f4-header,.f5 .f5-head{background:#101010!important;border-bottom-color:var(--loc-line-soft)!important}
      .ixi-aos-location-f2 .gate-code,.ixi-aos-location-f2 .ops-section,.f3-financial .ownership,.f3-financial .f3-section,.f3-financial .big-value,.f3-financial .summary-grid>b,.f4-obligations .f4-next,.f4-obligations .f4-metric,.f4-obligations .f4-section,.f5 .f5-banner,.f5 .f5-sec{border-color:var(--loc-line)!important;background:var(--loc-shell)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.018)!important}
      .ixi-aos-location-f2 .gate-code{border-color:#655413!important;background:#151407!important}
      .ixi-aos-location-f2 .ops-section-title,.f3-financial .f3-section>h3,.f4-obligations .f4-section>h3,.f4-obligations .f4-table-head,.f5 .f5-sec>h3{background:#121212!important;border-bottom-color:var(--loc-line)!important;color:var(--loc-yellow)!important}
      .ixi-aos-location-f2 .ops-row,.ixi-aos-location-f2 .ops-cell,.ixi-aos-location-f2 .ops-wide,.f4-obligations .f4-row,.f5 .attention>div,.f5 .systems>div{border-color:var(--loc-line-soft)!important;background:#141414!important}
      .ixi-aos-location-f2 .ops-cell:nth-child(even),.ixi-aos-location-f2 .ops-row:nth-child(even),.f4-obligations .f4-row:nth-child(even),.f5 .systems>div:nth-child(even){background:#181818!important}
      .f4-obligations .f4-control{display:grid!important;grid-template-columns:minmax(0,1.75fr) repeat(3,minmax(0,.72fr))!important;gap:4px!important;width:100%!important}
      .f4-obligations .f4-next,.f4-obligations .f4-metric{min-width:0!important;width:auto!important;overflow:hidden!important}.f4-obligations .f4-metric{padding-left:3px!important;padding-right:3px!important}.f4-obligations .f4-metric b{display:block!important;max-width:100%!important;overflow:hidden!important;font-size:9.2px!important;line-height:1.05!important;letter-spacing:-.035em!important;white-space:nowrap!important;text-align:center!important}

      /* ============================================================
         SCHEMA-DRIVEN F2-F5
         Keep ALL configured sections visible in the same 298x471 face.
         The main face remains scrollable, but normal sample datasets now
         present at the dense V12 information level instead of giant tiles.
         ============================================================ */
      .ixi-generic-face-v12{background:linear-gradient(180deg,#121212,#0a0a0a)!important;border-color:#494949!important}
      .ixi-generic-face-v12 .gfv12-head{height:43px!important;background:linear-gradient(180deg,#191919,#111111)!important;border-bottom-color:#343434!important}
      .ixi-generic-face-v12 .gfv12-scroll{top:43px!important;left:7px!important;right:7px!important;bottom:19px!important;gap:4px!important;padding:5px 0!important}
      .ixi-generic-face-v12 .gfv12-banner{flex-basis:24px!important;height:24px!important;min-height:24px!important;gap:7px!important;padding:0 7px!important;border-color:#383838!important;border-radius:5px!important;background:#131313!important}
      .ixi-generic-face-v12 .gfv12-banner b{width:20px!important;height:15px!important;font-size:6px!important}.ixi-generic-face-v12 .gfv12-banner span{font-size:7px!important}
      .ixi-generic-face-v12 .gfv12-section{border-color:#383838!important;border-radius:5px!important;background:#121212!important}
      .ixi-generic-face-v12 .gfv12-section h3{height:19px!important;min-height:19px!important;padding:0 7px!important;background:#181818!important;border-bottom-color:#292929!important;font-size:5.7px!important}
      .ixi-generic-face-v12 .gfv12-value{min-height:29px!important;padding:4px 7px!important;border-bottom-color:#282828!important}
      .ixi-generic-face-v12 .gfv12-value small{font-size:4.8px!important;line-height:1.05!important}.ixi-generic-face-v12 .gfv12-value strong{margin-top:2px!important;font-size:7.2px!important;line-height:1.05!important}.ixi-generic-face-v12 .gfv12-value em{margin-top:1px!important;font-size:4.7px!important}
      .ixi-generic-face-v12 .gfv12-grid{grid-template-columns:1fr 1fr!important}.ixi-generic-face-v12 .gfv12-grid .gfv12-value{min-height:34px!important}
      .ixi-generic-face-v12 .gfv12-relations button{min-height:27px!important;padding:3px 6px 3px 8px!important;border-bottom-color:#292929!important}.ixi-generic-face-v12 .gfv12-relations small{font-size:4.7px!important}.ixi-generic-face-v12 .gfv12-relations strong{margin-top:1px!important;font-size:6.8px!important}.ixi-generic-face-v12 .gfv12-relations em{margin-top:1px!important;font-size:4.6px!important}
      .ixi-generic-face-v12 .gfv12-empty{padding:9px!important;font-size:5px!important}

      /* 001-003/other V12 card shell helpers */
      .ixi-generic-overview .gov-relation-scroll,.ixi-generic-container-v12 .gcv12-section-scroll,.ixi-universal-card-007 .u007-section-scroll{scrollbar-width:thin;scrollbar-color:#5a5a5a #121212}

      /* Card 009's live IXI identity is rendered by IXIAosCardHeaderIdentity.
         Keep this module free of synthetic identity text so the real number
         cannot be covered by a decorative pseudo-element. */
    `}</style>
  );
}
