export function applyIXExposureRecoverPass(
  ctx,
  width,
  height,
  amount = 0.15
) {
  ctx.save();

  ctx.globalAlpha = amount;

  ctx.filter = `
    brightness(${1 + amount})
  `;

  ctx.drawImage(
    ctx.canvas,
    0,
    0,
    width,
    height
  );

  ctx.restore();
}
