function clamp255(value) {
  return Math.max(0, Math.min(255, value));
}

export function applyIXHaloRepairPass(ctx, width, height, options = {}) {
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

  const strength = amount * 0.38;

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const i = (y * width + x) * 4;

      const left = i - 4;
      const right = i + 4;
      const farLeft = i - 8;
      const farRight = i + 8;
      const up = i - width * 4;
      const down = i + width * 4;

      for (let c = 0; c < 3; c++) {
        const center = src[i + c];

        const nearAvg =
          (src[left + c] + src[right + c] + src[up + c] + src[down + c]) / 4;

        const farAvg =
          (src[farLeft + c] + src[farRight + c]) / 2;

        const nearDiff = Math.abs(center - nearAvg);
        const farDiff = Math.abs(center - farAvg);

        const likelyHalo = nearDiff > 18 && nearDiff < 70 && farDiff < nearDiff;

        if (likelyHalo) {
          out[i + c] = clamp255(
            center * (1 - strength) + nearAvg * strength
          );
        }
      }
    }
  }

  imageData.data.set(out);
  ctx.putImageData(imageData, 0, 0);
}
