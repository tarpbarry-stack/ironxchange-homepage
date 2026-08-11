/*
 * =========================================================
 * IXI AOS V2 — FACE DEFINITION ENGINE
 * =========================================================
 *
 * One Face authoring contract.
 *
 * Face 1 is not authored differently from Face 2+.
 *
 * Runtime presentation may differ:
 *
 * Face 1:
 * primary / bounded / Object operating rail
 *
 * Face 2+:
 * application / may scroll / no Object operating rail
 */


export function getIXIAosFaceId(
  face = {},
  fallbackIndex = 1
) {

  return String(
    face?.faceId ||
    face?.id ||
    `face-${fallbackIndex}`
  );
}


export function getIXIAosFaceNumber(
  face = {},
  fallbackIndex = 1
) {

  const value =
    Number(
      face?.faceNumber ||
      face?.face ||
      fallbackIndex
    );


  return Number.isFinite(
    value
  ) &&
  value > 0
    ? value
    : fallbackIndex;
}


export function normalizeIXIAosFaceDefinition(
  face = {},
  fallbackIndex = 1
) {

  const faceNumber =
    getIXIAosFaceNumber(
      face,
      fallbackIndex
    );


  const isPrimary =
    faceNumber ===
    1;


  return {
    ...face,

    faceId:
      getIXIAosFaceId(
        face,
        fallbackIndex
      ),

    faceNumber,

    label:
      String(
        face?.label ||
        face?.name ||
        (
          isPrimary
            ? "PRIMARY"
            : `FACE ${faceNumber}`
        )
      ),

    surfaceRole:
      face?.surfaceRole ||
      (
        isPrimary
          ? "primary"
          : "application"
      ),

    heightBehavior:
      face?.heightBehavior ||
      (
        isPrimary
          ? "bounded"
          : "scroll"
      ),

    modules:
      Array.isArray(
        face?.modules
      )
        ? face.modules
        : []
  };
}


export function getIXIAosFaceDefinitions(
  cardDefinition = {}
) {

  const faces =
    Array.isArray(
      cardDefinition?.faces
    )
      ? cardDefinition.faces
      : [];


  if (
    faces.length ===
    0
  ) {

    return [
      normalizeIXIAosFaceDefinition(
        {},
        1
      )
    ];
  }


  return faces.map(
    (
      face,
      index
    ) =>
      normalizeIXIAosFaceDefinition(
        face,
        index + 1
      )
  );
}


export function getIXIAosFaceDefinition({
  cardDefinition = {},
  faceNumber = 1
} = {}) {

  const faces =
    getIXIAosFaceDefinitions(
      cardDefinition
    );


  return (
    faces.find(
      face =>
        face.faceNumber ===
        Number(
          faceNumber
        )
    ) ||
    faces[0]
  );
}
