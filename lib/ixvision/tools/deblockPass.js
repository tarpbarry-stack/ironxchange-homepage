function clamp255(value) {
  return Math.max(0, Math.min(255, value));
}

export function applyIXDeblockPass(ctx, width, height, options = {}) {
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

  const strength = amount * 0.34;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;

      const isBlockBoundary = x % 8 === 0 || y % 8 === 0;
      if (!isBlockBoundary) continue;

      const left = i - 4;
      const right = i + 4;
      const up = i - width * 4;
      const down = i + width * 4;

      for (let c = 0; c < 3; c++) {
        const center = src[i + c];

        const neighborAvg =
          (src[left + c] + src[right + c] + src[up + c] + src[down + c]) / 4;

        const diff = Math.abs(center - neighborAvg);

        if (diff > 4 && diff < 38) {
          out[i + c] = clamp255(
            center * (1 - strength) + neighborAvg * strength
          );
        }
      }
    }
  }

  imageData.data.set(out);
  ctx.putImageData(imageData, 0, 0);
}
