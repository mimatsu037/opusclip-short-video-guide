const status = document.getElementById("copy-status");
const resetTimers = new WeakMap();

async function copyText(target) {
  const text = target.textContent.trim();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("textarea");
    input.className = "sr-only";
    input.value = text;
    input.setAttribute("readonly", "");
    document.body.append(input);
    const previousFocus = document.activeElement;
    input.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      input.remove();
      previousFocus?.focus();
    }
    if (copied) return;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
    throw new Error("Clipboard unavailable");
  }
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  const initialLabel = button.textContent;
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copy);
    clearTimeout(resetTimers.get(button));
    status.textContent = "";
    try {
      await copyText(target);
      button.textContent = "コピー済み";
      status.textContent = "コピーしました";
    } catch {
      button.textContent = "手動でコピー";
      status.textContent = "選択したテキストを手動でコピーしてください";
    }
    resetTimers.set(button, setTimeout(() => { button.textContent = initialLabel; }, 2200));
  });
});

const checklist = document.querySelector(".checklist");
const checks = [...checklist.querySelectorAll("input[type=checkbox]")];
const progress = checklist.querySelector(".check-progress");

function updateProgress() {
  const checked = checks.filter((input) => input.checked).length;
  progress.textContent = `${checked} / ${checks.length} 完了`;
}

checks.forEach((input) => {
  const storageKey = `mina-opusclip-guide-check-${input.name}`;
  try {
    input.checked = localStorage.getItem(storageKey) === "1";
  } catch {
    // The checklist works for this visit if browser storage is unavailable.
  }
  input.addEventListener("change", () => {
    try {
      localStorage.setItem(storageKey, input.checked ? "1" : "0");
    } catch {
      // Keep the current selection when browser storage is unavailable.
    }
    updateProgress();
  });
});
updateProgress();

// Do not show the floating CTA until the inline official LINE invitation is in view.
const lineIntro = document.querySelector("#line-benefits .line-banner");
const lineFloat = document.querySelector(".sticky-line-link");
if (lineIntro && lineFloat) {
  let queued = false;
  let lastVisible;
  function updateLineFloat() {
    queued = false;
    const visible = lineIntro.getBoundingClientRect().top <= window.innerHeight * .7;
    if (visible === lastVisible) return;
    lastVisible = visible;
    document.body.classList.toggle("has-line-float", visible);
    if (visible) {
      lineFloat.removeAttribute("tabindex");
      lineFloat.removeAttribute("aria-hidden");
    } else {
      if (document.activeElement === lineFloat) lineFloat.blur();
      lineFloat.tabIndex = -1;
      lineFloat.setAttribute("aria-hidden", "true");
    }
  }
  function requestLineFloat() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(updateLineFloat);
  }
  window.addEventListener("scroll", requestLineFloat, {passive:true});
  window.addEventListener("resize", requestLineFloat, {passive:true});
  window.addEventListener("hashchange", requestLineFloat);
  window.addEventListener("load", requestLineFloat, {once:true});
  window.addEventListener("pageshow", requestLineFloat);
  requestLineFloat();
}

// A brief, observable cue when each in-page invitation comes into view.
if ("IntersectionObserver" in window) {
  const bannerObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      target.classList.toggle("is-bobbing", isIntersecting);
    });
  }, { threshold: .35 });
  document.querySelectorAll("#line-benefits .line-banner, #openchat .line-banner")
    .forEach((banner) => bannerObserver.observe(banner));
}

