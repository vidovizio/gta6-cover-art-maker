const canvas = document.querySelector("#posterCanvas");
const context = canvas.getContext("2d", { alpha: false });
const sizeSelect = document.querySelector("#sizeSelect");
const panelCount = document.querySelector("#panelCount");
const panelControls = document.querySelector("#panelControls");
const titleInput = document.querySelector("#titleInput");
const subtitleInput = document.querySelector("#subtitleInput");
const photoInput = document.querySelector("#photoInput");
const zoomSlider = document.querySelector("#zoomSlider");
const zoomValue = document.querySelector("#zoomValue");
const photoLibrary = document.querySelector("#photoLibrary");
const toast = document.querySelector("#toast");
const sizes = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  landscape: [1920, 1080],
};
const palettes = {
  sunset: { filter: "saturate(1.23) contrast(1.06) sepia(.08)", top: "#f77d91", bottom: "#322b76", accent: "#8ff6df" },
  neon: { filter: "saturate(1.5) contrast(1.12) hue-rotate(-7deg)", top: "#ef47aa", bottom: "#064b82", accent: "#84ffe2" },
  noir: { filter: "grayscale(.52) contrast(1.17)", top: "#a374a4", bottom: "#161d42", accent: "#f5cf9e" },
};
const state = {
  photos: [],
  selectedPhotoId: "",
  panels: [],
  selectedPanel: 0,
  panelRects: [],
  position: "low",
  preset: "sunset",
  textColor: "#fff5df",
  fontScale: 1.1,
  outline: true,
  shadow: true,
  grain: true,
  glow: true,
  seal: true,
  dragging: null,
};
const grainCanvas = makeGrain();
let toastTimer;

function makeGrain() {
  const grain = document.createElement("canvas");
  grain.width = 180;
  grain.height = 180;
  const grainContext = grain.getContext("2d");
  const pixels = grainContext.createImageData(grain.width, grain.height);
  let seed = 90731;
  for (let index = 0; index < pixels.data.length; index += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const value = seed >>> 24;
    pixels.data[index] = value;
    pixels.data[index + 1] = value;
    pixels.data[index + 2] = value;
    pixels.data[index + 3] = 50;
  }
  grainContext.putImageData(pixels, 0, 0);
  return grain;
}

function announce(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2300);
}

function findPhoto(photoId) {
  return state.photos.find((photo) => photo.id === photoId);
}

function currentPanel() {
  return state.panels[state.selectedPanel];
}

function setPanelCount(count) {
  const next = Number(count);
  while (state.panels.length < next) {
    state.panels.push({ photoId: state.selectedPhotoId, zoom: 1, panX: 0, panY: 0, fit: "cover" });
  }
  state.panels.length = next;
  state.selectedPanel = Math.min(state.selectedPanel, next - 1);
  renderPanelControls();
  syncZoomControl();
  renderPoster();
}

function addPhoto(id, name, image, url) {
  const photo = { id, name, image, url };
  state.photos.push(photo);
  state.selectedPhotoId = id;
  if (state.panels.length === 0) state.panels = Array.from({ length: Number(panelCount.value) }, () => newPanel(id));
  else currentPanel().photoId = id;
  renderPhotoLibrary();
  renderPanelControls();
  renderPoster();
  return photo;
}

function newPanel(photoId) {
  return { photoId, zoom: 1, panX: 0, panY: 0, fit: "cover" };
}

function renderPhotoLibrary() {
  photoLibrary.replaceChildren();
  for (const photo of state.photos.filter((item) => item.id.startsWith("upload-"))) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `photo-chip${photo.id === state.selectedPhotoId ? " active" : ""}`;
    chip.textContent = photo.name;
    chip.title = `Use ${photo.name} in the selected panel`;
    chip.addEventListener("click", () => {
      state.selectedPhotoId = photo.id;
      currentPanel().photoId = photo.id;
      renderPhotoLibrary();
      renderPanelControls();
      renderPoster();
    });
    photoLibrary.append(chip);
  }
}

