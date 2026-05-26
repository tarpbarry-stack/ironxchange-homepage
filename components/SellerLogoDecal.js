export default function SellerLogoDecal({
  logo,
  name = "Seller",
  className = ""
}) {
  if (!logo) {
    return (
      <div className={`seller-logo-fallback ${className}`} aria-label={name}>
        <i className="fa-regular fa-user"></i>

        <style jsx>{`
          .seller-logo-fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            border-radius: 0;
            color: rgba(255,255,255,.42);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`seller-logo-decal ${className}`}>
      <img src={logo} alt={name} />

      <style jsx>{`
        .seller-logo-decal {
          display: flex;
          align-items: center;
          justify-content: flex-start;

          width: 132px;
          height: 70px;

          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          overflow: visible;
        }

        .seller-logo-decal img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;

          object-fit: contain;
          object-position: center;

          display: block;

          filter:
            contrast(1.04)
            saturate(1.02);
        }
      `}</style>
    </div>
  );
}
