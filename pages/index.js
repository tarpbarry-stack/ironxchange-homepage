export default function Home() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      
      <section style={{
        height: '80vh',
        background: 'black',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        flexDirection: 'column'
      }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900' }}>
          Free Heavy Equipment Marketplace
        </h1>

        <p style={{ marginTop: '20px', fontSize: '20px' }}>
          No fees. No credit cards. Listings live in minutes.
        </p>

        <div style={{ marginTop: '30px' }}>
          <a href="https://staging.ironxchange.com/l/new">
            <button style={{
              padding: '15px 30px',
              background: '#F98512',
              border: 'none',
              fontWeight: 'bold',
              marginRight: '10px'
            }}>
              Post Equipment Free
            </button>
          </a>

          <a href="https://staging.ironxchange.com/s">
            <button style={{
              padding: '15px 30px',
              background: 'transparent',
              color: 'white',
              border: '1px solid white'
            }}>
              Browse Equipment
            </button>
          </a>
        </div>
      </section>

    </div>
  );
}
