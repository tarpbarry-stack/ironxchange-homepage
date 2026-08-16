export default function IXIAosExpandedSkinStyles() {
  return (
    <style jsx global>{`
      /* ============================================================
         IXI AOS EXPANDED SKIN FAMILY
         Presentation only. Geometry/data/runtime remain untouched.
         Extends every Location surface: 001/002/003 + F2/F3/F4/F5.
         ============================================================ */

      /* ---------- theme tokens ---------- */
      .ixi-location-overview:has(.skin-default),
      .ixi-aos-location-f2:has(.skin-default),
      .f3-financial:has(.skin-default),
      .f4-obligations:has(.skin-default),
      .f5:has(.skin-default) {
        --xs-bg:#090b0a;--xs-head:#0d100e;--xs-shell:#111512;--xs-shell2:#161b17;
        --xs-row:#101411;--xs-row2:#151a16;--xs-line:#343b35;--xs-soft:#252b26;
        --xs-text:#f4f5f4;--xs-muted:#929a94;--xs-accent:#ffc400;
      }

      .ixi-location-overview:has(.skin-ledger),
      .ixi-aos-location-f2:has(.skin-ledger),
      .f3-financial:has(.skin-ledger),
      .f4-obligations:has(.skin-ledger),
      .f5:has(.skin-ledger) {
        --xs-bg:#d9cfb6;--xs-head:#cbbf9f;--xs-shell:#e9dfc7;--xs-shell2:#f2e9d3;
        --xs-row:#e4dac2;--xs-row2:#eee4cd;--xs-line:#8d7958;--xs-soft:#b8a889;
        --xs-text:#34281b;--xs-muted:#77684f;--xs-accent:#765023;
      }

      .ixi-location-overview:has(.skin-foundry),
      .ixi-aos-location-f2:has(.skin-foundry),
      .f3-financial:has(.skin-foundry),
      .f4-obligations:has(.skin-foundry),
      .f5:has(.skin-foundry) {
        --xs-bg:#111416;--xs-head:#171b1e;--xs-shell:#1b2023;--xs-shell2:#22282c;
        --xs-row:#181d20;--xs-row2:#20262a;--xs-line:#454c50;--xs-soft:#30363a;
        --xs-text:#f0eee7;--xs-muted:#9b9b94;--xs-accent:#e47d20;
      }

      .ixi-location-overview:has(.skin-stock),
      .ixi-aos-location-f2:has(.skin-stock),
      .f3-financial:has(.skin-stock),
      .f4-obligations:has(.skin-stock),
      .f5:has(.skin-stock) {
        --xs-bg:#e8eee4;--xs-head:#dce7d8;--xs-shell:#f3f6ef;--xs-shell2:#e6eee2;
        --xs-row:#edf3e9;--xs-row2:#e1eadc;--xs-line:#71846c;--xs-soft:#aab9a5;
        --xs-text:#1d3522;--xs-muted:#647565;--xs-accent:#356b3f;
      }

      .ixi-location-overview:has(.skin-bond),
      .ixi-aos-location-f2:has(.skin-bond),
      .f3-financial:has(.skin-bond),
      .f4-obligations:has(.skin-bond),
      .f5:has(.skin-bond) {
        --xs-bg:#e8ddc8;--xs-head:#ded0b5;--xs-shell:#f3e9d7;--xs-shell2:#e9dcc6;
        --xs-row:#eee3cf;--xs-row2:#e5d7bf;--xs-line:#8b7059;--xs-soft:#bca990;
        --xs-text:#3c2921;--xs-muted:#776355;--xs-accent:#8a402f;
      }

      .ixi-location-overview:has(.skin-modern-money),
      .ixi-aos-location-f2:has(.skin-modern-money),
      .f3-financial:has(.skin-modern-money),
      .f4-obligations:has(.skin-modern-money),
      .f5:has(.skin-modern-money) {
        --xs-bg:#07110c;--xs-head:#0b1811;--xs-shell:#102119;--xs-shell2:#152a20;
        --xs-row:#0e1d16;--xs-row2:#14261d;--xs-line:#345c47;--xs-soft:#234334;
        --xs-text:#eef7f1;--xs-muted:#89a897;--xs-accent:#8fd36a;
      }

      .ixi-location-overview:has(.skin-old-currency),
      .ixi-aos-location-f2:has(.skin-old-currency),
      .f3-financial:has(.skin-old-currency),
      .f4-obligations:has(.skin-old-currency),
      .f5:has(.skin-old-currency) {
        --xs-bg:#bcae8f;--xs-head:#aa9a78;--xs-shell:#cfc19f;--xs-shell2:#d9cca9;
        --xs-row:#c8b996;--xs-row2:#d2c4a1;--xs-line:#6d624b;--xs-soft:#9b8d70;
        --xs-text:#2d2a22;--xs-muted:#655f50;--xs-accent:#4c623c;
      }

      /* ---------- root material ---------- */
      .ixi-location-overview:has(.skin-default),.ixi-aos-location-f2:has(.skin-default),.f3-financial:has(.skin-default),.f4-obligations:has(.skin-default),.f5:has(.skin-default),
      .ixi-location-overview:has(.skin-ledger),.ixi-aos-location-f2:has(.skin-ledger),.f3-financial:has(.skin-ledger),.f4-obligations:has(.skin-ledger),.f5:has(.skin-ledger),
      .ixi-location-overview:has(.skin-foundry),.ixi-aos-location-f2:has(.skin-foundry),.f3-financial:has(.skin-foundry),.f4-obligations:has(.skin-foundry),.f5:has(.skin-foundry),
      .ixi-location-overview:has(.skin-stock),.ixi-aos-location-f2:has(.skin-stock),.f3-financial:has(.skin-stock),.f4-obligations:has(.skin-stock),.f5:has(.skin-stock),
      .ixi-location-overview:has(.skin-bond),.ixi-aos-location-f2:has(.skin-bond),.f3-financial:has(.skin-bond),.f4-obligations:has(.skin-bond),.f5:has(.skin-bond),
      .ixi-location-overview:has(.skin-modern-money),.ixi-aos-location-f2:has(.skin-modern-money),.f3-financial:has(.skin-modern-money),.f4-obligations:has(.skin-modern-money),.f5:has(.skin-modern-money),
      .ixi-location-overview:has(.skin-old-currency),.ixi-aos-location-f2:has(.skin-old-currency),.f3-financial:has(.skin-old-currency),.f4-obligations:has(.skin-old-currency),.f5:has(.skin-old-currency) {
        background:var(--xs-bg)!important;
        border-color:var(--xs-line)!important;
        color:var(--xs-text)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 38px rgba(0,0,0,.35)!important;
      }

      /* paper/certificate texture without images */
      .ixi-location-overview:has(.skin-ledger),.ixi-aos-location-f2:has(.skin-ledger),.f3-financial:has(.skin-ledger),.f4-obligations:has(.skin-ledger),.f5:has(.skin-ledger),
      .ixi-location-overview:has(.skin-stock),.ixi-aos-location-f2:has(.skin-stock),.f3-financial:has(.skin-stock),.f4-obligations:has(.skin-stock),.f5:has(.skin-stock),
      .ixi-location-overview:has(.skin-bond),.ixi-aos-location-f2:has(.skin-bond),.f3-financial:has(.skin-bond),.f4-obligations:has(.skin-bond),.f5:has(.skin-bond),
      .ixi-location-overview:has(.skin-old-currency),.ixi-aos-location-f2:has(.skin-old-currency),.f3-financial:has(.skin-old-currency),.f4-obligations:has(.skin-old-currency),.f5:has(.skin-old-currency) {
        background-image:
          repeating-linear-gradient(0deg,rgba(70,50,28,.022) 0,rgba(70,50,28,.022) 1px,transparent 1px,transparent 4px),
          radial-gradient(circle at 15% 8%,rgba(255,255,255,.32),transparent 28%)!important;
      }

      /* ---------- headers ---------- */
      .ixi-location-overview:has([class*="skin-"]) .loc-head,
      .ixi-aos-location-f2:has([class*="skin-"]) .ops-header,
      .f3-financial:has([class*="skin-"]) .f3-header,
      .f4-obligations:has([class*="skin-"]) .f4-header,
      .f5:has([class*="skin-"]) .f5-head { border-bottom-color:var(--xs-soft)!important; }

      .ixi-location-overview:has(.skin-default) .loc-head,.ixi-aos-location-f2:has(.skin-default) .ops-header,.f3-financial:has(.skin-default) .f3-header,.f4-obligations:has(.skin-default) .f4-header,.f5:has(.skin-default) .f5-head,
      .ixi-location-overview:has(.skin-ledger) .loc-head,.ixi-aos-location-f2:has(.skin-ledger) .ops-header,.f3-financial:has(.skin-ledger) .f3-header,.f4-obligations:has(.skin-ledger) .f4-header,.f5:has(.skin-ledger) .f5-head,
      .ixi-location-overview:has(.skin-foundry) .loc-head,.ixi-aos-location-f2:has(.skin-foundry) .ops-header,.f3-financial:has(.skin-foundry) .f3-header,.f4-obligations:has(.skin-foundry) .f4-header,.f5:has(.skin-foundry) .f5-head,
      .ixi-location-overview:has(.skin-stock) .loc-head,.ixi-aos-location-f2:has(.skin-stock) .ops-header,.f3-financial:has(.skin-stock) .f3-header,.f4-obligations:has(.skin-stock) .f4-header,.f5:has(.skin-stock) .f5-head,
      .ixi-location-overview:has(.skin-bond) .loc-head,.ixi-aos-location-f2:has(.skin-bond) .ops-header,.f3-financial:has(.skin-bond) .f3-header,.f4-obligations:has(.skin-bond) .f4-header,.f5:has(.skin-bond) .f5-head,
      .ixi-location-overview:has(.skin-modern-money) .loc-head,.ixi-aos-location-f2:has(.skin-modern-money) .ops-header,.f3-financial:has(.skin-modern-money) .f3-header,.f4-obligations:has(.skin-modern-money) .f4-header,.f5:has(.skin-modern-money) .f5-head,
      .ixi-location-overview:has(.skin-old-currency) .loc-head,.ixi-aos-location-f2:has(.skin-old-currency) .ops-header,.f3-financial:has(.skin-old-currency) .f3-header,.f4-obligations:has(.skin-old-currency) .f4-header,.f5:has(.skin-old-currency) .f5-head {
        background:var(--xs-head)!important;color:var(--xs-text)!important;
      }

      /* ---------- semantic shells ---------- */
      .ixi-location-overview:has(.skin-default) .loc-address-card,.ixi-location-overview:has(.skin-default) .loc-contact-card,.ixi-location-overview:has(.skin-default) .loc-metrics .ixi-aos-inline-metric,.ixi-location-overview:has(.skin-default) .loc-relationships,
      .ixi-location-overview:has(.skin-ledger) .loc-address-card,.ixi-location-overview:has(.skin-ledger) .loc-contact-card,.ixi-location-overview:has(.skin-ledger) .loc-metrics .ixi-aos-inline-metric,.ixi-location-overview:has(.skin-ledger) .loc-relationships,
      .ixi-location-overview:has(.skin-foundry) .loc-address-card,.ixi-location-overview:has(.skin-foundry) .loc-contact-card,.ixi-location-overview:has(.skin-foundry) .loc-metrics .ixi-aos-inline-metric,.ixi-location-overview:has(.skin-foundry) .loc-relationships,
      .ixi-location-overview:has(.skin-stock) .loc-address-card,.ixi-location-overview:has(.skin-stock) .loc-contact-card,.ixi-location-overview:has(.skin-stock) .loc-metrics .ixi-aos-inline-metric,.ixi-location-overview:has(.skin-stock) .loc-relationships,
      .ixi-location-overview:has(.skin-bond) .loc-address-card,.ixi-location-overview:has(.skin-bond) .loc-contact-card,.ixi-location-overview:has(.skin-bond) .loc-metrics .ixi-aos-inline-metric,.ixi-location-overview:has(.skin-bond) .loc-relationships,
      .ixi-location-overview:has(.skin-modern-money) .loc-address-card,.ixi-location-overview:has(.skin-modern-money) .loc-contact-card,.ixi-location-overview:has(.skin-modern-money) .loc-metrics .ixi-aos-inline-metric,.ixi-location-overview:has(.skin-modern-money) .loc-relationships,
      .ixi-location-overview:has(.skin-old-currency) .loc-address-card,.ixi-location-overview:has(.skin-old-currency) .loc-contact-card,.ixi-location-overview:has(.skin-old-currency) .loc-metrics .ixi-aos-inline-metric,.ixi-location-overview:has(.skin-old-currency) .loc-relationships,
      .ixi-aos-location-f2:has(.skin-default) .gate-code,.ixi-aos-location-f2:has(.skin-default) .ops-section,.ixi-aos-location-f2:has(.skin-ledger) .gate-code,.ixi-aos-location-f2:has(.skin-ledger) .ops-section,.ixi-aos-location-f2:has(.skin-foundry) .gate-code,.ixi-aos-location-f2:has(.skin-foundry) .ops-section,.ixi-aos-location-f2:has(.skin-stock) .gate-code,.ixi-aos-location-f2:has(.skin-stock) .ops-section,.ixi-aos-location-f2:has(.skin-bond) .gate-code,.ixi-aos-location-f2:has(.skin-bond) .ops-section,.ixi-aos-location-f2:has(.skin-modern-money) .gate-code,.ixi-aos-location-f2:has(.skin-modern-money) .ops-section,.ixi-aos-location-f2:has(.skin-old-currency) .gate-code,.ixi-aos-location-f2:has(.skin-old-currency) .ops-section,
      .f3-financial:has(.skin-default) .ownership,.f3-financial:has(.skin-default) .f3-section,.f3-financial:has(.skin-default) .big-value,.f3-financial:has(.skin-ledger) .ownership,.f3-financial:has(.skin-ledger) .f3-section,.f3-financial:has(.skin-ledger) .big-value,.f3-financial:has(.skin-foundry) .ownership,.f3-financial:has(.skin-foundry) .f3-section,.f3-financial:has(.skin-foundry) .big-value,.f3-financial:has(.skin-stock) .ownership,.f3-financial:has(.skin-stock) .f3-section,.f3-financial:has(.skin-stock) .big-value,.f3-financial:has(.skin-bond) .ownership,.f3-financial:has(.skin-bond) .f3-section,.f3-financial:has(.skin-bond) .big-value,.f3-financial:has(.skin-modern-money) .ownership,.f3-financial:has(.skin-modern-money) .f3-section,.f3-financial:has(.skin-modern-money) .big-value,.f3-financial:has(.skin-old-currency) .ownership,.f3-financial:has(.skin-old-currency) .f3-section,.f3-financial:has(.skin-old-currency) .big-value,
      .f4-obligations:has(.skin-default) .f4-next,.f4-obligations:has(.skin-default) .f4-metric,.f4-obligations:has(.skin-default) .f4-section,.f4-obligations:has(.skin-ledger) .f4-next,.f4-obligations:has(.skin-ledger) .f4-metric,.f4-obligations:has(.skin-ledger) .f4-section,.f4-obligations:has(.skin-foundry) .f4-next,.f4-obligations:has(.skin-foundry) .f4-metric,.f4-obligations:has(.skin-foundry) .f4-section,.f4-obligations:has(.skin-stock) .f4-next,.f4-obligations:has(.skin-stock) .f4-metric,.f4-obligations:has(.skin-stock) .f4-section,.f4-obligations:has(.skin-bond) .f4-next,.f4-obligations:has(.skin-bond) .f4-metric,.f4-obligations:has(.skin-bond) .f4-section,.f4-obligations:has(.skin-modern-money) .f4-next,.f4-obligations:has(.skin-modern-money) .f4-metric,.f4-obligations:has(.skin-modern-money) .f4-section,.f4-obligations:has(.skin-old-currency) .f4-next,.f4-obligations:has(.skin-old-currency) .f4-metric,.f4-obligations:has(.skin-old-currency) .f4-section,
      .f5:has(.skin-default) .f5-banner,.f5:has(.skin-default) .f5-sec,.f5:has(.skin-ledger) .f5-banner,.f5:has(.skin-ledger) .f5-sec,.f5:has(.skin-foundry) .f5-banner,.f5:has(.skin-foundry) .f5-sec,.f5:has(.skin-stock) .f5-banner,.f5:has(.skin-stock) .f5-sec,.f5:has(.skin-bond) .f5-banner,.f5:has(.skin-bond) .f5-sec,.f5:has(.skin-modern-money) .f5-banner,.f5:has(.skin-modern-money) .f5-sec,.f5:has(.skin-old-currency) .f5-banner,.f5:has(.skin-old-currency) .f5-sec {
        background:var(--xs-shell)!important;border-color:var(--xs-line)!important;color:var(--xs-text)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important;
      }

      /* ---------- rows / section bars ---------- */
      .ixi-location-overview:has(.skin-default) .relationship-row,.ixi-location-overview:has(.skin-ledger) .relationship-row,.ixi-location-overview:has(.skin-foundry) .relationship-row,.ixi-location-overview:has(.skin-stock) .relationship-row,.ixi-location-overview:has(.skin-bond) .relationship-row,.ixi-location-overview:has(.skin-modern-money) .relationship-row,.ixi-location-overview:has(.skin-old-currency) .relationship-row,
      .ixi-aos-location-f2:has(.skin-default) .ops-row,.ixi-aos-location-f2:has(.skin-default) .ops-cell,.ixi-aos-location-f2:has(.skin-ledger) .ops-row,.ixi-aos-location-f2:has(.skin-ledger) .ops-cell,.ixi-aos-location-f2:has(.skin-foundry) .ops-row,.ixi-aos-location-f2:has(.skin-foundry) .ops-cell,.ixi-aos-location-f2:has(.skin-stock) .ops-row,.ixi-aos-location-f2:has(.skin-stock) .ops-cell,.ixi-aos-location-f2:has(.skin-bond) .ops-row,.ixi-aos-location-f2:has(.skin-bond) .ops-cell,.ixi-aos-location-f2:has(.skin-modern-money) .ops-row,.ixi-aos-location-f2:has(.skin-modern-money) .ops-cell,.ixi-aos-location-f2:has(.skin-old-currency) .ops-row,.ixi-aos-location-f2:has(.skin-old-currency) .ops-cell,
      .f4-obligations:has(.skin-default) .f4-row,.f4-obligations:has(.skin-ledger) .f4-row,.f4-obligations:has(.skin-foundry) .f4-row,.f4-obligations:has(.skin-stock) .f4-row,.f4-obligations:has(.skin-bond) .f4-row,.f4-obligations:has(.skin-modern-money) .f4-row,.f4-obligations:has(.skin-old-currency) .f4-row,
      .f5:has(.skin-default) .attention>div,.f5:has(.skin-default) .systems>div,.f5:has(.skin-ledger) .attention>div,.f5:has(.skin-ledger) .systems>div,.f5:has(.skin-foundry) .attention>div,.f5:has(.skin-foundry) .systems>div,.f5:has(.skin-stock) .attention>div,.f5:has(.skin-stock) .systems>div,.f5:has(.skin-bond) .attention>div,.f5:has(.skin-bond) .systems>div,.f5:has(.skin-modern-money) .attention>div,.f5:has(.skin-modern-money) .systems>div,.f5:has(.skin-old-currency) .attention>div,.f5:has(.skin-old-currency) .systems>div {
        background:var(--xs-row)!important;border-color:var(--xs-soft)!important;color:var(--xs-text)!important;
      }

      .ixi-location-overview:has(.skin-default) .relationship-row:nth-child(even),.ixi-location-overview:has(.skin-ledger) .relationship-row:nth-child(even),.ixi-location-overview:has(.skin-foundry) .relationship-row:nth-child(even),.ixi-location-overview:has(.skin-stock) .relationship-row:nth-child(even),.ixi-location-overview:has(.skin-bond) .relationship-row:nth-child(even),.ixi-location-overview:has(.skin-modern-money) .relationship-row:nth-child(even),.ixi-location-overview:has(.skin-old-currency) .relationship-row:nth-child(even),
      .f4-obligations:has(.skin-default) .f4-row:nth-child(even),.f4-obligations:has(.skin-ledger) .f4-row:nth-child(even),.f4-obligations:has(.skin-foundry) .f4-row:nth-child(even),.f4-obligations:has(.skin-stock) .f4-row:nth-child(even),.f4-obligations:has(.skin-bond) .f4-row:nth-child(even),.f4-obligations:has(.skin-modern-money) .f4-row:nth-child(even),.f4-obligations:has(.skin-old-currency) .f4-row:nth-child(even) {background:var(--xs-row2)!important}

      /* ---------- readable text mapping for light/dark skins ---------- */
      .ixi-location-overview:has(.skin-ledger) :is(.loc-identity>strong,.loc-preview>strong,.loc-contact-person strong,.relationship-row strong,.loc-address-card .ixi-aos-inline-address strong,.loc-contact-address .ixi-aos-inline-address strong),
      .ixi-location-overview:has(.skin-stock) :is(.loc-identity>strong,.loc-preview>strong,.loc-contact-person strong,.relationship-row strong,.loc-address-card .ixi-aos-inline-address strong,.loc-contact-address .ixi-aos-inline-address strong),
      .ixi-location-overview:has(.skin-bond) :is(.loc-identity>strong,.loc-preview>strong,.loc-contact-person strong,.relationship-row strong,.loc-address-card .ixi-aos-inline-address strong,.loc-contact-address .ixi-aos-inline-address strong),
      .ixi-location-overview:has(.skin-old-currency) :is(.loc-identity>strong,.loc-preview>strong,.loc-contact-person strong,.relationship-row strong,.loc-address-card .ixi-aos-inline-address strong,.loc-contact-address .ixi-aos-inline-address strong),
      .f3-financial:has(.skin-ledger) :is(b,strong,label,.f3-row b),.f3-financial:has(.skin-stock) :is(b,strong,label,.f3-row b),.f3-financial:has(.skin-bond) :is(b,strong,label,.f3-row b),.f3-financial:has(.skin-old-currency) :is(b,strong,label,.f3-row b),
      .f4-obligations:has(.skin-ledger) :is(b,strong,.f4-row),.f4-obligations:has(.skin-stock) :is(b,strong,.f4-row),.f4-obligations:has(.skin-bond) :is(b,strong,.f4-row),.f4-obligations:has(.skin-old-currency) :is(b,strong,.f4-row),
      .f5:has(.skin-ledger) :is(b,strong,.f5-sec,.attention>div,.systems>div),.f5:has(.skin-stock) :is(b,strong,.f5-sec,.attention>div,.systems>div),.f5:has(.skin-bond) :is(b,strong,.f5-sec,.attention>div,.systems>div),.f5:has(.skin-old-currency) :is(b,strong,.f5-sec,.attention>div,.systems>div) {color:var(--xs-text)!important}

      .ixi-location-overview:has(.skin-ledger) :is(.relationship-row span,.loc-contact-person span),.ixi-location-overview:has(.skin-stock) :is(.relationship-row span,.loc-contact-person span),.ixi-location-overview:has(.skin-bond) :is(.relationship-row span,.loc-contact-person span),.ixi-location-overview:has(.skin-old-currency) :is(.relationship-row span,.loc-contact-person span),
      .f3-financial:has(.skin-ledger) span,.f3-financial:has(.skin-stock) span,.f3-financial:has(.skin-bond) span,.f3-financial:has(.skin-old-currency) span {color:var(--xs-muted)!important}

      /* accents */
      .ixi-location-overview:has(.skin-default) :is(.loc-identity>span,.ixi-face-section-title,.loc-pin),.ixi-location-overview:has(.skin-ledger) :is(.loc-identity>span,.ixi-face-section-title,.loc-pin),.ixi-location-overview:has(.skin-foundry) :is(.loc-identity>span,.ixi-face-section-title,.loc-pin),.ixi-location-overview:has(.skin-stock) :is(.loc-identity>span,.ixi-face-section-title,.loc-pin),.ixi-location-overview:has(.skin-bond) :is(.loc-identity>span,.ixi-face-section-title,.loc-pin),.ixi-location-overview:has(.skin-modern-money) :is(.loc-identity>span,.ixi-face-section-title,.loc-pin),.ixi-location-overview:has(.skin-old-currency) :is(.loc-identity>span,.ixi-face-section-title,.loc-pin),
      .ixi-aos-location-f2:has(.skin-default) :is(.ops-section-title,.gate-code label),.ixi-aos-location-f2:has(.skin-ledger) :is(.ops-section-title,.gate-code label),.ixi-aos-location-f2:has(.skin-foundry) :is(.ops-section-title,.gate-code label),.ixi-aos-location-f2:has(.skin-stock) :is(.ops-section-title,.gate-code label),.ixi-aos-location-f2:has(.skin-bond) :is(.ops-section-title,.gate-code label),.ixi-aos-location-f2:has(.skin-modern-money) :is(.ops-section-title,.gate-code label),.ixi-aos-location-f2:has(.skin-old-currency) :is(.ops-section-title,.gate-code label),
      .f3-financial:has(.skin-default) :is(.f3-section>h3,.face-banner),.f3-financial:has(.skin-ledger) :is(.f3-section>h3,.face-banner),.f3-financial:has(.skin-foundry) :is(.f3-section>h3,.face-banner),.f3-financial:has(.skin-stock) :is(.f3-section>h3,.face-banner),.f3-financial:has(.skin-bond) :is(.f3-section>h3,.face-banner),.f3-financial:has(.skin-modern-money) :is(.f3-section>h3,.face-banner),.f3-financial:has(.skin-old-currency) :is(.f3-section>h3,.face-banner),
      .f4-obligations:has(.skin-default) .f4-section>h3,.f4-obligations:has(.skin-ledger) .f4-section>h3,.f4-obligations:has(.skin-foundry) .f4-section>h3,.f4-obligations:has(.skin-stock) .f4-section>h3,.f4-obligations:has(.skin-bond) .f4-section>h3,.f4-obligations:has(.skin-modern-money) .f4-section>h3,.f4-obligations:has(.skin-old-currency) .f4-section>h3,
      .f5:has(.skin-default) .f5-sec>h3,.f5:has(.skin-ledger) .f5-sec>h3,.f5:has(.skin-foundry) .f5-sec>h3,.f5:has(.skin-stock) .f5-sec>h3,.f5:has(.skin-bond) .f5-sec>h3,.f5:has(.skin-modern-money) .f5-sec>h3,.f5:has(.skin-old-currency) .f5-sec>h3 {color:var(--xs-accent)!important;border-bottom-color:var(--xs-line)!important}

      /* header-control shells follow skin */
      .ixi-aos-card-header-controls.skin-default,.ixi-aos-card-header-controls.skin-ledger,.ixi-aos-card-header-controls.skin-foundry,.ixi-aos-card-header-controls.skin-stock,.ixi-aos-card-header-controls.skin-bond,.ixi-aos-card-header-controls.skin-modern-money,.ixi-aos-card-header-controls.skin-old-currency {
        border:1px solid var(--xs-line)!important;border-radius:8px!important;background:var(--xs-shell)!important;
      }
      .ixi-aos-card-header-controls.skin-ledger .header-action,.ixi-aos-card-header-controls.skin-stock .header-action,.ixi-aos-card-header-controls.skin-bond .header-action,.ixi-aos-card-header-controls.skin-old-currency .header-action {color:var(--xs-muted)!important;border-left-color:var(--xs-soft)!important}
      .ixi-aos-card-header-controls.skin-ledger .header-action.add,.ixi-aos-card-header-controls.skin-ledger .header-action.transact,.ixi-aos-card-header-controls.skin-stock .header-action.add,.ixi-aos-card-header-controls.skin-stock .header-action.transact,.ixi-aos-card-header-controls.skin-bond .header-action.add,.ixi-aos-card-header-controls.skin-bond .header-action.transact,.ixi-aos-card-header-controls.skin-old-currency .header-action.add,.ixi-aos-card-header-controls.skin-old-currency .header-action.transact {color:var(--xs-accent)!important}
    `}</style>
  );
}
