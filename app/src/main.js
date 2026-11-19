import { drawCover, panelRects } from "./render.js";

const canvas = document.querySelector("#cover");
const ctx = canvas.getContext("2d");
const picker = document.querySelector("#photo-files");
const panelPicker = document.querySelector("#panel-picker");
const preview = document.querySelector("#drop-zone");
const status = document.querySelector("#status");
const samples = new Map();
const formats = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  landscape: { width: 1920, height: 1080 },
};

let panels = Array.from({ length: 3 }, () => ({
  image: null, name: "Empty frame", x: 0.5, y: 0.5, zoom: 1, fit: "cover",
}));
let selected = 0;
let paintQueued = false;
let activeDrag = null;
let shotMode = false;

const byId = (id) => document.getElementById(id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function readSettings() {
  return {
    title: byId("title").value,
    subtitle: byId("subtitle").value,
    letterColor: byId("letter-color").value,
    position: byId("caption-position").value,
    typeScale: Number(byId("type-size").value) / 100,
    outline: byId("outline").checked,
    shadow: byId("shadow").checked,
    sticker: byId("sticker").checked,
    grain: byId("grain").checked,
    grade: byId("grade").value,
  };
}

function render() {
  drawCover(canvas, panels, readSettings());
}

function requestRender() {
  if (paintQueued) return;
  paintQueued = true;
  requestAnimationFrame(() => {
    paintQueued = false;
    render();
  });
}

function setFormat(value) {
  const { width, height } = formats[value] || formats.square;
  canvas.width = width;
  canvas.height = height;
  byId("dimension-label").textContent = `${width} × ${height}`;
  requestRender();
}

function updatePanelControls() {
  const panel = panels[selected];
  byId("selected-panel").textContent = `Panel ${selected + 1}`;
  byId("zoom").value = String(Math.round(panel.zoom * 100));
  byId("zoom-value").value = `${Math.round(panel.zoom * 100)}%`;
  byId("image-fit").value = panel.fit;
  [...panelPicker.children].forEach((button, index) => {
    button.setAttribute("aria-pressed", String(index === selected));
    button.textContent = `Frame ${index + 1}${panels[index].image ? " · photo" : ""}`;
  });
}

function setPanelCount(count) {
  while (panels.length < count) {
    const previous = panels[panels.length - 1];
    panels.push({ ...previous, x: 0.5, y: 0.5, zoom: 1 });
  }
  panels = panels.slice(0, count);
  selected = Math.min(selected, count - 1);
  panelPicker.replaceChildren();
  panels.forEach((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "panel-chip";
    button.addEventListener("click", () => {
      selected = index;
      updatePanelControls();
    });
    panelPicker.append(button);
  });
  updatePanelControls();
  requestRender();
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be opened. Try a JPG, PNG, or WEBP photo."));
    image.src = source;
  });
}

async function getSample(name) {
  if (!["pier", "boulevard"].includes(name)) throw new Error("That sample photo is not available.");
  if (!samples.has(name)) {
    samples.set(name, loadImage(`./samples/${name}.jpg`).then((image) => ({ image, name })));
  }
  return samples.get(name);
}

function placeImage(photo, index = selected) {
  panels[index] = {
    ...panels[index],
    image: photo.image,
    name: photo.name,
    x: 0.5,
    y: 0.5,
    zoom: 1,
  };
  updatePanelControls();
  requestRender();
}

async function useSample(name) {
  try {
    const photo = await getSample(name);
    placeImage(photo);
    byId("photo-count").textContent = `${photo.name} is in frame ${selected + 1}. Pick another frame to build a mix.`;
    status.textContent = `Added ${photo.name} to frame ${selected + 1}.`;
  } catch (error) {
    status.textContent = error.message;
  }
}

async function addFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    status.textContent = "Choose an image file to add it to your cover.";
    return;
  }
  try {
    for (const [offset, file] of files.entries()) {
      const image = await loadImage(URL.createObjectURL(file));
      const target = (selected + offset) % panels.length;
      placeImage({ image, name: file.name }, target);
    }
    const active = (selected + files.length - 1) % panels.length;
    selected = active;
    updatePanelControls();
    byId("photo-count").textContent = `${files.length} photo${files.length === 1 ? "" : "s"} added from your device.`;
    status.textContent = `Added ${files.length} photo${files.length === 1 ? "" : "s"} to your poster.`;
  } catch (error) {
    status.textContent = error.message;
  }
  picker.value = "";
}

function applyShotFormat() {
  const ratio = window.innerWidth / Math.max(1, window.innerHeight);
  const choice = Object.entries(formats).reduce((best, item) => {
    const distance = Math.abs(Math.log((item[1].width / item[1].height) / ratio));
    return distance < best.distance ? { name: item[0], distance } : best;
  }, { name: "square", distance: Infinity }).name;
  byId("format").value = choice;
  setFormat(choice);
}

