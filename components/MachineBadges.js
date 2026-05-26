import React from "react";

export default function MachineBadges({
  keywords = [],
  variant = "slug"
}) {
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return null;
  }

  const cleanKeywords = [...new Set(
    keywords
      .filter(Boolean)
      .map(item => String(item).trim().toLowerCase())
  )];

  return (
    <div className={`machine-badges ${variant}`}>
      {cleanKeywords.map((keyword, index) => (
        <span key={`${keyword}-${index}`}>
          {keyword}
        </span>
      ))}

      <style jsx>{`
        .machine-badges {
          display: flex;
          flex-wrap: wrap;
          align-content: flex-start;
        }

       .machine-badges span {
  position: relative;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: 999px;

  border: 1px solid rgba(255,255,255,.075);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.075) 0%,
      rgba(255,255,255,.025) 34%,
      rgba(0,0,0,.12) 100%
    ),
    #131313;

  color: rgba(255,255,255,.58);

  text-transform: lowercase;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.12),
    inset 0 -1px 0 rgba(0,0,0,.48),
    0 1px 0 rgba(255,255,255,.035),
    0 5px 12px rgba(0,0,0,.18);

  text-shadow:
    0 1px 0 rgba(0,0,0,.45);

  overflow: hidden;

  transition:
    border-color .14s ease,
    background .14s ease,
    color .14s ease,
    box-shadow .14s ease,
    transform .14s ease;
}
.machine-badges span::before {
  content: "";

  position: absolute;

  left: 7%;
  right: 7%;
  top: 1px;

  height: 38%;

  border-radius: 999px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.16),
      rgba(255,255,255,0)
    );

  pointer-events: none;
}

.machine-badges span::after {
  content: "";

  position: absolute;

  inset: 1px;

  border-radius: 999px;

  border: 1px solid rgba(0,0,0,.22);

  pointer-events: none;
}
        .machine-badges span:hover {
  transform: translateY(-1px);

  border-color: rgba(255,196,0,.26);

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.095) 0%,
      rgba(255,255,255,.035) 36%,
      rgba(0,0,0,.14) 100%
    ),
    #16130a;

  color: rgba(255,255,255,.78);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.16),
    inset 0 -1px 0 rgba(0,0,0,.52),
    0 1px 0 rgba(255,255,255,.04),
    0 6px 14px rgba(0,0,0,.22),
    0 0 14px rgba(255,196,0,.055);
}

       /* SLUG PAGE */

.machine-badges.slug {
  gap: 6px;
}

.machine-badges.slug span {
  min-height: 22px;

  padding: 4px 8px;

  border-color: rgba(255,255,255,.055);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.028),
      rgba(255,255,255,.01)
    );

  color: rgba(255,255,255,.43);

  font-size: 8.75px;
  font-weight: 850;

  letter-spacing: .13px;
  line-height: 1;
}

.machine-badges.slug span:nth-child(-n+3) {
  border-color: rgba(255,196,0,.20);

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.055),
      rgba(255,196,0,.012)
    );

  color: rgba(255,255,255,.58);
}

        /* CARD */

   .machine-badges.card {
  display: flex;

  flex-wrap: wrap;

  justify-content: center;

  align-content: flex-start;

  gap: 8px 8px;
}

.machine-badges.card span {
  min-height: 20px;

  padding: 2px 6px;

  font-size: 11px;
  font-weight: 500;

  letter-spacing: .01px;
  line-height: 1;

  border-radius: 999px;

  white-space: nowrap;
}

        /* STUDIO */

        .machine-badges.studio {
          gap: 6px;
        }

        .machine-badges.studio span {
          min-height: 24px;

          padding: 4px 9px;

          font-size: 9px;
          font-weight: 900;

          letter-spacing: .14px;
          line-height: 1;
        }

        /* MOBILE */

        .machine-badges.mobile {
          gap: 5px;
        }

        .machine-badges.mobile span {
          min-height: 20px;

          padding: 3px 7px;

          font-size: 7.5px;
          font-weight: 850;

          line-height: 1;
        }
      `}</style>
    </div>
  );
}
