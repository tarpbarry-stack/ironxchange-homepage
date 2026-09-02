import Head from "next/head";
import AdminDaddyApp from "../../components/admin-daddy-v2/AdminDaddyApp";
import AdminDaddyTaskCenter from "../../components/admin-daddy-v2/AdminDaddyTaskCenter";
import AdminDaddyOperationsDeck from "../../components/admin-daddy-v2/AdminDaddyOperationsDeck";
import AdminDaddyEnterpriseDeck from "../../components/admin-daddy-v2/AdminDaddyEnterpriseDeck";

export default function AdminDaddyV2Page() {
  return (
    <>
      <Head>
        <title>Admin Daddy II | IronXchange</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <AdminDaddyApp />
      <AdminDaddyTaskCenter />
      <AdminDaddyOperationsDeck />
      <AdminDaddyEnterpriseDeck />
    </>
  );
}
