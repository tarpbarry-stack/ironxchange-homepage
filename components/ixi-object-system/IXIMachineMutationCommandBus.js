export const IXI_MACHINE_MUTATION_COMMANDS = {
  async updateMachineFacts({
    listingId,
    title = "",
    price = "",
    hours = "",
    location = "",
    lotNumber = "",
    description = "",
    keywords = []
  }) {
    if (!listingId) {
      return {
        ok: false,
        error: "Missing listingId"
      };
    }

    const response =
      await fetch(
        "/api/update-machine-facts",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              listingId,
              title,
              price,
              hours,
              location,
              lotNumber,
              description,
              keywords
            })
        }
      );

    const data =
      await response
        .json()
        .catch(() => ({}));

    if (
      !response.ok ||
      data?.ok === false
    ) {
      throw new Error(
        data?.error ||
        "Machine facts update failed"
      );
    }

    return data;
  }
};
