export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/account/my-listings-v2",
      permanent: false
    }
  };
}

export default function MyListingsRedirect() {
  return null;
}
