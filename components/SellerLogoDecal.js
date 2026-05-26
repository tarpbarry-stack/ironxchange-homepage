export default function SellerLogoDecal({
  logo,
  name = "Seller",
  className = "",
  offsetX = 0
}) {
  
  return (
    <div className={`seller-logo-decal ${className}`}>
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
          width: 185px;
          height: 82px;

          display: flex;
          align-items: center;
          justify-content: flex-start;

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
          display: block;
        }

        .seller-logo-decal i {
          color: rgba(255,255,255,.42);
          font-size: 28px;
        }
      `}</style>
    </div>
  );
}
