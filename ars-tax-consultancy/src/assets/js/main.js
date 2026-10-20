(function () {
  "use strict";

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

  // ---------- Contact form (submits to Formspree) ----------
  var form = document.getElementById("contact-form");
  if (form) {
    var status = document.getElementById("form-status");
    var submitButton = form.querySelector('[type="submit"]');
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var formData = new FormData(form);
      formData.set("_subject", "Enquiry: " + formData.get("service") + " - " + formData.get("name"));
      submitButton.disabled = true;
      status.textContent = "Sending your enquiry...";
      status.classList.add("is-visible");

      try {
        var response = await fetch(form.action, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" }
        });
        if (!response.ok) {
          throw new Error("Formspree returned HTTP " + response.status);
        }
        status.textContent = "Thank you. Your enquiry has been sent successfully.";
        form.reset();
      } catch (error) {
        console.error("Contact form submission failed:", error);
        status.textContent = "We could not send your enquiry. Please check your connection and try again, or contact us by phone or email.";
      } finally {
        submitButton.disabled = false;
      }
    });
  }
})();
