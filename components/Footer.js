export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <img src="/images/ironxchange-logo.png" alt="IronXchange" />
        <p>© 2026 IronXchange. All rights reserved.</p>
      </div>

      <div className="foot-cols">
        <div>
          <h4>MARKETPLACE</h4>
          <a href="/browse">Browse Equipment</a>
          <a href="/post-free">Post Equipment</a>
        </div>

        <div>
          <h4>COMPANY</h4>
          <a href="/contact">Contact</a>
        </div>

     <div>
  <h4>LEGAL</h4>

  <a href="/privacy">
    Privacy
  </a>

  <a href="/terms">
    Terms
  </a>
</div>
      </div>

      <style jsx>{`
        .footer {
          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #050505;

          color: white;

          padding: 38px 5%;

          display: flex;
          justify-content: space-between;
          gap: 50px;

          border-top: 1px solid rgba(255,255,255,.06);
        }

        .footer img {
          height: 30px;
        }

        .footer p {
          color: rgba(255,255,255,.36);
          font-size: 12px;
          margin-top: 12px;
        }

        .foot-cols {
          display: flex;
          gap: 64px;
        }

        .foot-cols h4 {
          font-family: 'Montserrat', sans-serif;
          font-size: 10.5px;
          font-weight: 900;
          letter-spacing: .65px;
          margin: 0 0 13px;
          color: rgba(255,255,255,.82);
        }

        .foot-cols a {
          display: block;
          color: rgba(255,255,255,.42);
          text-decoration: none;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .foot-cols a:hover {
          color: #FFC400;
        }

        @media (max-width: 850px) {
          .footer {
            flex-direction: column;
          }

          .foot-cols {
            flex-direction: column;
            gap: 25px;
          }
        }
      `}</style>
    </footer>
  );
}
