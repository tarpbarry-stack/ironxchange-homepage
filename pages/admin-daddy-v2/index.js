import Head from "next/head";
import AdminDaddyApp from "../../components/admin-daddy-v2/AdminDaddyApp";
import AdminDaddyOperationsDeck from "../../components/admin-daddy-v2/AdminDaddyOperationsDeck";

export default function AdminDaddyV2Page() {
  return (
    <>
      <Head>
        <title>Admin Daddy II | IronXchange</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <AdminDaddyApp />
      <AdminDaddyOperationsDeck />
    </>
  );
}
