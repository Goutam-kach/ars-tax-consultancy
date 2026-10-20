/* Edit this file to personalize the public website. Photo/logo paths are relative to src/. Do not put secrets here. */
window.SITE_CONFIG = {
  business: {
    name: "ARS Tax Consultancy",
    tagline: "Accounting · Tax · Compliance",
    city: "Hyderabad",
    state: "Telangana",
    heroDescription: "We take care of your accounts, GST, TDS, payroll, ROC compliance, cost records, and financial and legal advisory, so you can focus on running and growing your business.",
    aboutDescription: "A team of seasoned professionals with diverse backgrounds and expertise, committed to tailored accounting and tax support.",
    footerDescription: "Personalised accounting, tax and compliance services for growing businesses."
  },
  brand: {
    logo: "assets/images/logo-mark.svg",
    favicon: "assets/images/favicon.svg"
  },
  contact: {
    email: "haritha.mudapaka@gmail.com",
    phone: "+91 8143401949",
    address: "Seethampeta Main Road, Visakhapatnam",
    officeHours: "10 AM - 6 PM",
    mapUrl: "https://maps.app.goo.gl/vKZ9f7P2pPa213HR9"
  },
  team: [
    { name: "", role: "Proprietor", bio: "", photo: "" },
    { name: "", role: "", bio: "", photo: "" },
    { name: "", role: "", bio: "", photo: "" }
  ],
  testimonials: [
    { quote: "", name: "", role: "", company: "", photo: "" },
    { quote: "", name: "", role: "", company: "", photo: "" },
    { quote: "", name: "", role: "", company: "", photo: "" }
  ]
};

(function () {
  "use strict";

  var config = window.SITE_CONFIG;
  var fallbackPhoto = "assets/images/avatar-placeholder.svg";

  function getValue(path, source) {
    return path.split(".").reduce(function (value, key) {
      return value && value[key];
    }, source || config);
  }

  function applyTemplate(template, source) {
    return template.replace(/\{([\w.]+)\}/g, function (match, path) {
      var value = getValue(path, source);
      return value == null ? "" : String(value);
    });
  }

  document.querySelectorAll("[data-config]").forEach(function (element) {
    var value = getValue(element.dataset.config);
    if (value != null) element.textContent = String(value);
  });

  document.querySelectorAll("[data-config-template]").forEach(function (element) {
    var value = applyTemplate(element.dataset.configTemplate);
    if (element.tagName === "TITLE") {
      element.textContent = value;
    } else if (element.tagName === "META") {
      element.setAttribute("content", value);
    } else {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-config-logo]").forEach(function (image) {
    var logo = getValue("brand.logo");
    if (logo) image.setAttribute("src", logo);
  });

  document.querySelectorAll("[data-config-favicon]").forEach(function (icon) {
    var favicon = getValue("brand.favicon");
    if (favicon) icon.setAttribute("href", favicon);
  });

  document.querySelectorAll("[data-config-link]").forEach(function (link) {
    var type = link.dataset.configLink;
    var value = getValue("contact." + type);
    if (!value) {
      link.hidden = true;
      return;
    }
    link.hidden = false;
    link.setAttribute("href", (type === "email" ? "mailto:" : "tel:") + value);
  });

  document.querySelectorAll("[data-config-optional]").forEach(function (element) {
    element.hidden = !getValue(element.dataset.configOptional);
  });

  document.querySelectorAll("[data-config-contact-block]").forEach(function (element) {
    element.hidden = !["address", "phone", "email"].some(function (field) {
      return getValue("contact." + field);
    });
  });

  document.querySelectorAll("[data-config-map]").forEach(function (element) {
    var mapUrl = getValue("contact.mapUrl");
    var address = getValue("contact.address");
    var mapContainer = element.closest(".map-placeholder");
    if (!mapUrl && address) {
      mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
    }
    if (!mapUrl) {
      element.hidden = true;
      if (mapContainer) mapContainer.hidden = true;
      return;
    }
    try {
      var parsedMapUrl = new URL(mapUrl);
      if (parsedMapUrl.protocol !== "https:" && parsedMapUrl.protocol !== "http:") {
        throw new TypeError("Map URL must use HTTP or HTTPS.");
      }
    } catch (error) {
      console.error("Invalid contact.mapUrl in assets/js/site-config.js:", error);
      element.hidden = true;
      if (mapContainer) mapContainer.hidden = true;
      return;
    }
    element.hidden = false;
    if (mapContainer) mapContainer.hidden = false;
    element.setAttribute("href", mapUrl);
  });

  document.querySelectorAll("[data-config-list]").forEach(function (list) {
    var items = getValue(list.dataset.configList);
    var cards = list.querySelectorAll("[data-config-item]");
    var section = list.closest("section");
    var visibleItems = 0;

    cards.forEach(function (card, index) {
      var item = Array.isArray(items) ? items[index] : null;
      if (!item || (list.dataset.configList === "team" ? !item.name : !item.quote || !item.name)) {
        card.hidden = true;
        return;
      }
      card.hidden = false;
      visibleItems++;
      card.querySelectorAll("[data-config-field]").forEach(function (field) {
        var value = item[field.dataset.configField] || "";
        field.textContent = field.dataset.configField === "byline"
          ? [item.role, item.company].filter(Boolean).join(", ")
          : value;
      });
      card.querySelectorAll("[data-config-image]").forEach(function (image) {
        image.setAttribute("src", item[image.dataset.configImage] || fallbackPhoto);
        image.setAttribute("alt", item.name + " photo");
      });
    });

    if (section) section.hidden = visibleItems === 0;
  });
})();
