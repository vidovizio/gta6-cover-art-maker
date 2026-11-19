const PALETTES = {
  sunset: { base: "#21152d", top: "#f6a05d", bottom: "#ed448e", glow: "#ff9b67" },
  neon: { base: "#101729", top: "#37d5dc", bottom: "#e13aa7", glow: "#60f4f0" },
  noir: { base: "#10121c", top: "#8573ba", bottom: "#b64378", glow: "#bf9aff" },
  gold: { base: "#291d28", top: "#ffca76", bottom: "#e96662", glow: "#ffd17c" },
};

export function panelRects(width, height, count) {
  const margin = Math.min(width, height) * 0.035;
  const gap = Math.min(width, height) * 0.012;
  const x = margin;
  const y = height * 0.105;
  const areaWidth = width - margin * 2;
  const areaHeight = height * 0.84 - gap;
  if (count === 2) {
    const split = areaWidth * 0.57;
    return [
      { x, y, w: split - gap / 2, h: areaHeight },
      { x: x + split + gap / 2, y, w: areaWidth - split - gap / 2, h: areaHeight },
    ];
  }
  if (count === 3) {
    const heroWidth = areaWidth * 0.59;
    const sideWidth = areaWidth - heroWidth - gap;
    const smallHeight = (areaHeight - gap) / 2;
    return [
      { x, y, w: heroWidth, h: areaHeight },
      { x: x + heroWidth + gap, y, w: sideWidth, h: smallHeight },
      { x: x + heroWidth + gap, y: y + smallHeight + gap, w: sideWidth, h: smallHeight },
    ];
  }
  const halfWidth = (areaWidth - gap) / 2;
  const halfHeight = (areaHeight - gap) / 2;
  return [
    { x, y, w: halfWidth, h: halfHeight },
    { x: x + halfWidth + gap, y, w: halfWidth, h: halfHeight },
    { x, y: y + halfHeight + gap, w: halfWidth, h: halfHeight },
    { x: x + halfWidth + gap, y: y + halfHeight + gap, w: halfWidth, h: halfHeight },
  ];
}

