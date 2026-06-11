export function applyIXUpscalePass(canvas, options = {}) {
  const scale = Math.max(1, Number(options.scale || 1));

  if (scale <= 1) return canvas;

  const output = document.createElement("canvas");
  const ctx = output.getContext("2d", { alpha: false });

  output.width = Math.round(canvas.width * scale);
  output.height = Math.round(canvas.height * scale);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    canvas,
    0,
    0,
    output.width,
    output.height
  );

  return output;
}
