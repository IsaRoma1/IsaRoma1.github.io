const PASSWORD = "6767";
const STORAGE_KEY = "plov_workbook_access";

const body = document.body;
const passwordScreen = document.getElementById("passwordScreen");
const siteShell = document.getElementById("siteShell");
const form = document.getElementById("passwordForm");
const input = document.getElementById("passwordInput");
const error = document.getElementById("passwordError");
const toast = document.getElementById("toast");

function unlock() {
  body.classList.remove("locked");
  passwordScreen.hidden = true;
  siteShell.hidden = false;
}

if (localStorage.getItem(STORAGE_KEY) === "ok") {
  unlock();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (input.value.trim() === PASSWORD) {
    localStorage.setItem(STORAGE_KEY, "ok");
    unlock();
  } else {
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");
    input.focus();
  }
});

input.addEventListener("input", () => {
  error.hidden = true;
  input.removeAttribute("aria-invalid");
});

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

let toastTimer;
function showToast() {
  clearTimeout(toastTimer);
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1700);
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy-prompt");
  if (!button) return;
  const card = button.closest(".prompt-card");
  const text = card?.querySelector(".prompt-text")?.textContent || "";
  await copyText(text);
  showToast();
});
