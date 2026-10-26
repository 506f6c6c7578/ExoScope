(() => {
    const nav = document.getElementById("site-nav");
    const toggle = document.querySelector("[data-nav-toggle]");
    nav.addEventListener("toggle", (event) => toggle.setAttribute("aria-expanded", String(event.newState === "open")));
})();
