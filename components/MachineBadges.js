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



  border: 1px solid rgba(255,255,255,.05);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.012),
      rgba(0,0,0,.08)
    ),
    #111111;

  color: rgba(255,255,255,.52);

  text-transform: lowercase;

  box-shadow:
    inset 0 1px 1px rgba(0,0,0,.42),
    inset 0 -1px 0 rgba(255,255,255,.02);

  text-shadow:
    0 1px 0 rgba(0,0,0,.55);

  transition:
    border-color .14s ease,
    color .14s ease,
    background .14s ease,
    transform .14s ease;
}


       .machine-badges span:hover {
  transform: translateY(-1px);

  border-color: rgba(255,196,0,.16);

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.028),
      rgba(0,0,0,.10)
    ),
    #141414;

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

  row-gap: 8px;
  column-gap: 8px;
}

.machine-badges.card span {
  min-height: 18px;

  padding: 2px 7px;

  border-radius: 1px;

  border-top: 1px solid rgba(255,255,255,.075);
  border-left: 1px solid rgba(255,255,255,.052);
  border-right: 1px solid rgba(0,0,0,.36);
  border-bottom: 1px solid rgba(0,0,0,.46);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.026),
      rgba(255,255,255,.010) 45%,
      rgba(0,0,0,.035)
    ),
    #171717;

  color: rgba(255,255,255,.40);

  font-size: 10.5px;
  font-weight: 500;

  letter-spacing: .01px;
  line-height: 1;

  white-space: nowrap;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.025),
    inset 0 -1px 1px rgba(0,0,0,.34),
    0 1px 0 rgba(255,255,255,.012);

  text-shadow:
    0 1px 0 rgba(0,0,0,.52);
}

.machine-badges.card span:hover {
  transform: translateY(-1px);

  color: rgba(255,255,255,.76);

  border-top-color: rgba(255,255,255,.16);
  border-left-color: rgba(255,255,255,.11);
  border-right-color: rgba(0,0,0,.48);
  border-bottom-color: rgba(0,0,0,.62);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.045),
      rgba(255,255,255,.014) 46%,
      rgba(0,0,0,.055)
    ),
    #1a1a1a;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.045),
    inset 0 -1px 1px rgba(0,0,0,.42),
    0 2px 5px rgba(0,0,0,.20);
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
