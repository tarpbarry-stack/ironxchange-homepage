// /components/passport/PassportPresentationCard.jsx

export default function PassportPresentationCard({
  presentation = {}
}) {
  const {
    passportId,
    title,
    heroPhoto,
    gallery = [],
    price,
    hours,
    location,
    serialNumber,
    stockNumber,
    description,
    seller = {}
  } = presentation;

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        background: "#111111",
        border: "1px solid #2a2a2a",
        borderRadius: 14,
        overflow: "hidden",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 12px 40px rgba(0,0,0,.45)"
      }}
    >
      {/* Header */}

      <div
        style={{
          padding: 24,
          textAlign: "center",
          borderBottom: "1px solid #222"
        }}
      >
        {seller.logo ? (
          <img
            src={seller.logo}
            alt={seller.name}
            style={{
              height: 56,
              objectFit: "contain",
              marginBottom: 16
            }}
          />
        ) : null}

        <div
          style={{
            color: "#FFC400",
            fontWeight: 700,
            letterSpacing: "0.18em",
            fontSize: 12
          }}
        >
          MACHINE PASSPORT {passportId}
        </div>

        <h1
          style={{
            margin: "16px 0 0",
            fontSize: 38,
            fontWeight: 700
          }}
        >
          {title}
        </h1>
      </div>

      {/* Hero */}

      {heroPhoto ? (
        <img
          src={heroPhoto}
          alt={title}
          style={{
            width: "100%",
            display: "block"
          }}
        />
      ) : null}

      {/* Facts */}

      <div
        style={{
          padding: 28
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 28
          }}
        >
          <Fact
            label="PRICE"
            value={price}
          />

          <Fact
            label="HOURS"
            value={hours}
          />

          <Fact
            label="LOCATION"
            value={location}
          />

          <Fact
            label="PASSPORT"
            value={passportId}
          />

          <Fact
            label="SERIAL"
            value={serialNumber}
          />

          <Fact
            label="STOCK"
            value={stockNumber}
          />
        </div>

        <SectionTitle>
          MACHINE SUMMARY
        </SectionTitle>

        <p
          style={{
            lineHeight: 1.7,
            color: "#d8d8d8",
            marginTop: 12
          }}
        >
          {description}
        </p>

        {gallery.length > 1 ? (
          <>
            <SectionTitle>
              PHOTO GALLERY
            </SectionTitle>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 18
              }}
            >
              {gallery.slice(1).map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt=""
                  style={{
                    width: "100%",
                    borderRadius: 8
                  }}
                />
              ))}
            </div>
          </>
        ) : null}

        <SectionTitle>
          SELLER
        </SectionTitle>

        <div
          style={{
            marginTop: 14,
            lineHeight: 1.8
          }}
        >
          <div>{seller.name}</div>

          <div>{seller.location}</div>

          <div>{seller.phone}</div>

          <div>{seller.email}</div>
        </div>

        <button
          style={{
            marginTop: 36,
            width: "100%",
            padding: "18px",
            background: "#FFC400",
            color: "#000",
            fontWeight: 700,
            border: 0,
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 18
          }}
        >
          VIEW PASSPORT
        </button>
      </div>
    </div>
  );
}

function Fact({
  label,
  value
}) {
  return (
    <div>
      <div
        style={{
          color: "#888",
          fontSize: 12,
          letterSpacing: ".15em",
          marginBottom: 6
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: 22
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function SectionTitle({
  children
}) {
  return (
    <div
      style={{
        marginTop: 36,
        paddingTop: 20,
        borderTop: "1px solid #2a2a2a",
        color: "#FFC400",
        fontWeight: 700,
        letterSpacing: ".18em",
        fontSize: 12
      }}
    >
      {children}
    </div>
  );
}
