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
          <a href="/browse-v2">Browse Equipment</a>
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
      linear-gradient(180deg, rgba(255,255,255,.026), rgba(255,255,255,0)),
      radial-gradient(circle at top center, rgba(255,196,0,.018), transparent 40%),
      #050505;

    color: white;

    padding: 34px 5% 36px;

    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 54px;

    border-top: 1px solid rgba(255,255,255,.065);

    box-shadow:
      0 1px 0 rgba(255,255,255,.025) inset,
      0 -18px 44px rgba(0,0,0,.22);
  }

  .footer img {
    height: 24px;
    width: auto;
    display: block;

    filter:
      contrast(1.03)
      saturate(1.02);
  }

  .footer p {
    color: rgba(255,255,255,.34);
    font-size: 11px;
    font-weight: 700;
    line-height: 1.45;
    margin: 12px 0 0;
  }

  .foot-cols {
    display: flex;
    gap: 68px;
    align-items: flex-start;
  }

  .foot-cols h4 {
    font-family: Arial, sans-serif;
    font-size: 9.5px;
    font-weight: 950;
    letter-spacing: .72px;
    margin: 0 0 13px;
    color: rgba(255,255,255,.78);
    text-transform: uppercase;
  }

  .foot-cols a {
    display: block;

    color: rgba(255,255,255,.40);
    text-decoration: none;

    margin-bottom: 8px;

    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;

    transition:
      color .14s ease,
      transform .14s ease,
      text-shadow .14s ease;
  }

  .foot-cols a:hover {
    color: #FFC400;
    transform: translateX(2px);
    text-shadow: 0 0 14px rgba(255,196,0,.14);
  }

  @media (max-width: 850px) {
    .footer {
      flex-direction: column;
      gap: 28px;
      padding: 30px 5%;
    }

    .foot-cols {
      width: 100%;
      flex-direction: column;
      gap: 24px;
    }
  }
`}</style>
    </footer>
  );
}
