export default function SellerLogoDecal({
  logo,
  name = "Seller",
  variant = "slug",
  className = "",
  offsetX = 0
}) {
  return (
    <div className={`seller-logo-decal ${variant} ${className}`}>
      {logo ? (
        <img
          src={logo}
          alt={name}
          style={{ transform: `translateX(${offsetX}px)` }}
        />
      ) : (
        <i className="fa-regular fa-user"></i>
      )}

      <style jsx>{`
        .seller-logo-decal {
          display: flex;
          align-items: center;
          justify-content: center;

          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          overflow: visible;

          flex: 0 0 auto;
        }

        .seller-logo-decal img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .seller-logo-decal i {
          color: rgba(255,255,255,.42);
          font-size: 24px;
        }

        .seller-logo-decal.slug {
          width: 185px;
          height: 82px;
        }

        .seller-logo-decal.account {
          width: 150px;
          height: 68px;
          margin: 0 auto 8px;
        }

        .seller-logo-decal.rail {
          width: 132px;
          height: 62px;
          margin: 0 auto 8px;
        }

        .seller-logo-decal.card {
          width: 92px;
          height: 36px;
        }

        .seller-logo-decal.live {
          width: 150px;
          height: 68px;
        }

        .seller-logo-decal.mobile {
          width: 118px;
          height: 52px;
        }
      `}</style>
    </div>
  );
}
