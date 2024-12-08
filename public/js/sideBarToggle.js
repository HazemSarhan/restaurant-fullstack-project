document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const userName = document.querySelector(".dropdown a strong");
  const titles = document.querySelectorAll(".sidebar ul li a p");
  const dashTitle = document.querySelector(".title");
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.style.width = sidebar.style.width === "280px" ? "80px" : "280px";
      titles.forEach((title) => {
        if (sidebar.style.width === "280px") {
          title.style.display = "block";
          dashTitle.style.display = "block";
          userName.style.display = "block";
        } else {
          title.style.display = "none";
          userName.style.display = "none";
          dashTitle.style.display = "none";
        }
      });
    });
  }
});
