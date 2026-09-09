import Head from "next/head";
import Image from "next/image";

import styles from "./SoftLaunchCover.module.css";

export default function SoftLaunchCover() {
  return (
    <main className={styles.cover}>
      <Head>
        <title>IronXchange</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className={styles.mark}>
        <Image
          src="/images/ironxchange-logo.png"
          width={1807}
          height={396}
          priority
          sizes="(max-width: 560px) 58vw, 280px"
          alt="IronXchange"
        />
        <form className={styles.entry} action="/api/soft-launch-entry" method="post">
          <button type="submit" aria-label="Enter IronXchange">
            <span>Enter IronXchange</span>
          </button>
        </form>
      </div>
    </main>
  );
}
