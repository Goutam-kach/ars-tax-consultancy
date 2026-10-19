(function () {
  "use strict";

  // Placeholder recipient for the contact form - replace with the firm's real email address.
  var CONTACT_EMAIL = "your-email@example.com";

  document.documentElement.classList.add("js");

  // ---------- Mobile navigation ----------
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---------- Footer year ----------
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Scroll reveal ----------
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  // ---------- Back to top ----------
  var toTop = document.querySelector(".to-top");
  if (toTop) {
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("is-visible", window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---------- Compliance calendar filter + search ----------
  var table = document.getElementById("calendar-table");
  if (table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-category]"));
    var chips = document.querySelectorAll(".chip[data-filter]");
    var searchInput = document.getElementById("calendar-search");
    var emptyRow = document.getElementById("calendar-empty");
    var count = document.getElementById("calendar-count");
    var activeFilter = "all";

    var apply = function () {
      var q = (searchInput.value || "").trim().toLowerCase();
      var visible = 0;
      rows.forEach(function (row) {
        var matchCat = activeFilter === "all" || row.dataset.category === activeFilter;
        var matchText = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
        var show = matchCat && matchText;
        row.hidden = !show;
        if (show) visible++;
      });
      emptyRow.hidden = visible !== 0;
      count.textContent = "Showing " + visible + " of " + rows.length + " services";
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        activeFilter = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        apply();
      });
    });
    searchInput.addEventListener("input", apply);

    var printBtn = document.getElementById("print-calendar");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

    // Support deep links such as compliance-calendar.html#gst
    var hash = window.location.hash.replace("#", "");
    var preset = document.querySelector('.chip[data-filter="' + hash + '"]');
    if (preset) preset.click(); else apply();
  }

  // ---------- Contact form (opens the visitor's email app) ----------
  var form = document.getElementById("contact-form");
  if (form) {
    var status = document.getElementById("form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var d = new FormData(form);
      var subject = "Enquiry: " + d.get("service") + " - " + d.get("name");
      var body = [
        "Name: " + d.get("name"),
        "Company: " + (d.get("company") || "-"),
        "Phone: " + d.get("phone"),
        "Email: " + d.get("email"),
        "Service of interest: " + d.get("service"),
        "",
        d.get("message")
      ].join("\n");
      window.location.href = "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      status.textContent = "Thank you. Your email app should open with the enquiry ready to send. If it does not, please contact us using the details shown.";
      status.classList.add("is-visible");
      form.reset();
    });
  }
})();