function applyPointerToPanel(event, start = false) {
  const bounds = canvas.getBoundingClientRect();
  const px = (event.clientX - bounds.left) * canvas.width / bounds.width;
  const py = (event.clientY - bounds.top) * canvas.height / bounds.height;
  const rects = panelRects(canvas.width, canvas.height, panels.length);
  const index = rects.findIndex((rect) => px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h);
  if (start && index !== -1) {
    selected = index;
    updatePanelControls();
    activeDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, index };
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
    return;
  }
  if (activeDrag && activeDrag.pointerId === event.pointerId) {
    const panel = panels[activeDrag.index];
    const rect = rects[activeDrag.index];
    const dx = (event.clientX - activeDrag.x) * canvas.width / bounds.width;
    const dy = (event.clientY - activeDrag.y) * canvas.height / bounds.height;
    panel.x = clamp(panel.x - dx / rect.w / Math.max(1, panel.zoom) * 0.75, 0, 1);
    panel.y = clamp(panel.y - dy / rect.h / Math.max(1, panel.zoom) * 0.75, 0, 1);
    activeDrag.x = event.clientX;
    activeDrag.y = event.clientY;
    requestRender();
  }
}

for (const id of ["title", "subtitle", "letter-color", "caption-position", "type-size", "outline", "shadow", "sticker", "grain", "grade"]) {
  byId(id).addEventListener("input", () => {
    if (id === "letter-color") byId("color-label").textContent = byId(id).value.toUpperCase();
    if (id === "type-size") byId("size-value").value = `${byId(id).value}%`;
    requestRender();
  });
  byId(id).addEventListener("change", requestRender);
}
byId("format").addEventListener("change", (event) => setFormat(event.target.value));
byId("panel-count").addEventListener("change", (event) => setPanelCount(Number(event.target.value)));
byId("zoom").addEventListener("input", (event) => {
  panels[selected].zoom = Number(event.target.value) / 100;
  byId("zoom-value").value = `${event.target.value}%`;
  requestRender();
});
byId("image-fit").addEventListener("change", (event) => {
  panels[selected].fit = event.target.value;
  requestRender();
});
picker.addEventListener("change", () => addFiles(picker.files));
document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => useSample(button.dataset.sample));
});

canvas.addEventListener("pointerdown", (event) => applyPointerToPanel(event, true));
canvas.addEventListener("pointermove", (event) => applyPointerToPanel(event));
canvas.addEventListener("pointerup", () => { activeDrag = null; });
canvas.addEventListener("pointercancel", () => { activeDrag = null; });

preview.addEventListener("dragover", (event) => {
  event.preventDefault();
  preview.classList.add("drag-over");
});
preview.addEventListener("dragleave", (event) => {
  if (!preview.contains(event.relatedTarget)) preview.classList.remove("drag-over");
});
preview.addEventListener("drop", async (event) => {
  event.preventDefault();
  preview.classList.remove("drag-over");
  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
  const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
  const target = panelRects(canvas.width, canvas.height, panels.length)
    .findIndex((rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
  if (target !== -1) selected = target;
  updatePanelControls();
  await addFiles(event.dataTransfer.files);
});

byId("export").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = "The PNG could not be created. Try again after the preview finishes drawing.";
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vice-sunset-${canvas.width}x${canvas.height}.png`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    status.textContent = `Saved ${anchor.download}.`;
  }, "image/png");
});

async function start() {
  const query = new URLSearchParams(location.search);
  const shot = query.get("shot");
  shotMode = shot === "cover" || shot === "editor";
  setPanelCount(panels.length);
  if (shotMode) {
    const caption = query.get("caption");
    if (caption !== null) byId("title").value = caption.slice(0, 34);
    if (shot === "cover") {
      document.body.classList.add("shot-cover");
      applyShotFormat();
    }
    const photo = await getSample(query.get("photo") || "pier");
    const xOffsets = photo.name === "pier" ? [0.4, 0.4, 0.4, 0.4] : [0.42, 0.63, 0.34, 0.71];
    const yOffsets = photo.name === "pier" ? [0.24, 0.24, 0.24, 0.24] : [0.48, 0.38, 0.64, 0.52];
    panels = panels.map((panel, index) => ({
      ...panel, image: photo.image, name: photo.name,
      x: xOffsets[index], y: yOffsets[index],
    }));
    byId("photo-count").textContent = `${photo.name} is ready in every frame.`;
  } else {
    const [pier, boulevard] = await Promise.all([getSample("pier"), getSample("boulevard")]);
    panels[0] = { ...panels[0], ...pier };
    panels[1] = { ...panels[1], ...boulevard };
    panels[2] = { ...panels[2], ...pier, x: 0.62, y: 0.45 };
    byId("photo-count").textContent = "Sample story loaded · add your photos or swap frames.";
  }
  await document.fonts.load('400 120px "Anton"');
  render();
  updatePanelControls();
  if (shotMode) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
    }));
  }
}

start().catch((error) => {
  status.textContent = error.message;
  render();
  if (shotMode) window.__shotReady = true;
});