function renderPanelControls() {
  panelControls.replaceChildren();
  state.panels.forEach((panel, index) => {
    const row = document.createElement("div");
    row.className = "panel-row";
    const pick = document.createElement("button");
    pick.type = "button";
    pick.className = `panel-pick${index === state.selectedPanel ? " selected" : ""}`;
    pick.textContent = `PANEL ${String(index + 1).padStart(2, "0")}`;
    pick.addEventListener("click", () => {
      state.selectedPanel = index;
      syncZoomControl();
      renderPanelControls();
    });
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Photo for panel ${index + 1}`);
    for (const photo of state.photos) {
      const option = document.createElement("option");
      option.value = photo.id;
      option.textContent = photo.name;
      option.selected = photo.id === panel.photoId;
      select.append(option);
    }
    select.addEventListener("change", () => {
      panel.photoId = select.value;
      state.selectedPanel = index;
      state.selectedPhotoId = select.value;
      renderPhotoLibrary();
      renderPanelControls();
      renderPoster();
    });
    const fit = document.createElement("button");
    fit.type = "button";
    fit.className = "fit-button";
    fit.textContent = panel.fit === "cover" ? "COVER" : "FIT";
    fit.title = "Toggle cover crop / fit whole photo";
    fit.addEventListener("click", () => {
      panel.fit = panel.fit === "cover" ? "contain" : "cover";
      if (panel.fit === "contain") {
        panel.panX = 0;
        panel.panY = 0;
      }
      renderPanelControls();
      renderPoster();
    });
    row.append(pick, select, fit);
    panelControls.append(row);
  });
}

function syncZoomControl() {
  const panel = currentPanel();
  zoomSlider.value = String(panel?.zoom ?? 1);
  zoomValue.value = `${Number(zoomSlider.value).toFixed(1)}×`;
}

function layoutFor(width, height, count) {
  const vertical = height / width > 1.12;
  if (vertical) {
    if (count === 2) return [{ x: 0, y: 0, w: 1, h: .59 }, { x: 0, y: .61, w: 1, h: .39 }];
    if (count === 3) return [{ x: 0, y: 0, w: 1, h: .55 }, { x: 0, y: .57, w: .49, h: .43 }, { x: .51, y: .57, w: .49, h: .43 }];
    return [{ x: 0, y: 0, w: .59, h: .49 }, { x: .61, y: 0, w: .39, h: .49 }, { x: 0, y: .51, w: .49, h: .49 }, { x: .51, y: .51, w: .49, h: .49 }];
  }
  if (width / height > 1.45) {
    if (count === 2) return [{ x: 0, y: 0, w: .57, h: 1 }, { x: .59, y: 0, w: .41, h: 1 }];
    if (count === 3) return [{ x: 0, y: 0, w: .55, h: 1 }, { x: .57, y: 0, w: .43, h: .49 }, { x: .57, y: .51, w: .43, h: .49 }];
    return [{ x: 0, y: 0, w: .46, h: .54 }, { x: .48, y: 0, w: .52, h: .54 }, { x: 0, y: .56, w: .58, h: .44 }, { x: .6, y: .56, w: .4, h: .44 }];
  }
  if (count === 2) return [{ x: 0, y: 0, w: .51, h: 1 }, { x: .53, y: 0, w: .47, h: 1 }];
  if (count === 3) return [{ x: 0, y: 0, w: .56, h: .66 }, { x: .58, y: 0, w: .42, h: .46 }, { x: .58, y: .48, w: .42, h: .52 }];
  return [{ x: 0, y: 0, w: .49, h: .49 }, { x: .51, y: 0, w: .49, h: .49 }, { x: 0, y: .51, w: .49, h: .49 }, { x: .51, y: .51, w: .49, h: .49 }];
}

function drawPhoto(panel, rect) {
  const photo = findPhoto(panel.photoId) ?? findPhoto(state.selectedPhotoId);
  context.save();
  context.beginPath();
  context.rect(rect.x, rect.y, rect.width, rect.height);
  context.clip();
  context.fillStyle = "#191725";
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  if (photo) {
    const image = photo.image;
    const fitScale = panel.fit === "contain"
      ? Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight)
      : Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    const scale = fitScale * panel.zoom;
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    const x = rect.x + (rect.width - drawnWidth) / 2 + panel.panX * (rect.width - drawnWidth) / 2;
    const y = rect.y + (rect.height - drawnHeight) / 2 + panel.panY * (rect.height - drawnHeight) / 2;
    context.filter = palettes[state.preset].filter;
    context.drawImage(image, x, y, drawnWidth, drawnHeight);
    context.filter = "none";
  }
  context.restore();
}

function drawPanelTint(rect) {
  const palette = palettes[state.preset];
  const tint = context.createLinearGradient(rect.x, rect.y, rect.x + rect.width * .7, rect.y + rect.height);
  tint.addColorStop(0, `${palette.top}45`);
  tint.addColorStop(.52, "#3d3a7720");
  tint.addColorStop(1, `${palette.bottom}64`);
  context.fillStyle = tint;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  if (state.glow) {
    const glow = context.createRadialGradient(rect.x + rect.width * .13, rect.y + rect.height * .08, 0, rect.x + rect.width * .13, rect.y + rect.height * .08, Math.max(rect.width, rect.height) * .8);
    glow.addColorStop(0, "#ffbb8c31");
    glow.addColorStop(1, "#ffbb8c00");
    context.fillStyle = glow;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
}

function drawPanelLabel(rect, index, width) {
  const size = Math.max(12, width * .011);
  context.save();
  context.font = `700 ${size}px Arial, sans-serif`;
  context.textBaseline = "top";
  context.fillStyle = "#fff4dfd9";
  context.fillText(`0${index + 1}`, rect.x + size, rect.y + size * .7);
  context.fillStyle = palettes[state.preset].accent;
  context.fillRect(rect.x + size * 2.45, rect.y + size * 1.27, size * 1.2, Math.max(2, size * .1));
  context.restore();
}

function fitHeadline(text, maxWidth, initialSize) {
  let size = initialSize;
  context.font = `${size}px Anton, Impact, sans-serif`;
  while (context.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    context.font = `${size}px Anton, Impact, sans-serif`;
  }
  return size;
}

function drawSeal(width, height, margin) {
  if (!state.seal) return;
  const radius = Math.max(30, Math.min(width, height) * .052);
  const x = width - margin - radius;
  const y = margin + radius;
  context.save();
  context.translate(x, y);
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fillStyle = "#141923c9";
  context.fill();
  context.lineWidth = Math.max(2, radius * .045);
  context.strokeStyle = "#fff0d2cc";
  context.stroke();
  context.beginPath();
  context.arc(0, 0, radius * .81, 0, Math.PI * 2);
  context.strokeStyle = `${palettes[state.preset].accent}bb`;
  context.lineWidth = Math.max(1, radius * .025);
  context.stroke();
  context.fillStyle = "#fff3de";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `bold ${radius * .25}px Arial, sans-serif`;
  context.fillText("NIGHT", 0, -radius * .2);
  context.font = `bold ${radius * .17}px Arial, sans-serif`;
  context.fillStyle = palettes[state.preset].accent;
  context.fillText("SHIFT", 0, radius * .2);
  context.font = `bold ${radius * .13}px Arial, sans-serif`;
  context.fillStyle = "#fff3de";
  context.fillText("EDITION  •  01", 0, radius * .51);
  context.restore();
}

function drawCaption(width, height, margin) {
  const title = titleInput.value.trim() || "UNTITLED";
  const subtitle = subtitleInput.value.trim();
  const minSide = Math.min(width, height);
  const band = context.createLinearGradient(0, height * .47, 0, height);
  band.addColorStop(0, "#0b102600");
  band.addColorStop(.42, "#0b102965");
  band.addColorStop(1, "#090d1bf0");
  context.fillStyle = band;
  context.fillRect(margin, height * .43, width - margin * 2, height - margin);

  const titleSize = fitHeadline(title.toUpperCase(), width * .85, minSide * .137 * state.fontScale);
  const titleY = state.position === "high" ? height * .31 : state.position === "center" ? height * .61 : height * .82;
  const left = margin * 1.65;
  context.save();
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = `${titleSize}px Anton, Impact, sans-serif`;
  context.lineJoin = "round";
  context.lineWidth = Math.max(4, titleSize * .075);
  context.strokeStyle = "#10121dcc";
  if (state.shadow) {
    context.shadowColor = "#080917";
    context.shadowBlur = minSide * .018;
    context.shadowOffsetX = minSide * .006;
    context.shadowOffsetY = minSide * .009;
    context.fillStyle = "#080917";
    context.fillText(title.toUpperCase(), left, titleY, width * .86);
  }
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  if (state.outline) context.strokeText(title.toUpperCase(), left, titleY, width * .86);
  context.fillStyle = palettes[state.preset].accent;
  context.fillText(title.toUpperCase(), left + minSide * .004, titleY - minSide * .004, width * .86);
  context.fillStyle = state.textColor;
  context.fillText(title.toUpperCase(), left, titleY, width * .86);
  context.restore();

  const subY = titleY + minSide * .047;
  context.save();
  context.textBaseline = "top";
  context.textAlign = "left";
  context.font = `700 ${Math.max(12, minSide * .018)}px Arial, sans-serif`;
  context.letterSpacing = `${Math.max(1, minSide * .003)}px`;
  context.fillStyle = "#fff4df";
  if (subtitle) context.fillText(subtitle.toUpperCase(), left + 2, subY);
  context.restore();

  const ruleY = Math.min(height - margin * 1.42, titleY + minSide * .105);
  context.fillStyle = palettes[state.preset].accent;
  context.fillRect(left, ruleY, minSide * .12, Math.max(3, minSide * .004));
  context.fillStyle = "#fff0dbbb";
  context.font = `700 ${Math.max(10, minSide * .011)}px Arial, sans-serif`;
  context.textBaseline = "middle";
  context.fillText("VICE SUNSET  /  CITY STORIES", left + minSide * .15, ruleY + minSide * .002);
  context.textAlign = "right";
  context.fillStyle = "#fff0dbbb";
  context.fillText("26° 07' N   /   80° 08' W", width - margin * 1.7, ruleY + minSide * .002);
  context.textAlign = "left";
}

function drawFrame(width, height, margin) {
  const thickness = Math.max(2, Math.round(Math.min(width, height) * .006));
  context.save();
  context.strokeStyle = "#f3d9bdc9";
  context.lineWidth = thickness;
  context.strokeRect(margin * .54, margin * .54, width - margin * 1.08, height - margin * 1.08);
  context.strokeStyle = `${palettes[state.preset].accent}b8`;
  context.lineWidth = Math.max(1, thickness * .32);
  context.strokeRect(margin * .86, margin * .86, width - margin * 1.72, height - margin * 1.72);
  context.restore();
}

function renderPoster() {
  const [width, height] = sizes[sizeSelect.value] ?? sizes.square;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    document.querySelector("#canvasSize").textContent = `${width} × ${height}`;
  }
  const margin = Math.round(Math.min(width, height) * .035);
  const gutter = Math.round(Math.min(width, height) * .014);
  context.fillStyle = "#11121b";
  context.fillRect(0, 0, width, height);
  const composition = { x: margin, y: margin, width: width - margin * 2, height: height - margin * 2 };
  const layout = layoutFor(width, height, state.panels.length);
  state.panelRects = layout.map((cell, index) => {
    const rect = {
      x: composition.x + cell.x * composition.width + gutter / 2,
      y: composition.y + cell.y * composition.height + gutter / 2,
      width: cell.w * composition.width - gutter,
      height: cell.h * composition.height - gutter,
    };
    drawPhoto(state.panels[index], rect);
    drawPanelTint(rect);
    drawPanelLabel(rect, index, width);
    return rect;
  });
  drawSeal(width, height, margin * 1.7);
  drawCaption(width, height, margin);

  const vignette = context.createRadialGradient(width * .5, height * .42, Math.min(width, height) * .16, width * .5, height * .5, Math.max(width, height) * .72);
  vignette.addColorStop(0, "#090a1800");
  vignette.addColorStop(1, "#0809167a");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
  if (state.grain) {
    context.save();
    context.globalAlpha = .15;
    context.globalCompositeOperation = "soft-light";
    context.drawImage(grainCanvas, 0, 0, width, height);
    context.restore();
  }
  drawFrame(width, height, margin);
}

function setSelectedPreset(name) {
  state.preset = name;
  for (const button of document.querySelectorAll(".preset")) {
    button.classList.toggle("active", button.dataset.preset === name);
  }
  renderPoster();
}

function toggle(button, property) {
  state[property] = !state[property];
  button.classList.toggle("on", state[property]);
  button.setAttribute("aria-pressed", String(state[property]));
  renderPoster();
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be opened."));
    image.src = source;
  });
}

async function loadSample(name, assignAll = false) {
  const path = `./samples/${name}.jpg`;
  const image = await loadImage(path);
  const existing = findPhoto(name);
  if (existing) {
    state.selectedPhotoId = name;
    currentPanel().photoId = name;
  } else {
    addPhoto(name, name === "pier" ? "The Pier" : "Boulevard", image, "");
  }
  if (assignAll) state.panels.forEach((panel) => { panel.photoId = name; });
  renderPhotoLibrary();
  renderPanelControls();
  renderPoster();
}

function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      announce(`${file.name}: choose an image file.`);
      continue;
    }
    const url = URL.createObjectURL(file);
    loadImage(url).then((image) => {
      const id = `upload-${crypto.randomUUID()}`;
      const name = file.name.length > 15 ? `${file.name.slice(0, 12)}…` : file.name;
      addPhoto(id, name, image, url);
      announce(`${file.name} is ready on this device.`);
    }).catch((error) => {
      URL.revokeObjectURL(url);
      announce(error.message);
    });
  }
}

function pointerOnCanvas(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * canvas.width / bounds.width,
    y: (event.clientY - bounds.top) * canvas.height / bounds.height,
  };
}

canvas.addEventListener("pointerdown", (event) => {
  const point = pointerOnCanvas(event);
  const index = state.panelRects.findIndex((rect) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height);
  if (index < 0) return;
  state.selectedPanel = index;
  const panel = currentPanel();
  state.dragging = { pointerId: event.pointerId, x: point.x, y: point.y, panX: panel.panX, panY: panel.panY, index };
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("dragging");
  syncZoomControl();
  renderPanelControls();
});
canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging || state.dragging.pointerId !== event.pointerId) return;
  const drag = state.dragging;
  const panel = state.panels[drag.index];
  const rect = state.panelRects[drag.index];
  const image = findPhoto(panel.photoId)?.image;
  if (!image || panel.fit === "contain") return;
  const fitScale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight) * panel.zoom;
  const overflowX = Math.max(1, image.naturalWidth * fitScale - rect.width);
  const overflowY = Math.max(1, image.naturalHeight * fitScale - rect.height);
  const point = pointerOnCanvas(event);
  panel.panX = Math.max(-1, Math.min(1, drag.panX + (point.x - drag.x) * 2 / overflowX));
  panel.panY = Math.max(-1, Math.min(1, drag.panY + (point.y - drag.y) * 2 / overflowY));
  renderPoster();
});
function endDrag() {
  state.dragging = null;
  canvas.classList.remove("dragging");
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".sample-card").forEach((card) => card.classList.toggle("active", card === button));
    loadSample(button.dataset.sample).catch((error) => announce(error.message));
  });
});
document.querySelector("#fillAllButton")?.addEventListener("click", () => {
  state.panels.forEach((panel) => {
    panel.photoId = state.selectedPhotoId;
    panel.zoom = 1;
    panel.panX = 0;
    panel.panY = 0;
  });
  renderPanelControls();
  renderPoster();
});
photoInput.addEventListener("change", () => {
  addFiles(Array.from(photoInput.files ?? []));
  photoInput.value = "";
});
document.querySelector(".upload-button").addEventListener("dragover", (event) => {
  event.preventDefault();
  event.currentTarget.classList.add("drop-ready");
});
document.querySelector(".upload-button").addEventListener("dragleave", (event) => event.currentTarget.classList.remove("drop-ready"));
document.querySelector(".upload-button").addEventListener("drop", (event) => {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.remove("drop-ready");
  addFiles(Array.from(event.dataTransfer?.files ?? []));
});
document.addEventListener("dragover", (event) => {
  if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
});
document.addEventListener("drop", (event) => {
  if (event.dataTransfer?.files.length) {
    event.preventDefault();
    addFiles(Array.from(event.dataTransfer.files));
  }
});

sizeSelect.addEventListener("change", renderPoster);
panelCount.addEventListener("change", () => setPanelCount(panelCount.value));
zoomSlider.addEventListener("input", () => {
  currentPanel().zoom = Number(zoomSlider.value);
  zoomValue.value = `${currentPanel().zoom.toFixed(1)}×`;
  renderPoster();
});
titleInput.addEventListener("input", renderPoster);
subtitleInput.addEventListener("input", renderPoster);
document.querySelector("#textColor").addEventListener("input", (event) => {
  state.textColor = event.target.value;
  const labels = { "#fff5df": "WARM IVORY", "#ffffff": "PAPER WHITE", "#84ffe2": "LAGOON MINT", "#ff8fc4": "HOT PINK" };
  document.querySelector("#colorName").textContent = labels[state.textColor.toLowerCase()] ?? "CUSTOM INK";
  renderPoster();
});
document.querySelector("#fontSize").addEventListener("input", (event) => {
  state.fontScale = Number(event.target.value) / 10;
  renderPoster();
});
document.querySelectorAll("[data-position]").forEach((button) => button.addEventListener("click", () => {
  state.position = button.dataset.position;
  document.querySelectorAll("[data-position]").forEach((item) => item.classList.toggle("selected", item === button));
  renderPoster();
}));
document.querySelector("#outlineToggle").addEventListener("click", (event) => {
  state.outline = !state.outline;
  event.currentTarget.classList.toggle("on", state.outline);
  event.currentTarget.setAttribute("aria-pressed", String(state.outline));
  renderPoster();
});
document.querySelector("#shadowToggle").addEventListener("click", (event) => {
  state.shadow = !state.shadow;
  event.currentTarget.classList.toggle("on", state.shadow);
  event.currentTarget.setAttribute("aria-pressed", String(state.shadow));
  renderPoster();
});
document.querySelectorAll(".preset").forEach((button) => button.addEventListener("click", () => setSelectedPreset(button.dataset.preset)));
document.querySelector("#grainToggle").addEventListener("click", (event) => toggle(event.currentTarget, "grain"));
document.querySelector("#glowToggle").addEventListener("click", (event) => toggle(event.currentTarget, "glow"));
document.querySelector("#sealToggle").addEventListener("click", (event) => toggle(event.currentTarget, "seal"));

document.querySelector("#exportButton").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      announce("PNG export failed. Try again after the preview settles.");
      return;
    }
    const link = document.createElement("a");
    const title = (titleInput.value.trim() || "vice-sunset-cover").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    link.download = `${title || "vice-sunset-cover"}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    announce(`Your ${canvas.width} × ${canvas.height} PNG is ready.`);
  }, "image/png");
});
document.querySelector("#shuffleButton").addEventListener("click", () => {
  const presets = ["sunset", "neon", "noir"];
  setSelectedPreset(presets[Math.floor(Math.random() * presets.length)]);
  state.panels.forEach((panel, index) => {
    panel.zoom = 1 + Math.random() * .38;
    panel.panX = (Math.random() - .5) * .4;
    panel.panY = (Math.random() - .5) * .4;
    if (state.photos.length > 1 && Math.random() > .5) panel.photoId = state.photos[(index + Math.floor(Math.random() * state.photos.length)) % state.photos.length].id;
  });
  syncZoomControl();
  renderPanelControls();
  renderPoster();
});
document.querySelector("#resetButton").addEventListener("click", () => {
  state.position = "low";
  state.preset = "sunset";
  state.textColor = "#fff5df";
  state.fontScale = 1.1;
  state.outline = true;
  state.shadow = true;
  state.grain = true;
  state.glow = true;
  state.seal = true;
  state.panels.forEach((panel) => Object.assign(panel, { zoom: 1, panX: 0, panY: 0, fit: "cover", photoId: state.selectedPhotoId }));
  document.querySelector("#fontSize").value = "11";
  document.querySelector("#textColor").value = "#fff5df";
  document.querySelector("#colorName").textContent = "WARM IVORY";
  for (const id of ["outlineToggle", "shadowToggle"]) {
    const button = document.querySelector(`#${id}`);
    button.classList.add("on");
    button.setAttribute("aria-pressed", "true");
  }
  for (const id of ["grainToggle", "glowToggle", "sealToggle"]) {
    const button = document.querySelector(`#${id}`);
    button.classList.add("on");
    button.setAttribute("aria-pressed", "true");
  }
  document.querySelectorAll("[data-position]").forEach((button) => button.classList.toggle("selected", button.dataset.position === "low"));
  setSelectedPreset("sunset");
  syncZoomControl();
  renderPanelControls();
  renderPoster();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.tagName !== "INPUT" && event.target.tagName !== "SELECT") {
    event.preventDefault();
    document.querySelector("#exportButton").click();
  }
});

