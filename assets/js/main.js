// Aspen Meridian - Main JavaScript
console.log(
  "%cAspen Meridian 2026 — Premium digital forensics site ready 🌲",
  "color:#4ade80; font-family:monospace; font-size:13px;"
);

// ===============================
// SMOOTH SCROLL
// ===============================
function smoothScrollTo(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    const navHeight = 100;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition =
      elementPosition + window.scrollY - navHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
}

// ===============================
// MOBILE MENU
// ===============================
function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const icon = document.getElementById("mobile-menu-btn");

  if (!menu || !icon) return;

  if (menu.classList.contains("hidden")) {
    menu.classList.remove("hidden");
    icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  } else {
    menu.classList.add("hidden");
    icon.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }
}

// ===============================
// COOKIE BANNER
// ===============================
function showCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  if (banner && !localStorage.getItem("cookiesAccepted")) {
    banner.classList.remove("hidden");
  }
}

function acceptCookies() {
  localStorage.setItem("cookiesAccepted", "true");
  const banner = document.getElementById("cookie-banner");
  if (banner) banner.classList.add("hidden");
}

function rejectCookies() {
  localStorage.setItem("cookiesAccepted", "false");
  const banner = document.getElementById("cookie-banner");
  if (banner) banner.classList.add("hidden");
}

// ===============================
// ESC KEY HANDLER
// ===============================
function handleEsc(e) {
  if (e.key === "Escape") {
    const banner = document.getElementById("cookie-banner");
    if (banner && !banner.classList.contains("hidden")) {
      rejectCookies();
    }
  }
}

// ===============================
// INITIALIZE
// ===============================
window.addEventListener("load", function () {
  setTimeout(showCookieBanner, 1200);

  const mobileBtn = document.getElementById("mobile-menu-btn");
  if (mobileBtn) {
    mobileBtn.addEventListener("click", toggleMobileMenu);
  }

  document.addEventListener("keydown", handleEsc);

  // =============================
  // CAROUSEL LOGIC (INFINITE)
  // =============================

  const track = document.getElementById("articlesTrack");
  const leftBtn = document.getElementById("scrollLeft");
  const rightBtn = document.getElementById("scrollRight");

  if (!track || !leftBtn || !rightBtn) return;

  const gap = 32;
  let cards = Array.from(track.children);

  if (cards.length < 2) return;

  // Clone first and last
  const firstClone = cards[0].cloneNode(true);
  const lastClone = cards[cards.length - 1].cloneNode(true);

  track.appendChild(firstClone);
  track.insertBefore(lastClone, cards[0]);

  cards = Array.from(track.children);

  let currentIndex = 1;
  let cardWidth = cards[0].offsetWidth + gap;

  function updatePosition(animate = true) {
    track.style.transition = animate
      ? "transform 0.6s ease-in-out"
      : "none";

    track.style.transform = `translateX(-${
      currentIndex * cardWidth
    }px)`;
  }

  updatePosition(false);

  rightBtn.addEventListener("click", () => {
    currentIndex++;
    updatePosition();
  });

  leftBtn.addEventListener("click", () => {
    currentIndex--;
    updatePosition();
  });

  track.addEventListener("transitionend", () => {
    if (currentIndex === cards.length - 1) {
      currentIndex = 1;
      updatePosition(false);
    }

    if (currentIndex === 0) {
      currentIndex = cards.length - 2;
      updatePosition(false);
    }
  });

  // Auto scroll
  let auto = setInterval(() => {
    currentIndex++;
    updatePosition();
  }, 4000);

  track.addEventListener("mouseenter", () =>
    clearInterval(auto)
  );

  track.addEventListener("mouseleave", () => {
    auto = setInterval(() => {
      currentIndex++;
      updatePosition();
    }, 4000);
  });

  window.addEventListener("resize", () => {
    cardWidth = cards[0].offsetWidth + gap;
    updatePosition(false);
  });
});
