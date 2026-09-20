import { loadIXIListingsEnvironment } from "../listings/IXIListingsEngine";
import { loadIXIOwnedListings } from "../listings/loadIXIOwnedListings";
import { fetchAosEnvironment } from "./ixiMosClient";
import { projectIXIMosEnvironment } from "./IXIMosEnvironmentProjection";
const clean = value => String(value || "").trim();

export async function loadIXIMosEnvironment({
  includeObjects = true,
  onAuthenticatedEnvironment
} = {}) {
  /*
   * Browser identity/private-state and the governed AOS bootstrap are
   * independent reads of the same signed-in session. Start both immediately
   * so first paint pays for the slower boundary once instead of serially.
   */
  const listingEnvironmentRequest =
    loadIXIListingsEnvironment({
      includePrivateState: true,
      includePublicListings: false
    });

  const environmentRequest = fetchAosEnvironment({
    metadata: {
      source: "preview-aos-environment",
      authenticatedThrough: "sharetribe"
    }
  }).then(
    value => ({ value, error: null }),
    error => ({ value: null, error })
  );

  const listingEnvironment = await listingEnvironmentRequest;

  const isAuthenticated =
    Boolean(
      listingEnvironment
        ?.isAuthenticated
    );

  const userId =
    clean(
      listingEnvironment?.userId
    );

  if (
    !isAuthenticated ||
    !userId
  ) {
    return {
      ok: false,
      isAuthenticated: false,
      userId: "",

      ownedListings: [],
      systemIndexes: [],
      objectDefinitions: [],

      account: null,
      principal: null,
      entity: null,

      objects: [],
      relationships: [],
      rootObjects: [],
      projections: {},
      railProjections: {},

      listingEnvironment,

      errors: {
        authentication:
          "Authenticated user required.",

        ownedListings: null,
        objectDefinitions: null
      }
    };
  }


  /*
   * The account-listings response already contains enough presentation data
   * to render the machine cards and perform canonical admission. IXI Media
   * manifests are enrichment and must not gate the AOS environment.
   */
  const ownedListingsRequest = loadIXIOwnedListings(
    userId,
    { hydrateMedia: false }
  ).then(
    value => ({ value, error: null }),
    error => ({ value: [], error })
  );
  const [ownedResult, environmentResult] = await Promise.all([
    ownedListingsRequest,
    environmentRequest
  ]);
  if (environmentResult.error) {
    throw environmentResult.error;
  }

  const response = environmentResult.value;
  const ownedListings = ownedResult.value;
  const ownedListingsError = ownedResult.error;
  if (ownedListingsError) {
    console.error(
      "IXI AOS OWNED LISTINGS LOAD FAILED:",
      ownedListingsError
    );
  }

  return projectIXIMosEnvironment({ response, ownedListings, ownedListingsError,
    listingEnvironment, userId, includeObjects, onAuthenticatedEnvironment });
}


export default loadIXIMosEnvironment;
