export function applyIXDehazePass(ctx, width, height, amount = 0.15) {
  ctx.save();

  ctx.globalAlpha = amount;

  ctx.filter = `
    contrast(${1 + amount * 0.8})
    saturate(${1 + amount * 0.35})
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
