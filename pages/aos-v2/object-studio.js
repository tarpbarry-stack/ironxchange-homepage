import Head
  from "next/head";

import IXIObjectStudioCommercial
  from "../../components/ixi-aos/object-studio/IXIObjectStudioCommercial";


export default function IXIObjectStudioPage() {
  return (
    <>
      <Head>
        <title>
          Object Studio | IronXchange
        </title>
      </Head>

      <IXIObjectStudioCommercial />
    </>
  );
}
