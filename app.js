"use strict";
const $ = (selector) => document.querySelector(selector);
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const scrollBehavior = () => (motion.matches ? "instant" : "smooth");
const prices = { "30×40": 499, "50×70": 899, "100×100": 1899 };
const menu = $("#menu"),
  nav = $("#nav"),
  form = $("#order-form");
function setMenu(open) {
  nav.classList.toggle("open", open);
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Закрити меню" : "Відкрити меню");
}
menu.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("click", (e) => {
  if (!nav.contains(e.target) && !menu.contains(e.target)) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("open")) {
    setMenu(false);
    menu.focus();
  }
});
window
  .matchMedia("(min-width:1020px)")
  .addEventListener("change", () => setMenu(false));

document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((other) => {
      other.classList.toggle("active", other === button);
      other.setAttribute("aria-pressed", String(other === button));
    });
    document.querySelectorAll("[data-type]").forEach((card) => {
      card.hidden =
        button.dataset.filter !== "all" &&
        card.dataset.type !== button.dataset.filter;
    });
  }),
);
function update() {
  const isPhoto = $("#product").value === "Фото на полотні";
  const price = isPhoto ? prices[$("#size").value] : null;
  $("#total").textContent = price
    ? price.toLocaleString("uk-UA") + " ₴"
    : "За запитом";
  $("#total").classList.toggle("quote", !price);
  const custom = !Object.hasOwn(prices, $("#size").value);
  $("#custom-size").hidden = !custom;
  $("#custom-size").disabled = !custom;
  document.querySelectorAll("[data-size]").forEach((button) => {
    const selected = isPhoto && button.dataset.size === $("#size").value;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}
$("#size").addEventListener("change", update);
$("#product").addEventListener("change", update);
document.querySelectorAll("[data-size]").forEach((button) =>
  button.addEventListener("click", () => {
    $("#size").value = button.dataset.size;
    $("#product").value = "Фото на полотні";
    update();
    $("#order-form").scrollIntoView({
      behavior: scrollBehavior(),
      block: "start",
    });
  }),
);
document.querySelectorAll("[data-product]").forEach((a) =>
  a.addEventListener("click", () => {
    $("#product").value = a.dataset.product;
    if (a.dataset.orderSize) $("#size").value = a.dataset.orderSize;
    update();
  }),
);
update();

let currentFile = null,
  previewUrl = null,
  imageRequest = 0,
  imagePending = false;
const photo = $("#photo"),
  preview = $("#preview");
function photoError(message) {
  $("#photo-error").textContent = message;
  photo.setCustomValidity(message);
  photo.setAttribute("aria-invalid", String(Boolean(message)));
  $("#remove-photo").hidden = !message && !currentFile;
}
function clearPhoto() {
  imageRequest++;
  imagePending = false;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  currentFile = null;
  previewUrl = null;
  photo.value = "";
  preview.removeAttribute("src");
  preview.hidden = true;
  $("#upload-label").hidden = false;
  $("#photo-status").textContent = "";
  photoError("");
}
async function showPhoto(file) {
  if (!file) return; // Cancelling a chooser preserves the last accepted image.
  const request = ++imageRequest;
  imagePending = false;
  photoError("");
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    !file.size ||
    file.size > 20 * 1024 * 1024
  ) {
    photoError(
      "Оберіть непорожнє фото JPG, PNG або WEBP до 20 МБ або приберіть його, щоб продовжити без фото.",
    );
    return;
  }
  imagePending = true;
  $("#photo-status").textContent = "Перевіряємо фото…";
  const candidateUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = candidateUrl;
    await image.decode();
    if (request !== imageRequest) {
      URL.revokeObjectURL(candidateUrl);
      return;
    }
    if (
      !image.naturalWidth ||
      image.naturalWidth * image.naturalHeight > 50000000
    )
      throw new Error("image-size");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = candidateUrl;
    currentFile = file;
    preview.src = previewUrl;
    preview.hidden = false;
    $("#upload-label").hidden = true;
    $("#photo-status").textContent =
      `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} МБ. Натисніть на фото, щоб замінити.`;
    $("#remove-photo").hidden = false;
    photoError("");
  } catch {
    URL.revokeObjectURL(candidateUrl);
    if (request !== imageRequest) return;
    $("#photo-status").textContent = "";
    photoError(
      "Не вдалося відкрити зображення або воно перевищує 50 мегапікселів. Оберіть інше фото чи приберіть його.",
    );
  } finally {
    if (request === imageRequest) imagePending = false;
  }
}
photo.addEventListener("change", (e) => showPhoto(e.target.files[0]));
$("#remove-photo").addEventListener("click", () => {
  clearPhoto();
  photo.focus();
});
$("#drop").addEventListener("dragover", (e) => {
  e.preventDefault();
  $("#drop").classList.add("dragging");
});
$("#drop").addEventListener("dragleave", () =>
  $("#drop").classList.remove("dragging"),
);
$("#drop").addEventListener("drop", (e) => {
  e.preventDefault();
  $("#drop").classList.remove("dragging");
  showPhoto(e.dataTransfer.files[0]);
});
// Dropping outside the upload target must not navigate away from the form.
window.addEventListener("dragover", (e) => {
  if ([...e.dataTransfer.types].includes("Files")) e.preventDefault();
});
window.addEventListener("drop", (e) => {
  if ([...e.dataTransfer.types].includes("Files")) e.preventDefault();
});

