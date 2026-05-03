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
        {/* DARK OVERLAY */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.65)'
          }}
        />

        {/* CONTENT */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '900px' }}>
          
          <h1
            style={{
              fontSize: '64px',
              fontWeight: '900',
              lineHeight: '1.0'
            }}
          >
            Free Heavy Equipment Marketplace
          </h1>

          <p
            style={{
              marginTop: '20px',
              fontSize: '22px'
            }}
          >
            No fees. No credit cards. Listings live in minutes.
          </p>

          <div style={{ marginTop: '40px' }}>
            
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
                  border: '2px solid white',
                  color: 'white',
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
{/* SEARCH SECTION */}
<section style={{
  padding: '60px 20px',
  background: '#f5f5f5',
  display: 'flex',
  justifyContent: 'center'
}}>
  <div style={{
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '900px',
    display: 'flex',
    gap: '10px'
  }}>
    
    <input
      placeholder="Search equipment (CAT 320, D6 Dozer, etc...)"
      style={{
        flex: 1,
        padding: '15px',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '5px'
      }}
    />

    <a href="https://staging.ironxchange.com/s">
      <button style={{
        padding: '15px 25px',
        background: '#F98512',
        border: 'none',
        fontWeight: '900',
        cursor: 'pointer'
      }}>
        SEARCH
      </button>
    </a>

  </div>
</section>    </div>
  );
}
