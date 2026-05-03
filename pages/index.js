export default function Home() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <section
        style={{
          height: '90vh',
          minHeight: '700px',
          backgroundImage: "url('/images/hero-equipment-yard.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          color: 'white'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '900px' }}>
          <h1 style={{ fontSize: '64px', fontWeight: '900', lineHeight: '1.0' }}>
            Free Heavy Equipment Marketplace
          </h1>

          <p style={{ marginTop: '20px', fontSize: '22px' }}>
            No fees. No credit cards. Listings live in minutes.
          </p>

          <div style={{ marginTop: '40px' }}>
            <a href="https://staging.ironxchange.com/l/new">
              <button style={{ padding: '18px 34px', background: '#F98512', border: 'none', color: 'black', fontWeight: '900', marginRight: '12px', cursor: 'pointer' }}>
                POST EQUIPMENT FREE
              </button>
            </a>

            <a href="https://staging.ironxchange.com/s">
              <button style={{ padding: '18px 34px', background: 'transparent', border: '2px solid white', color: 'white', fontWeight: '900', cursor: 'pointer' }}>
                BROWSE EQUIPMENT
              </button>
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 20px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', background: 'white', padding: '24px', borderRadius: '14px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)', display: 'flex', gap: '12px' }}>
          <input
            placeholder="Search equipment — CAT 320, D6 Dozer, Bell B30E..."
            style={{ flex: 1, padding: '18px', fontSize: '17px', border: '1px solid #ccc', borderRadius: '8px' }}
          />

          <a href="https://staging.ironxchange.com/s">
            <button style={{ padding: '18px 32px', background: '#F98512', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' }}>
              SEARCH
            </button>
          </a>
        </div>
      </section>
    </div>
  );
}
