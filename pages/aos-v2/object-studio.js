import Head
  from "next/head";

import IXIObjectStudio
  from "../../components/ixi-aos/object-studio/IXIObjectStudio";


export default function IXIObjectStudioPage() {
  return (
    <>
      <Head>
        <title>
          Object Studio | IronXchange
        </title>
      </Head>

      <IXIObjectStudio />
    </>
  );
}
