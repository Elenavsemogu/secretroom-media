document.addEventListener("DOMContentLoaded", function () {
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  document.querySelectorAll(".svc-card-promo").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      var code = btn.getAttribute("data-code") || "";
      try {
        await navigator.clipboard.writeText(code);
        btn.classList.add("copied");
        var strong = btn.querySelector("strong");
        var old = strong ? strong.textContent : "";
        if (strong) strong.textContent = "Скопировано";
        setTimeout(function () {
          if (strong) strong.textContent = old;
          btn.classList.remove("copied");
        }, 1400);
      } catch (e) {
        window.prompt("Скопируйте промокод:", code);
      }
    });
  });

  document.querySelectorAll(".svc-cat-pill").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-cat");
      document.querySelectorAll(".svc-cat-pill").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      document.querySelectorAll(".svc-section").forEach(function (sec) {
        if (cat === "all") {
          sec.style.display = "";
        } else {
          sec.style.display = sec.getAttribute("data-cat") === cat ? "" : "none";
        }
      });
    });
  });
});
