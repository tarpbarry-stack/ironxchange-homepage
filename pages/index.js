export default function Home() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <section
        style={{
          height: '85vh',
          minHeight: '650px',
          backgroundImage: "url('/images/hero-equipment-yard.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.62)'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '900px', padding: '0 24px' }}>
          <h1 style={{ fontSize: '64px', lineHeight: '0.95', fontWeight: '900', margin: 0 }}>
            Free Heavy Equipment Marketplace
          </h1>

          <p style={{ marginTop: '24px', fontSize: '24px', fontWeight: '600' }}>
            No fees. No credit cards. Listings live in minutes.
          </p>

          <div style={{ marginTop: '36px' }}>
            <a href="https://staging.ironxchange.com/l/new">
              <button
                style={{
                  padding: '18px 34px',
                  background: '#F98512',
                  border: 'none',
                  color: 'black',
                  fontWeight: '900',
                  marginRight: '12px',
                  cursor: 'pointer'
                }}
              >
                POST EQUIPMENT FREE
              </button>
            </a>

            <a href="https://staging.ironxchange.com/s">
              <button
                style={{
                  padding: '18px 34px',
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid white',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                BROWSE EQUIPMENT
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