function drawPhoto(ctx, rect, panel) {
  const photo = panel?.image;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = "#191426";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  if (photo) {
    const sw = photo.naturalWidth || photo.width;
    const sh = photo.naturalHeight || photo.height;
    if (panel.fit === "fit") {
      const scale = Math.min(rect.w / sw, rect.h / sh);
      const dw = sw * scale * panel.zoom;
      const dh = sh * scale * panel.zoom;
      const dx = rect.x + (rect.w - dw) / 2 + (0.5 - panel.x) * Math.max(0, dw - rect.w);
      const dy = rect.y + (rect.h - dh) / 2 + (0.5 - panel.y) * Math.max(0, dh - rect.h);
      ctx.drawImage(photo, dx, dy, dw, dh);
    } else {
      const ratio = rect.w / rect.h;
      let cropW = Math.min(sw, sh * ratio) / panel.zoom;
      let cropH = cropW / ratio;
      if (cropH > sh) {
        cropH = sh / panel.zoom;
        cropW = cropH * ratio;
      }
      const cx = Math.max(cropW / 2, Math.min(sw - cropW / 2, panel.x * sw));
      const cy = Math.max(cropH / 2, Math.min(sh - cropH / 2, panel.y * sh));
      ctx.drawImage(photo, cx - cropW / 2, cy - cropH / 2, cropW, cropH, rect.x, rect.y, rect.w, rect.h);
    }
  } else {
    const glow = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    glow.addColorStop(0, "#3d3155");
    glow.addColorStop(0.52, "#533753");
    glow.addColorStop(1, "#cf5975");
    ctx.fillStyle = glow;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#ffffff85";
    ctx.font = `700 ${Math.max(12, rect.w * 0.035)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("ADD A PHOTO", rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  const palette = PALETTES[panel.grade] || PALETTES.sunset;
  ctx.globalCompositeOperation = "screen";
  const tint = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  tint.addColorStop(0, `${palette.top}22`);
  tint.addColorStop(0.45, "#fb6b7720");
  tint.addColorStop(1, `${palette.bottom}64`);
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = "multiply";
  const warm = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  warm.addColorStop(0, "#fff0d51e");
  warm.addColorStop(1, `${palette.base}78`);
  ctx.fillStyle = warm;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawGrain(ctx, width, height) {
  let seed = 98431;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.save();
  ctx.globalAlpha = 0.105;
  for (let i = 0; i < Math.round(width * height / 1450); i++) {
    const light = random() > 0.52;
    ctx.fillStyle = light ? "#fff6e3" : "#1a1428";
    const size = random() > 0.96 ? 2 : 1;
    ctx.fillRect(random() * width, random() * height, size, size);
  }
  ctx.restore();
}

function drawMasthead(ctx, width, height, palette) {
  const y = height * 0.061;
  ctx.save();
  ctx.fillStyle = "#fff4e8";
  ctx.font = `700 ${Math.max(10, width * 0.012)}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.letterSpacing = `${Math.max(1, width * 0.002)}px`;
  ctx.fillText("VICE SUNSET", width * 0.047, y);
  ctx.fillStyle = palette.glow;
  ctx.fillRect(width * 0.047, y + height * 0.012, width * 0.12, Math.max(2, height * 0.002));
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff0dfd9";
  ctx.font = `700 ${Math.max(8, width * 0.008)}px system-ui, sans-serif`;
  ctx.fillText("THE CITY AFTER DARK   /   VOL. 06", width * 0.953, y);
  ctx.restore();
}

function drawBadge(ctx, width, height, palette) {
  const cx = width * 0.91;
  const cy = height * 0.195;
  const radius = Math.min(width, height) * 0.062;
  ctx.save();
  ctx.shadowColor = `${palette.glow}9c`;
  ctx.shadowBlur = radius * 0.7;
  ctx.fillStyle = "#1b1429d9";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `${palette.glow}d9`;
  ctx.lineWidth = Math.max(1.5, width * 0.0015);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff2df";
  ctx.font = `700 ${Math.max(7, radius * 0.31)}px system-ui, sans-serif`;
  ctx.fillText("VICE", cx, cy - radius * 0.08);
  ctx.fillStyle = palette.glow;
  ctx.font = `800 ${Math.max(6, radius * 0.2)}px system-ui, sans-serif`;
  ctx.fillText("CITY / 06", cx, cy + radius * 0.3);
  ctx.restore();
}

function fitFont(ctx, text, baseSize, maxWidth) {
  let size = baseSize;
  ctx.font = `400 ${size}px Anton, Impact, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= Math.max(1, size * 0.025);
    ctx.font = `400 ${size}px Anton, Impact, sans-serif`;
  }
  return size;
}

function drawCaption(ctx, width, height, settings, palette) {
  const top = settings.position === "top";
  const gradient = ctx.createLinearGradient(0, top ? 0 : height * 0.57, 0, top ? height * 0.36 : height);
  if (top) {
    gradient.addColorStop(0, "#120f20d9");
    gradient.addColorStop(1, "#19132600");
  } else {
    gradient.addColorStop(0, "#15102100");
    gradient.addColorStop(0.32, "#171021b8");
    gradient.addColorStop(1, "#120d20f2");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, top ? 0 : height * 0.57, width, top ? height * 0.36 : height * 0.43);

  const title = settings.title.trim().toUpperCase();
  const subtitle = settings.subtitle.trim().toUpperCase();
  const titleSize = fitFont(ctx, title, width * settings.typeScale, width * 0.89);
  const titleY = top ? height * 0.238 : height * 0.879;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.font = `400 ${titleSize}px Anton, Impact, sans-serif`;
  if (settings.shadow) {
    ctx.shadowColor = `${palette.glow}cc`;
    ctx.shadowBlur = titleSize * 0.24;
    ctx.shadowOffsetY = titleSize * 0.025;
  }
  if (settings.outline) {
    ctx.lineWidth = Math.max(2, titleSize * 0.035);
    ctx.strokeStyle = "#24152f";
    ctx.strokeText(title, width / 2, titleY, width * 0.9);
  }
  ctx.fillStyle = settings.letterColor;
  if (title) ctx.fillText(title, width / 2, titleY, width * 0.9);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (subtitle) {
    const subSize = Math.max(10, Math.min(width * 0.019, height * 0.026));
    ctx.font = `800 ${subSize}px system-ui, sans-serif`;
    ctx.letterSpacing = `${Math.max(1, subSize * 0.2)}px`;
    ctx.fillStyle = "#ffe4d5";
    ctx.fillText(subtitle, width / 2, top ? height * 0.292 : height * 0.928, width * 0.82);
  }
  const railY = top ? height * 0.322 : height * 0.956;
  ctx.fillStyle = palette.glow;
  ctx.fillRect(width * 0.43, railY, width * 0.14, Math.max(2, height * 0.002));
  ctx.restore();
}

export function drawCover(canvas, panels, settings) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const width = canvas.width;
  const height = canvas.height;
  const palette = PALETTES[settings.grade] || PALETTES.sunset;
  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, width, height);

  const rects = panelRects(width, height, panels.length);
  rects.forEach((rect, index) => drawPhoto(ctx, rect, { ...panels[index], grade: settings.grade }));
  ctx.save();
  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.43, Math.min(width, height) * 0.18, width * 0.5, height * 0.5, Math.max(width, height) * 0.74);
  vignette.addColorStop(0, "#08081700");
  vignette.addColorStop(1, "#09081782");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  if (settings.grain) drawGrain(ctx, width, height);

  drawMasthead(ctx, width, height, palette);
  if (settings.sticker) drawBadge(ctx, width, height, palette);
  drawCaption(ctx, width, height, settings, palette);

  ctx.save();
  ctx.strokeStyle = "#fff0dd9e";
  ctx.lineWidth = Math.max(1, width * 0.0011);
  ctx.strokeRect(width * 0.018, height * 0.018, width * 0.964, height * 0.964);
  ctx.restore();
}
