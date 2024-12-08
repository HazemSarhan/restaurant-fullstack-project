(() => {
  "use strict";

  const getStoredTheme = () => localStorage.getItem("theme");
  const setStoredTheme = (theme) => localStorage.setItem("theme", theme);

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const setTheme = (theme) => {
    if (theme === "auto") {
      document.documentElement.setAttribute(
        "data-bs-theme",
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
      );
    } else {
      document.documentElement.setAttribute("data-bs-theme", theme);
    }
  };

  const syncSwitcherWithTheme = () => {
    const themeSwitcher = document.querySelector("#themingSwitcher");
    const currentTheme = getPreferredTheme();

    // Synchronize the checkbox state
    themeSwitcher.checked = currentTheme === "dark";
  };

  const handleThemeSwitch = () => {
    const themeSwitcher = document.querySelector("#themingSwitcher");

    themeSwitcher.addEventListener("change", () => {
      const theme = themeSwitcher.checked ? "dark" : "light";
      setStoredTheme(theme);
      setTheme(theme);
    });
  };

  // Initialize the theme and the switcher
  const initThemeToggler = () => {
    setTheme(getPreferredTheme());
    syncSwitcherWithTheme();
    handleThemeSwitch();
  };

  window.addEventListener("DOMContentLoaded", initThemeToggler);
})();