async function setupShot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get("shot");
  const photo = params.get("photo") === "pier" ? "pier" : "boulevard";
  const caption = params.get("caption");
  if (shot) {
    titleInput.value = caption || "SUNSET HEIST";
    subtitleInput.value = photo === "pier" ? "THE NIGHT IS OURS" : "NEVER MISS THE LAST LIGHT";
    panelCount.value = "3";
    setPanelCount(3);
    await loadSample(photo, true);
  } else {
    await loadSample("boulevard", true);
  }
  if (shot === "cover") {
    document.body.classList.add("cover-shot");
    const key = caption?.toLowerCase();
    sizeSelect.value = key === "boulevard queen" ? "portrait" : key === "neon nights" ? "square" : "landscape";
    state.position = key === "boulevard queen" ? "center" : "low";
    if (key === "neon nights") state.preset = "neon";
  } else if (shot === "editor") {
    document.body.classList.add("editor-shot");
    sizeSelect.value = "landscape";
    state.position = "low";
  }
  if (state.position !== "low") {
    document.querySelectorAll("[data-position]").forEach((button) => button.classList.toggle("selected", button.dataset.position === state.position));
  }
  if (state.preset !== "sunset") {
    document.querySelectorAll(".preset").forEach((button) => button.classList.toggle("active", button.dataset.preset === state.preset));
  }
  await document.fonts.ready;
  renderPoster();
  requestAnimationFrame(() => { window.__shotReady = true; });
}

panelCount.value = "3";
setPanelCount(3);
setupShot().catch((error) => {
  announce(`Could not prepare the preview: ${error.message}`);
  window.__shotReady = true;
});