const track = $("#track");
track.tabIndex = 0;
track.setAttribute(
  "aria-label",
  "Галерея робіт. Гортайте стрілками вліво та вправо.",
);
function updateGallery() {
  $("#prev").disabled = track.scrollLeft <= 2;
  $("#next").disabled =
    track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
}
function moveGallery(direction) {
  const figures = track.querySelectorAll("figure");
  const step =
    figures.length > 1
      ? figures[1].offsetLeft - figures[0].offsetLeft
      : track.clientWidth;
  track.scrollBy({ left: direction * step, behavior: scrollBehavior() });
}
$("#prev").addEventListener("click", () => moveGallery(-1));
$("#next").addEventListener("click", () => moveGallery(1));
track.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    moveGallery(e.key === "ArrowRight" ? 1 : -1);
  }
});
track.addEventListener("scroll", updateGallery, { passive: true });
window.addEventListener("resize", updateGallery, { passive: true });
updateGallery();

const nameInput = $("#name");
nameInput.addEventListener("input", () => {
  nameInput.setCustomValidity("");
  nameInput.removeAttribute("aria-invalid");
  $("#error").textContent = "";
});
for (const id of ["custom-width", "custom-height"])
  $("#" + id).addEventListener("input", () => {
    $("#custom-height").setCustomValidity("");
  });
const dialog = $("#handoff");
let returnFocus = null,
  oldOverflow = "";
form.addEventListener("submit", (e) => {
  e.preventDefault();
  $("#error").textContent = "";
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.setCustomValidity("Вкажіть ім’я, а не лише пробіли.");
    nameInput.setAttribute("aria-invalid", "true");
    $("#error").textContent = "Вкажіть ваше ім’я.";
    nameInput.reportValidity();
    nameInput.focus();
    return;
  }
  let size = $("#size").value + " см";
  if (!$("#custom-size").disabled) {
    const width = Number($("#custom-width").value),
      height = Number($("#custom-height").value);
    const smaller = Math.min(width, height),
      larger = Math.max(width, height);
    if (smaller < 15 || larger < 20 || smaller > 140 || larger > 200) {
      $("#custom-height").setCustomValidity(
        "Оберіть розмір у межах від 15×20 до 140×200 см.",
      );
      $("#custom-height").reportValidity();
      return;
    }
    size = `${width}×${height} см (індивідуальний розмір)`;
  }
  if (imagePending) {
    $("#error").textContent = "Зачекайте завершення перевірки фото.";
    return;
  }
  if (!photo.checkValidity()) {
    photo.reportValidity();
    return;
  }
  $("#summary").value =
    `Вітаю! Мене звати ${name}. Хочу замовити: ${$("#product").value}.\nРозмір: ${size}.\nОрієнтовна вартість: ${$("#total").textContent} (прошу підтвердити).\nПодарункове пакування: ${$("#gift").checked ? "так, прошу додати до розрахунку" : "ні"}.\n${currentFile ? "Фото додам окремим файлом: " + currentFile.name : "Потрібна допомога з вибором фото."}\nПідкажіть, будь ласка, остаточну вартість і термін виготовлення.`;
  $("#copy-status").textContent = "";
  returnFocus = document.activeElement;
  oldOverflow = document.body.style.overflow;
  dialog.showModal();
  document.body.style.overflow = "hidden";
});
$(".close").addEventListener("click", () => dialog.close());
// Close only if the pointer both starts and ends on the backdrop.
let backdropStart = false;
function outsideDialog(e) {
  const r = dialog.getBoundingClientRect();
  return (
    e.target === dialog &&
    (e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom)
  );
}
dialog.addEventListener("pointerdown", (e) => {
  backdropStart = outsideDialog(e);
});
dialog.addEventListener("click", (e) => {
  if (backdropStart && outsideDialog(e)) dialog.close();
  backdropStart = false;
});
dialog.addEventListener("close", () => {
  document.body.style.overflow = oldOverflow;
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});
$("#copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#summary").value);
    $("#copy-status").textContent =
      "Скопійовано! Відкрийте месенджер і вставте текст.";
  } catch {
    $("#summary").focus();
    $("#summary").select();
    $("#summary").setSelectionRange(0, $("#summary").value.length);
    $("#copy-status").textContent =
      "Текст виділено. Скопіюйте його вручну: Ctrl+C / ⌘C або командою «Копіювати» на телефоні.";
  }
});
if ("IntersectionObserver" in window && !motion.matches) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(".section-top,.steps article")
    .forEach((el) => observer.observe(el));
}
if ("IntersectionObserver" in window) {
  new IntersectionObserver(
    (entries) => {
      const visible = entries[0].isIntersecting;
      $(".mobile-cta").classList.toggle("is-hidden", visible);
      $(".mobile-cta").tabIndex = visible ? -1 : 0;
      $(".mobile-cta").setAttribute("aria-hidden", String(visible));
    },
    { threshold: 0 },
  ).observe(form);
}
