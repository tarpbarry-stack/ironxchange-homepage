import Head from "next/head";

export default function IXCorePage() {
  return (
    <>
      <Head>
        <title>IX Core | IronXchange</title>
      </Head>

      <main
        style={{
          maxWidth: "900px",
          margin: "40px auto",
          padding: "0 20px",
          color: "#d6d6d6",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <h1>IX Core Architecture Notes</h1>

        <p>
          Internal architecture record for IronXchange.
        </p>

        <hr />

        <h2>IX Core</h2>

        <p>
          Machine state engine powering Workspace,
          Machine Passports, Stacks, Decks and Pockets.
        </p>

      </main>
    </>
  );
}
