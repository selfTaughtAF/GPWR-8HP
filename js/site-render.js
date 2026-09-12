(() => {
  const content = window.SITE_CONTENT;
  if (!content) return;

  const asset = (filename) => `./assets/parts/${filename}`;
  const esc = (value) => {
    const el = document.createElement("span");
    el.textContent = value ?? "";
    return el.innerHTML;
  };

  const buildCatalog = () => {
    const catalog = { car: {}, controller: {}, shifter: {}, accessory: {} };
    const { kits, controllers, shifters, accessories } = content.products;

    kits.filter((item) => item.inConfigurator).forEach((item) => {
      catalog.car[item.id] = {
        label: item.configuratorLabel || item.name,
        image: asset(item.image),
      };
    });

    controllers.filter((item) => item.inConfigurator).forEach((item) => {
      catalog.controller[item.id] = {
        label: item.configuratorLabel || item.name,
        image: asset(item.image),
      };
    });

    shifters.filter((item) => item.inConfigurator).forEach((item) => {
      catalog.shifter[item.id] = {
        label: item.configuratorLabel || item.name,
        image: asset(item.image),
      };
    });

    accessories.filter((item) => item.inConfigurator).forEach((item) => {
      catalog.accessory[item.id] = item.name;
    });

    return catalog;
  };

  const renderPartCard = (item, presetAttr) => {
    const preset =
      presetAttr === "car"
        ? `<a class="btn btn-outline btn-sm" href="#configurator" data-preset-car="${esc(item.id)}">Add to configurator</a>`
        : presetAttr === "accessory"
          ? `<a class="btn btn-outline btn-sm" href="#configurator" data-preset-accessory="${esc(item.id)}">Add to configurator</a>`
          : "";

    return `
      <article class="part-card">
        <img src="${asset(item.image)}" alt="${esc(item.imageAlt || item.name)}" />
        <div class="part-body">
          <p class="part-type">${esc(item.categoryLabel)}</p>
          <h4>${esc(item.name)}</h4>
          <p>${esc(item.description)}</p>
          ${preset}
        </div>
      </article>
    `;
  };

  const renderGuide = () => {
    const grid = document.querySelector("[data-guide-grid]");
    if (!grid || !content.guide?.items?.length) return;

    grid.innerHTML = content.guide.items
      .map((item) => {
        const featured = item.id === content.guide.mostPopularId;
        return `
          <article class="guide-card${featured ? " guide-card-featured" : ""} reveal">
            ${featured ? '<span class="guide-badge">Most popular</span>' : ""}
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.description)}</p>
            <p class="guide-spec">Suitable for up to <strong>${esc(item.spec)}</strong></p>
          </article>
        `;
      })
      .join("");
  };

  const renderParts = () => {
    const { kits, controllers, shifters, accessories } = content.products;

    const kitsEl = document.querySelector("[data-parts-kits]");
    if (kitsEl) {
      kitsEl.innerHTML = kits.filter((item) => item.inCatalogue).map((item) => renderPartCard(item, "car")).join("");
    }

    const hardwareEl = document.querySelector("[data-parts-hardware]");
    if (hardwareEl) {
      hardwareEl.innerHTML = [...controllers, ...shifters]
        .filter((item) => item.inCatalogue)
        .map((item) => renderPartCard(item, null))
        .join("");
    }

    const accessoriesEl = document.querySelector("[data-parts-accessories]");
    if (accessoriesEl) {
      accessoriesEl.innerHTML = accessories
        .filter((item) => item.inCatalogue)
        .map((item) => renderPartCard(item, "accessory"))
        .join("");
    }
  };

  const renderOptionCard = (item, inputName, inputType, checked = false) => {
    const checkedAttr = checked ? " checked" : "";
    return `
      <label class="option-card">
        <input type="${inputType}" name="${inputName}" value="${esc(item.id)}"${checkedAttr} />
        <img src="${asset(item.image)}" alt="" />
        <span>
          <strong>${esc(item.configuratorTitle || item.name)}</strong>
          <small>${esc(item.configuratorSubtitle || item.name)}</small>
        </span>
      </label>
    `;
  };

  const renderConfigurator = () => {
    const { kits, controllers, shifters, accessories } = content.products;
    const configKits = kits.filter((item) => item.inConfigurator);
    const configControllers = controllers.filter((item) => item.inConfigurator);
    const configShifters = shifters.filter((item) => item.inConfigurator);
    const configAccessories = accessories.filter((item) => item.inConfigurator);

    const carGrid = document.querySelector("[data-config-cars]");
    if (carGrid) {
      carGrid.innerHTML = configKits.map((item) => renderOptionCard(item, "car", "radio")).join("");
    }

    const controllerGrid = document.querySelector("[data-config-controllers]");
    if (controllerGrid) {
      controllerGrid.innerHTML = configControllers
        .map((item, index) => renderOptionCard(item, "controller", "radio", index === 0))
        .join("");
    }

    const shifterGrid = document.querySelector("[data-config-shifters]");
    if (shifterGrid) {
      shifterGrid.innerHTML = configShifters.map((item) => renderOptionCard(item, "shifter", "radio")).join("");
    }

    const accessoryGrid = document.querySelector("[data-config-accessories]");
    if (accessoryGrid) {
      accessoryGrid.innerHTML = configAccessories
        .map(
          (item) => `
        <label class="accessory-card">
          <input type="checkbox" name="accessory" value="${esc(item.id)}" />
          <img src="${asset(item.image)}" alt="${esc(item.imageAlt || item.name)}" />
          <span>${esc(item.name)}</span>
        </label>
      `,
        )
        .join("");
    }

    const summaryImage = document.querySelector("[data-summary-image]");
    const defaultImage =
      configKits[0]?.image || configControllers[0]?.image || configShifters[0]?.image || content.settings.heroImage;
    if (summaryImage && defaultImage) {
      summaryImage.src = asset(defaultImage);
    }

    const summaryController = document.querySelector("[data-summary-controller]");
    if (summaryController && configControllers[0]) {
      summaryController.textContent = configControllers[0].configuratorLabel || configControllers[0].name;
    }
  };

  const renderContact = () => {
    const {
      leadEmail,
      phone,
      phoneLink,
      address,
      heroImage,
      footerIntro,
      hoursWeekdays,
      hoursSaturday,
      hoursSunday,
    } = content.settings;

    document.querySelectorAll("[data-contact-email]").forEach((el) => {
      el.textContent = leadEmail;
      if (el.tagName === "A") el.href = `mailto:${leadEmail}`;
    });

    document.querySelectorAll("[data-contact-phone]").forEach((el) => {
      el.textContent = phone;
      if (el.tagName === "A") el.href = `tel:${phoneLink}`;
    });

    document.querySelectorAll("[data-contact-address]").forEach((el) => {
      el.textContent = address;
    });

    document.querySelectorAll("[data-contact-footer-tagline]").forEach((el) => {
      const intro = footerIntro?.trim();
      const studioAddress = address?.trim();
      if (intro && studioAddress) el.textContent = `${intro} ${studioAddress}`;
      else el.textContent = studioAddress || intro || "";
    });

    document.querySelectorAll("[data-contact-hours-weekdays]").forEach((el) => {
      if (hoursWeekdays) el.textContent = hoursWeekdays;
    });

    document.querySelectorAll("[data-contact-hours-saturday]").forEach((el) => {
      if (hoursSaturday) el.textContent = hoursSaturday;
    });

    document.querySelectorAll("[data-contact-hours-sunday]").forEach((el) => {
      if (hoursSunday) el.textContent = hoursSunday;
    });

    const heroImg = document.querySelector("[data-hero-image]");
    if (heroImg && heroImage) {
      heroImg.src = asset(heroImage);
    }
  };

  const renderPromo = () => {
    const { promoTitle, promoDescription, discountCode } = content.settings;
    const titleEl = document.querySelector("[data-promo-title]");
    const descEl = document.querySelector("[data-promo-description]");
    const codeEl = document.querySelector("[data-promo-code]");
    if (titleEl && promoTitle) titleEl.textContent = promoTitle;
    if (descEl && promoDescription) descEl.textContent = promoDescription;
    if (codeEl && discountCode) codeEl.textContent = discountCode;
  };

  renderGuide();
  renderParts();
  renderConfigurator();
  renderContact();
  renderPromo();

  window.APP_CATALOG = buildCatalog();
  window.SITE_SETTINGS = content.settings;
})();
