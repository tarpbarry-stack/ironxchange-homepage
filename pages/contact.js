import Head from "next/head";

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact IronXchange</title>
        <meta name="description" content="Contact IronXchange." />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;800&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <main className="page">
        <a href="/" className="back">← Back to IronXchange</a>

        <section className="card">
          <img src="/images/ironxchange-logo.png" alt="IronXchange" />

          <h1>CONTACT IRONXCHANGE</h1>
          <p>Questions, listing help, partnerships, or advertising inquiries.</p>

          <div className="info">
            <h3>Email</h3>
            <a href="mailto:info@ironxchange.com">info@ironxchange.com</a>

            <h3>Headquarters</h3>
            <p>Irving, Texas</p>
          </div>
        </section>
      </main>

      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background: #050505;
          color: white;
        }

        .page {
          min-height: 100vh;
          padding: 42px 5%;
          background:
            linear-gradient(90deg, rgba(0,0,0,.90), rgba(0,0,0,.72)),
            url('/images/hero-equipment-yard.jpg');
          background-size: cover;
          background-position: center;
        }

        .back {
          color: #FFC400;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          text-decoration: none;
          text-transform: uppercase;
          font-size: 13px;
        }

        .card {
          max-width: 720px;
          margin-top: 80px;
          background: rgba(5,5,5,.88);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 16px;
          padding: 42px;
          box-shadow: 0 20px 60px rgba(0,0,0,.45);
        }

        img {
          height: 70px;
          width: auto;
          margin-bottom: 30px;
        }

        h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 4.5rem;
          line-height: .9;
          margin: 0;
          letter-spacing: 1px;
        }

        p {
          color: #ccc;
          font-size: 1.05rem;
          line-height: 1.6;
        }

        .info {
          margin-top: 34px;
        }

        h3 {
          font-family: 'Montserrat', sans-serif;
          font-size: 13px;
          color: #FFC400;
          text-transform: uppercase;
          margin: 28px 0 8px;
          letter-spacing: .6px;
        }

        .info a {
          color: white;
          font-size: 1.2rem;
          font-weight: 800;
        }

        @media (max-width: 700px) {
          .card {
            padding: 28px;
          }

          h1 {
            font-size: 3.4rem;
          }

          img {
            height: 54px;
          }
        }
      `}</style>
    </>
  );
}
