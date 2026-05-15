import * as SharetribeSdk from "sharetribe-flex-sdk";

const sdk = SharetribeSdk.createInstance({
  clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
});

export default sdk;
