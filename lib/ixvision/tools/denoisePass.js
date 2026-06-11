function clamp255(value) {
  return Math.max(0, Math.min(255, value));
}

export function applyIXDenoisePass(ctx, width, height, options = {}) {
  const amount = Math.max(0, Math.min(1, Number(options.amount ?? 0)));

  if (!amount) return;

  let imageData;

  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return;
  }

  const src = imageData.data;
  const out = new Uint8ClampedArray(src);

  const strength = amount * 0.42;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;

      const left = i - 4;
      const right = i + 4;
      const up = i - width * 4;
      const down = i + width * 4;

      const lum =
        0.2126 * src[i] +
        0.7152 * src[i + 1] +
        0.0722 * src[i + 2];

      const neighborLum =
        (
          0.2126 * src[left] +
          0.7152 * src[left + 1] +
          0.0722 * src[left + 2] +
          0.2126 * src[right] +
          0.7152 * src[right + 1] +
          0.0722 * src[right + 2] +
          0.2126 * src[up] +
          0.7152 * src[up + 1] +
          0.0722 * src[up + 2] +
          0.2126 * src[down] +
          0.7152 * src[down + 1] +
          0.0722 * src[down + 2]
        ) / 4;

      const edgeRisk = Math.abs(lum - neighborLum);

      // Smooth flat/noisy areas, protect real machine edges.
      if (edgeRisk > 22) continue;

      for (let c = 0; c < 3; c++) {
        const neighborAvg =
          (src[left + c] + src[right + c] + src[up + c] + src[down + c]) / 4;

        out[i + c] = clamp255(
          src[i + c] * (1 - strength) + neighborAvg * strength
        );
      }
    }
  }

  imageData.data.set(out);
  ctx.putImageData(imageData, 0, 0);
}
