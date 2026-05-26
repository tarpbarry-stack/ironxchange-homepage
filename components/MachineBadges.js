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
          display: inline-flex;
          align-items: center;
          justify-content: center;

          border-radius: 999px;

          border: 1px solid rgba(255,255,255,.055);

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.03),
              rgba(255,255,255,.01)
            );

          color: rgba(255,255,255,.44);

          text-transform: lowercase;

          backdrop-filter: blur(2px);

          transition:
            border-color .14s ease,
            background .14s ease,
            color .14s ease;
        }

        .machine-badges span:hover {
          border-color: rgba(255,196,0,.18);

          background:
            linear-gradient(
              180deg,
              rgba(255,196,0,.05),
              rgba(255,196,0,.01)
            );

          color: rgba(255,255,255,.72);
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
