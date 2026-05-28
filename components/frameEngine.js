export function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;
  if (number < min) return min;
  if (number > max) return max;

  return number;
}

export function getImageAspectRatio(image = {}) {
  const width =
    image.width ||
    image.w ||
    image.metadata?.width ||
    image.attributes?.metadata?.width ||
    null;

  const height =
    image.height ||
    image.h ||
    image.metadata?.height ||
    image.attributes?.metadata?.height ||
    null;

  if (!width || !height) return null;

  return Number(width) / Number(height);
}

export function inferFrameProfile(image = {}, destination = "card") {
  const aspectRatio =
    image.aspectRatio ||
    image.frame?.aspectRatio ||
    getImageAspectRatio(image) ||
    1.33;

  const isWide = aspectRatio >= 1.55;
  const isTall = aspectRatio <= 0.92;
  const isSquareish = aspectRatio > 0.92 && aspectRatio < 1.2;

  const base = {
    focalX: 50,
    focalY: 50,
    objectFit: "cover",
    objectPosition: "50% 50%",
    zoom: 1,
    aspectRatio,
    frameClass: "ix-frame-standard"
  };

  if (destination === "card") {
    if (isWide) {
      return {
        ...base,
        zoom: 1.02,
        focalY: 52,
        objectPosition: "50% 52%",
        frameClass: "ix-frame-wide-card"
      };
    }

    if (isTall) {
      return {
        ...base,
        zoom: 1,
        objectFit: "contain",
        objectPosition: "50% 50%",
        frameClass: "ix-frame-tall-card"
      };
    }

    if (isSquareish) {
      return {
        ...base,
        zoom: 1.04,
        frameClass: "ix-frame-square-card"
      };
    }

    return {
      ...base,
      zoom: 1.018
    };
  }

  if (destination === "slugHero") {
    if (isWide) {
      return {
        ...base,
        zoom: 1,
        focalY: 52,
        objectPosition: "50% 52%",
        frameClass: "ix-frame-wide-hero"
      };
    }

    if (isTall) {
      return {
        ...base,
        zoom: 1,
        objectFit: "contain",
        objectPosition: "50% 50%",
        frameClass: "ix-frame-tall-hero"
      };
    }

    return {
      ...base,
      zoom: 1
    };
  }

  if (destination === "livePreview") {
    return {
      ...inferFrameProfile(image, "card"),
      frameClass: "ix-frame-live-preview"
    };
  }

  if (destination === "lightbox") {
    return {
      ...base,
      objectFit: "contain",
      zoom: 1,
      frameClass: "ix-frame-inspect"
    };
  }

  if (destination === "social") {
    return {
      ...base,
      focalY: isTall ? 50 : 52,
      objectPosition: isTall ? "50% 50%" : "50% 52%",
      zoom: isTall ? 1 : 1.03,
      frameClass: "ix-frame-social"
    };
  }

  return base;
}

export function mergeFrameData(image = {}, destination = "card") {
  const inferred = inferFrameProfile(image, destination);

  const manualFrame =
    image.frame ||
    image.frameData ||
    image.publicData?.frame ||
    image.attributes?.publicData?.frame ||
    {};

  const focalX = clampNumber(
    manualFrame.focalX ?? image.focalX,
    0,
    100,
    inferred.focalX
  );

  const focalY = clampNumber(
    manualFrame.focalY ?? image.focalY,
    0,
    100,
    inferred.focalY
  );

  const zoom = clampNumber(
    manualFrame[`${destination}Zoom`] ??
      manualFrame.zoom ??
      image.zoom,
    0.8,
    1.6,
    inferred.zoom
  );

  const objectFit =
    manualFrame[`${destination}Fit`] ||
    manualFrame.objectFit ||
    inferred.objectFit;

  return {
    ...inferred,
    focalX,
    focalY,
    zoom,
    objectFit,
    objectPosition: `${focalX}% ${focalY}%`
  };
}

export function getFrameStyle(image = {}, destination = "card") {
  const frame = mergeFrameData(image, destination);

  return {
    objectFit: frame.objectFit,
    objectPosition: frame.objectPosition,
    transform: `scale(${frame.zoom})`,
    transformOrigin: frame.objectPosition
  };
}

export function getFrameClass(image = {}, destination = "card") {
  return mergeFrameData(image, destination).frameClass;
}
