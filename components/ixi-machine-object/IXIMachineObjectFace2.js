export default function IXIMachineObjectFace2({
  listing
}) {
  return (
    <div className="ixi-machine-object-face2">

      <div className="face2-header">
        SELLER
      </div>

      <div className="face2-seller">
        {listing.sellerName ||
         listing.authorName ||
         "Seller"}
      </div>

      <div className="face2-grid">

        <span>Serial #</span>
        <strong>
          {listing.serialNumber ||
           listing.publicData?.serialNumber ||
           "—"}
        </strong>

        <span>Stock #</span>
        <strong>
          {listing.stockNumber ||
           listing.publicData?.stockNumber ||
           "—"}
        </strong>

        <span>Year</span>
        <strong>
          {listing.year ||
           listing.publicData?.year ||
           "—"}
        </strong>

        <span>Make</span>
        <strong>
          {listing.make || "—"}
        </strong>

        <span>Model</span>
        <strong>
          {listing.model || "—"}
        </strong>

        <span>Hours</span>
        <strong>
          {listing.hours || "—"}
        </strong>

        <span>Price</span>
        <strong>
          {listing.price || "—"}
        </strong>

      </div>

      <div className="face2-description">
        {listing.description ||
         listing.publicData?.description ||
         "No description available."}
      </div>

    </div>
  );
}
