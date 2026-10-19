(function () {
  "use strict";

  // ---------- Rate tables: FY 2026-27 (AY 2027-28) ----------
  var NEW_SLABS = [[400000, 0], [800000, 0.05], [1200000, 0.10], [1600000, 0.15], [2000000, 0.20], [2400000, 0.25], [Infinity, 0.30]];
  var OLD_SLABS = {
    regular: [[250000, 0], [500000, 0.05], [1000000, 0.20], [Infinity, 0.30]],
    senior: [[300000, 0], [500000, 0.05], [1000000, 0.20], [Infinity, 0.30]],
    super: [[500000, 0], [1000000, 0.20], [Infinity, 0.30]]
  };
  // Surcharge brackets: [income threshold, rate]; thresholds are "exceeding".
  var SURCHARGE_NEW = [[5000000, 0.10], [10000000, 0.15], [20000000, 0.25]];
  var SURCHARGE_OLD = [[5000000, 0.10], [10000000, 0.15], [20000000, 0.25], [50000000, 0.37]];
  var SURCHARGE_COMPANY = [[10000000, 0.07], [100000000, 0.12]];
  var SURCHARGE_FIRM = [[10000000, 0.12]];
  var SURCHARGE_FLAT_10 = [[0, 0.10]];
  var CESS = 0.04;

  var COMPANY_TYPES = {
    baa: { label: "Domestic company: concessional regime (Sec 115BAA equivalent)", rate: 0.22, surcharge: SURCHARGE_FLAT_10 },
    bab: { label: "Domestic manufacturing company: new regime (Sec 115BAB equivalent)", rate: 0.15, surcharge: SURCHARGE_FLAT_10 },
    c25: { label: "Domestic company: 25% rate (turnover up to ₹400 crore)", rate: 0.25, surcharge: SURCHARGE_COMPANY },
    c30: { label: "Domestic company: 30% rate (other)", rate: 0.30, surcharge: SURCHARGE_COMPANY },
    firm: { label: "Partnership firm / LLP", rate: 0.30, surcharge: SURCHARGE_FIRM }
  };

  // ---------- Helpers ----------
  var INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  function fmt(n) { return "₹ " + INR.format(Math.round(n)); }
  function pct(n) { return (Math.round(n * 10000) / 100).toFixed(2) + "%"; }
  function val(id) {
    var v = parseFloat(document.getElementById(id).value);
    return isFinite(v) && v > 0 ? v : 0;
  }

  function slabTax(income, slabs) {
    var tax = 0, prev = 0;
    for (var i = 0; i < slabs.length; i++) {
      if (income > prev) tax += (Math.min(income, slabs[i][0]) - prev) * slabs[i][1];
      prev = slabs[i][0];
    }
    return tax;
  }

  // Applies surcharge with marginal relief (tax + surcharge never rises faster than income above the threshold).
  function withSurcharge(income, baseFn, brackets) {
    var base = baseFn(income), rate = 0, thr = 0;
    for (var i = 0; i < brackets.length; i++) {
      if (income > brackets[i][0]) { rate = brackets[i][1]; thr = brackets[i][0]; }
    }
    if (!rate) return { base: base, surcharge: 0 };
    var total = base * (1 + rate);
    if (thr > 0) {
      var prev = withSurcharge(thr, baseFn, brackets);
      total = Math.min(total, prev.base + prev.surcharge + (income - thr));
    }
    return { base: base, surcharge: Math.max(0, total - base) };
  }

  function row(label, a, b, cls) {
    return '<tr' + (cls ? ' class="' + cls + '"' : "") + "><th scope=\"row\">" + label + "</th><td>" + a + "</td>" + (b === undefined ? "" : "<td>" + b + "</td>") + "</tr>";
  }

  // ---------- Live ₹ preview under inputs ----------
  document.querySelectorAll("input[type=number][data-preview]").forEach(function (input) {
    var hint = document.querySelector('[data-for="' + input.id + '"]');
    var update = function () { hint.textContent = input.value ? fmt(parseFloat(input.value) || 0) : ""; };
    input.addEventListener("input", update);
    update();
  });

  // ---------- Individual calculator ----------
  var indForm = document.getElementById("ind-form");
  var indResult = document.getElementById("ind-result");

  function computeRegime(opts) {
    var baseFn = function (inc) {
      var t = slabTax(inc, opts.slabs);
      if (opts.resident) {
        if (opts.isNew) {
          if (inc <= 1200000) t = 0; else t = Math.min(t, inc - 1200000);
        } else if (inc <= 500000) {
          t = Math.max(0, t - 12500);
        }
      }
      return t;
    };
    var raw = slabTax(opts.taxable, opts.slabs);
    var s = withSurcharge(opts.taxable, baseFn, opts.surcharge);
    var cess = (s.base + s.surcharge) * CESS;
    return { slabTax: raw, rebate: raw - s.base, surcharge: s.surcharge, cess: cess, total: s.base + s.surcharge + cess };
  }

  function calcIndividual() {
    var age = document.getElementById("ind-age").value;
    var resident = document.getElementById("ind-resident").value === "resident";
    var hasSalary = document.getElementById("ind-salary").checked;
    var gross = val("ind-income");

    var oldSlabs = resident ? OLD_SLABS[age] : OLD_SLABS.regular;

    var stdNew = hasSalary ? Math.min(gross, 75000) : 0;
    var stdOld = hasSalary ? Math.min(gross, 50000) : 0;
    var d80c = Math.min(val("ind-80c"), 150000);
    var nps = Math.min(val("ind-nps"), 50000);
    var home = Math.min(val("ind-home"), 200000);
    var empNps = val("ind-enps");
    var otherOld = d80c + val("ind-80d") + nps + home + val("ind-hra") + val("ind-other");

    var taxableNew = Math.max(0, gross - stdNew - empNps);
    var taxableOld = Math.max(0, gross - stdOld - empNps - otherOld);

    var n = computeRegime({ taxable: taxableNew, slabs: NEW_SLABS, surcharge: SURCHARGE_NEW, resident: resident, isNew: true });
    var o = computeRegime({ taxable: taxableOld, slabs: oldSlabs, surcharge: SURCHARGE_OLD, resident: resident, isNew: false });

    var html = '<div class="table-wrap"><table class="compact"><thead><tr><th scope="col">Particulars</th><th scope="col">New regime</th><th scope="col">Old regime</th></tr></thead><tbody>' +
      row("Total income", fmt(gross), fmt(gross)) +
      row("Standard deduction", "− " + fmt(stdNew), "− " + fmt(stdOld)) +
      row("Employer NPS, 80CCD(2)", "− " + fmt(empNps), "− " + fmt(empNps)) +
      row("Chapter VI-A deductions / exemptions", "Not allowed", "− " + fmt(otherOld)) +
      row("Taxable income", fmt(taxableNew), fmt(taxableOld), "strong") +
      row("Tax on slab rates", fmt(n.slabTax), fmt(o.slabTax)) +
      row("Rebate u/s 87A (with marginal relief)", "− " + fmt(n.rebate), "− " + fmt(o.rebate)) +
      row("Surcharge (after marginal relief)", fmt(n.surcharge), fmt(o.surcharge)) +
      row("Health &amp; education cess (4%)", fmt(n.cess), fmt(o.cess)) +
      row("Total tax payable", fmt(n.total), fmt(o.total), "total") +
      row("Effective tax rate", gross ? pct(n.total / gross) : "0.00%", gross ? pct(o.total / gross) : "0.00%") +
      "</tbody></table></div>";

    var diff = Math.abs(n.total - o.total);
    var msg;
    if (!gross) msg = "Enter your income to see the comparison.";
    else if (Math.round(diff) === 0) msg = "Both regimes result in the same tax for these inputs.";
    else msg = (n.total < o.total ? "New regime" : "Old regime") + " is lower by " + fmt(diff) + " for these inputs.";
    indResult.innerHTML = '<p class="verdict">' + msg + "</p>" + html;
  }

  if (indForm) {
    indForm.addEventListener("input", calcIndividual);
    indForm.addEventListener("change", calcIndividual);
    indForm.addEventListener("submit", function (e) { e.preventDefault(); calcIndividual(); });
    calcIndividual();
  }

  // ---------- Company calculator ----------
  var coForm = document.getElementById("co-form");
  var coResult = document.getElementById("co-result");

  function calcCompany() {
    var type = COMPANY_TYPES[document.getElementById("co-type").value];
    var income = val("co-income");
    var baseFn = function (inc) { return inc * type.rate; };
    var s = withSurcharge(income, baseFn, type.surcharge);
    var cess = (s.base + s.surcharge) * CESS;
    var total = s.base + s.surcharge + cess;

    coResult.innerHTML = '<p class="verdict">' + type.label + "</p>" +
      '<div class="table-wrap"><table class="compact"><tbody>' +
      row("Taxable income", fmt(income)) +
      row("Base tax rate", pct(type.rate)) +
      row("Income-tax", fmt(s.base)) +
      row("Surcharge" + (type.surcharge === SURCHARGE_FLAT_10 ? " (10% flat)" : " (after marginal relief)"), fmt(s.surcharge)) +
      row("Health &amp; education cess (4%)", fmt(cess)) +
      row("Total tax payable", fmt(total), undefined, "total") +
      row("Effective tax rate", income ? pct(total / income) : "0.00%") +
      "</tbody></table></div>";
  }

  if (coForm) {
    coForm.addEventListener("input", calcCompany);
    coForm.addEventListener("change", calcCompany);
    coForm.addEventListener("submit", function (e) { e.preventDefault(); calcCompany(); });
    calcCompany();
  }

  // ---------- Tabs ----------
  var tabs = document.querySelectorAll('[role="tab"]');
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
      });
    });
  });
})();
