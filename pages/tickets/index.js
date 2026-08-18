import Head from "next/head";

import Navbar from "../../components/Navbar";
import IXITicketCommand from "../../components/ixi-tickets/IXITicketCommand";

export default function IXITicketsPage() {
  return (
    <>
      <Head>
        <title>IXI Ticket Command | IronXchange</title>
      </Head>
      <Navbar />
      <IXITicketCommand />
    </>
  );
}
