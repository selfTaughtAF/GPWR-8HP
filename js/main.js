const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const settings = window.SITE_SETTINGS || window.SITE_CONTENT?.settings || {};
const SITE_CONFIG = {
  LEAD_EMAIL: settings.leadEmail || "studio@gaijinpower.co.uk",
  DISCOUNT_CODE: settings.discountCode || "SAKURA8HP",
  DISCOUNT_PERCENT: settings.discountPercent || "10",
  PROMO_DELAY_MS: settings.promoDelayMs ?? 2200,
  PROMO_ENABLED: settings.promoEnabled !== false,
};

const LEAD_EMAIL = SITE_CONFIG.LEAD_EMAIL;
const catalog = window.APP_CATALOG || { car: {}, controller: {}, shifter: {}, accessory: {} };

const SITE_GATE_STORAGE = "gp-site-unlocked";

const isSiteGateActive = () => document.documentElement.classList.contains("site-gate-active");

let schedulePromoIfNeeded = () => {};

const unlockSiteGate = () => {
  sessionStorage.setItem(SITE_GATE_STORAGE, "1");
  document.documentElement.classList.remove("site-gate-active");
  const gate = $("[data-site-gate]");
  if (gate) gate.hidden = true;
  document.body.classList.remove("site-gate-locked");
  schedulePromoIfNeeded();
};

const initSiteGate = () => {
  const gateSettings = window.SITE_CONTENT?.settings || {};
  const gatePassword = String(gateSettings.siteGatePassword || "").trim();
  const gateEnabled = Boolean(gateSettings.siteGateEnabled && gatePassword);
  const gate = $("[data-site-gate]");
  const gateForm = $("[data-site-gate-form]");
  const gateInput = $("[data-site-gate-password]");
  const gateStatus = $("[data-site-gate-status]");

  if (!gateEnabled) {
    document.documentElement.classList.remove("site-gate-active");
    if (gate) gate.hidden = true;
    return;
  }

  if (sessionStorage.getItem(SITE_GATE_STORAGE) === "1") {
    unlockSiteGate();
    return;
  }

  document.documentElement.classList.add("site-gate-active");
  document.body.classList.add("site-gate-locked");
  if (gate) gate.hidden = false;

  gateForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const attempt = gateInput?.value.trim() || "";
    if (attempt === gatePassword) {
      unlockSiteGate();
      if (gateStatus) gateStatus.textContent = "";
      return;
    }

    if (gateStatus) gateStatus.textContent = "Incorrect password. Please try again.";
    if (gateInput) {
      gateInput.value = "";
      gateInput.focus();
    }
  });

  if (gateInput && window.matchMedia("(pointer: fine)").matches) {
    gateInput.focus();
  }
};

const defaultControllerId = () => Object.keys(catalog.controller)[0] || "";

const header = $("[data-header]");
const menuToggle = $("[data-menu-toggle]");
const mobileNav = $("[data-mobile-nav]");
const progress = $(".scroll-progress");
const year = $("[data-year]");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const closeMenu = () => {
  if (!mobileNav || !menuToggle) return;
  mobileNav.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
};

menuToggle?.addEventListener("click", () => {
  const open = mobileNav.hidden;
  mobileNav.hidden = !open;
  menuToggle.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
});

const scrollToHash = (hash) => {
  const target = hash && hash !== "#" ? document.querySelector(hash) : null;
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
};

$$("[data-nav] a, [data-mobile-nav] a, .logo, .hero-cta a, .header-actions a[href^='#'], .part-body a[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    event.preventDefault();
    closeMenu();
    requestAnimationFrame(() => {
      scrollToHash(href);
      history.pushState(null, "", href);
    });
  });
});

const onScroll = () => {
  const scrolled = window.scrollY;
  header?.classList.toggle("is-scrolled", scrolled > 8);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress && max > 0) {
    progress.style.width = `${(scrolled / max) * 100}%`;
  }

  const sections = $$("main section[id]");
  const current = [...sections].reverse().find((section) => scrolled + 110 >= section.offsetTop);
  $$("[data-nav] a").forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("is-active", Boolean(current && href === `#${current.id}`));
  });
};

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const configurator = $("[data-configurator]");
const configModal = $("[data-config-modal]");
const configForm = $("[data-config-form]");
const configStatus = $("[data-config-status]");
let currentStep = 1;
const totalSteps = 4;

const getConfiguratorData = () => {
  const car = configurator?.querySelector('input[name="car"]:checked')?.value || "";
  const controller = configurator?.querySelector('input[name="controller"]:checked')?.value || defaultControllerId();
  const shifter = configurator?.querySelector('input[name="shifter"]:checked')?.value || "";
  const accessories = $$('input[name="accessory"]:checked', configurator || document).map((el) => el.value);
  return { car, controller, shifter, accessories };
};

const updateSummary = () => {
  const data = getConfiguratorData();
  const summaryCar = $("[data-summary-car]");
  const summaryController = $("[data-summary-controller]");
  const summaryShifter = $("[data-summary-shifter]");
  const summaryAccessories = $("[data-summary-accessories]");
  const summaryImage = $("[data-summary-image]");

  if (summaryCar) {
    summaryCar.textContent = data.car ? catalog.car[data.car].label : "Not selected";
  }
  if (summaryController) {
    summaryController.textContent = catalog.controller[data.controller]?.label || "Not selected";
  }
  if (summaryShifter) {
    summaryShifter.textContent = data.shifter ? catalog.shifter[data.shifter].label : "Not selected";
  }
  if (summaryAccessories) {
    summaryAccessories.textContent = data.accessories.length
      ? data.accessories.map((key) => catalog.accessory[key]).join(", ")
      : "None";
  }
  if (summaryImage) {
    const preview =
      (data.car && catalog.car[data.car]?.image) ||
      (data.shifter && catalog.shifter[data.shifter]?.image) ||
      Object.values(catalog.controller)[0]?.image;
    summaryImage.src = preview;
    summaryImage.alt = "Selected configuration preview";
  }
};

const setStep = (step, { scroll = true } = {}) => {
  currentStep = step;
  $$("[data-panel]", configurator).forEach((panel) => {
    panel.classList.toggle("is-active", Number(panel.dataset.panel) === step);
  });
  $$("[data-step-jump]", configurator).forEach((btn) => {
    const itemStep = Number(btn.dataset.stepJump);
    btn.classList.toggle("is-active", itemStep === step);
    btn.classList.toggle("is-done", itemStep < step);
    btn.setAttribute("aria-selected", String(itemStep === step));
  });

  const backBtn = $("[data-config-back]");
  const nextBtn = $("[data-config-next]");
  if (backBtn) backBtn.hidden = step === 1;
  if (nextBtn) nextBtn.textContent = step === totalSteps ? "Review complete" : "Next step";

  const panel = configurator?.querySelector(`[data-panel="${step}"]`);
  if (scroll && panel && window.matchMedia("(max-width: 979px)").matches) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

$$("[data-step-jump]", configurator).forEach((btn) => {
  btn.addEventListener("click", () => {
    setStep(Number(btn.dataset.stepJump));
  });
});

const validateStep = (step) => {
  const data = getConfiguratorData();
  if (step === 1 && !data.car) {
    alert("Please select a vehicle kit.");
    return false;
  }
  if (step === 3 && !data.shifter) {
    alert("Please select a shifter.");
    return false;
  }
  return true;
};

const openConfigModal = () => {
  const data = getConfiguratorData();
  if (!data.car) {
    alert("Please select a vehicle kit before requesting a build sheet.");
    setStep(1);
    return;
  }
  if (!data.shifter) {
    alert("Please select a shifter before requesting a build sheet.");
    setStep(3);
    return;
  }

  const summaryBlock = $("[data-config-modal-summary]");
  const modalCar = $("[data-config-modal-car]");
  const modalController = $("[data-config-modal-controller]");
  const modalShifter = $("[data-config-modal-shifter]");
  const modalAccessories = $("[data-config-modal-accessories]");

  if (modalCar) modalCar.textContent = catalog.car[data.car].label;
  if (modalController) modalController.textContent = catalog.controller[data.controller]?.label || "Not selected";
  if (modalShifter) modalShifter.textContent = catalog.shifter[data.shifter].label;
  if (modalAccessories) {
    modalAccessories.textContent = data.accessories.length
      ? data.accessories.map((key) => catalog.accessory[key]).join(", ")
      : "None";
  }
  if (summaryBlock) summaryBlock.hidden = false;

  const statusEl = $("[data-config-status]");
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.classList.remove("is-ok");
  }

  if (!configModal) return;
  configModal.hidden = false;
  document.body.classList.add("menu-open");

  const nameField = $("#config-name");
  if (nameField && window.matchMedia("(pointer: fine)").matches) {
    nameField.focus();
  }
};

const closeConfigModal = () => {
  if (!configModal) return;
  configModal.hidden = true;
  document.body.classList.remove("menu-open");
};

$("[data-config-next]")?.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;
  if (currentStep < totalSteps) {
    setStep(currentStep + 1);
  } else {
    scrollToHash("#configurator");
    openConfigModal();
  }
});

$("[data-config-back]")?.addEventListener("click", () => {
  if (currentStep > 1) setStep(currentStep - 1);
});

configurator?.addEventListener("change", updateSummary);

$$("[data-preset-car]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const value = link.dataset.presetCar;
    const input = configurator?.querySelector(`input[name="car"][value="${value}"]`);
    if (input) {
      input.checked = true;
      updateSummary();
      setStep(1);
      scrollToHash("#configurator");
    }
  });
});

$$("[data-preset-accessory]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const value = link.dataset.presetAccessory;
    const input = configurator?.querySelector(`input[name="accessory"][value="${value}"]`);
    if (input) {
      input.checked = true;
      updateSummary();
      setStep(4);
      scrollToHash("#configurator");
    }
  });
});

const buildBuildSheetBody = (contact) => {
  const data = getConfiguratorData();
  const accessories = data.accessories.length
    ? data.accessories.map((key) => `- ${catalog.accessory[key]}`).join("\n")
    : "- None";

  return [
    "8HP Kit Build Sheet Request",
    "",
    "Contact details:",
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone}`,
    "",
    "Notes:",
    contact.notes || "None",
    "",
    "Build sheet:",
    `Vehicle kit: ${catalog.car[data.car].label}`,
    `Controller: ${catalog.controller[data.controller].label}`,
    `Shifter: ${catalog.shifter[data.shifter].label}`,
    "Accessories:",
    accessories,
    "",
    "Please reply with pricing, availability, and lead times.",
    "",
    "Sent from gaijinpower.co.uk configurator",
  ].join("\n");
};

const openEmail = ({ subject, body, replyTo }) => {
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  if (replyTo) params.set("cc", replyTo);
  window.location.href = `mailto:${LEAD_EMAIL}?${params.toString()}`;
};

const setFieldState = (field, valid) => {
  field.classList.toggle("is-invalid", !valid);
};

$$("[data-config-open]").forEach((btn) => {
  btn.addEventListener("click", openConfigModal);
});

$$("[data-config-close]").forEach((el) => {
  el.addEventListener("click", closeConfigModal);
});

configForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const configData = getConfiguratorData();
  if (!configData.car || !configData.shifter) {
    closeConfigModal();
    openConfigModal();
    return;
  }

  const required = [...configForm.querySelectorAll("[required]")];
  let ok = true;
  required.forEach((field) => {
    const valid = field.checkValidity();
    setFieldState(field, valid);
    ok = ok && valid;
  });
  if (!ok) {
    if (configStatus) {
      configStatus.textContent = "Please complete the required fields.";
      configStatus.classList.remove("is-ok");
    }
    return;
  }

  const formData = new FormData(configForm);
  const contact = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
  };

  openEmail({
    subject: `8HP Build Sheet — ${contact.name}`,
    body: buildBuildSheetBody(contact),
    replyTo: contact.email,
  });

  if (configStatus) {
    configStatus.textContent = "Opening your email app — send the message to submit your build sheet.";
    configStatus.classList.add("is-ok");
  }

  configForm.reset();
  required.forEach((field) => setFieldState(field, true));
});

$$("input, textarea", configForm).forEach((field) => {
  field.addEventListener("input", () => {
    if (field.classList.contains("is-invalid")) {
      setFieldState(field, field.checkValidity());
    }
  });
});

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if (!window.location.hash) {
  window.scrollTo(0, 0);
}

updateSummary();
setStep(1, { scroll: false });

const handleLeadForm = (form, statusEl, buildPayload) => {
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const required = [...form.querySelectorAll("[required]")];
    let ok = true;
    required.forEach((field) => {
      const valid = field.checkValidity();
      setFieldState(field, valid);
      ok = ok && valid;
    });
    if (!ok) {
      if (statusEl) {
        statusEl.textContent = "Please complete the required fields.";
        statusEl.classList.remove("is-ok");
      }
      return;
    }

    const payload = buildPayload(new FormData(form));
    openEmail(payload);

    if (statusEl) {
      statusEl.textContent = "Opening your email app with the request pre-filled. Send the message to reach us.";
      statusEl.classList.add("is-ok");
    }
    form.reset();
    required.forEach((field) => setFieldState(field, true));
  });

  $$("input, textarea", form).forEach((field) => {
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) {
        setFieldState(field, field.checkValidity());
      }
    });
  });
};

handleLeadForm($("[data-consult-form]"), $("[data-consult-status]"), (data) => {
  const body = [
    "Build Consultation Request",
    "",
    `Name: ${data.get("name")}`,
    `Email: ${data.get("email")}`,
    `Phone: ${data.get("phone")}`,
    `Vehicle: ${data.get("vehicle")}`,
    `Power target & use: ${data.get("power")}`,
    "",
    "Notes:",
    data.get("notes") || "None",
    "",
    "Sent from gaijinpower.co.uk",
  ].join("\n");

  return {
    subject: `Build Consultation — ${data.get("vehicle")}`,
    body,
    replyTo: data.get("email"),
  };
});

handleLeadForm($("[data-contact-form]"), $("[data-contact-status]"), (data) => {
  const body = [
    "General Enquiry",
    "",
    `Name: ${data.get("name")}`,
    `Email: ${data.get("email")}`,
    `Phone: ${data.get("phone")}`,
    "",
    "Message:",
    data.get("message"),
    "",
    "Sent from gaijinpower.co.uk",
  ].join("\n");

  return {
    subject: `Website Enquiry — ${data.get("name")}`,
    body,
    replyTo: data.get("email"),
  };
});

const PROMO_STORAGE = {
  dismissed: "gp-promo-dismissed",
  subscribed: "gp-promo-subscribed",
};

const promoModal = $("[data-promo-modal]");
const promoOffer = $("[data-promo-offer]");
const promoSuccess = $("[data-promo-success]");
const promoForm = $("[data-promo-form]");
const promoStatus = $("[data-promo-status]");
const promoCodeEl = $("[data-promo-code]");
const blossomLayer = $("[data-blossom-layer]");
let blossomsSpawned = false;

if (promoCodeEl) {
  promoCodeEl.textContent = SITE_CONFIG.DISCOUNT_CODE;
}

const spawnBlossomsOnce = () => {
  if (blossomsSpawned || !blossomLayer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  blossomsSpawned = true;
  blossomLayer.innerHTML = "";

  const petalCount = 28;
  for (let i = 0; i < petalCount; i += 1) {
    const petal = document.createElement("span");
    petal.className = "blossom-petal";
    petal.style.setProperty("--fall-left", `${Math.random() * 100}%`);
    petal.style.setProperty("--fall-delay", `${Math.random() * 0.8}s`);
    petal.style.setProperty("--fall-duration", `${3.8 + Math.random() * 2.4}s`);
    petal.style.setProperty("--fall-drift", `${-40 + Math.random() * 80}px`);
    petal.style.width = `${10 + Math.random() * 8}px`;
    petal.style.height = `${10 + Math.random() * 8}px`;
    blossomLayer.appendChild(petal);
  }

  window.setTimeout(() => {
    blossomLayer.innerHTML = "";
  }, 6500);
};

const openPromo = ({ withBlossoms = true } = {}) => {
  if (!promoModal) return;
  promoModal.hidden = false;
  document.body.classList.add("menu-open");
  if (withBlossoms) spawnBlossomsOnce();
};

const closePromo = (rememberDismiss = true) => {
  if (!promoModal) return;
  promoModal.hidden = true;
  document.body.classList.remove("menu-open");
  if (rememberDismiss && !localStorage.getItem(PROMO_STORAGE.subscribed)) {
    localStorage.setItem(PROMO_STORAGE.dismissed, "1");
  }
};

const shouldAutoShowPromo = () =>
  SITE_CONFIG.PROMO_ENABLED &&
  !localStorage.getItem(PROMO_STORAGE.dismissed) &&
  !localStorage.getItem(PROMO_STORAGE.subscribed);

schedulePromoIfNeeded = () => {
  if (!shouldAutoShowPromo() || isSiteGateActive()) return;
  window.setTimeout(() => {
    if (!isSiteGateActive()) openPromo({ withBlossoms: true });
  }, SITE_CONFIG.PROMO_DELAY_MS);
};

initSiteGate();
schedulePromoIfNeeded();

$$("[data-promo-close]").forEach((el) => {
  el.addEventListener("click", () => closePromo(true));
});

$$("[data-promo-open]").forEach((el) => {
  el.addEventListener("click", () => {
    blossomsSpawned = false;
    if (promoOffer) promoOffer.hidden = false;
    if (promoSuccess) promoSuccess.hidden = true;
    if (promoStatus) promoStatus.textContent = "";
    openPromo({ withBlossoms: true });
  });
});

promoForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = $("#promo-email");
  if (!emailInput?.checkValidity()) {
    emailInput.classList.add("is-invalid");
    if (promoStatus) promoStatus.textContent = "Enter a valid email address.";
    return;
  }

  emailInput.classList.remove("is-invalid");
  const email = emailInput.value.trim();
  const body = [
    "Mailing List Signup",
    "",
    `Email: ${email}`,
    `Discount code issued: ${SITE_CONFIG.DISCOUNT_CODE} (${SITE_CONFIG.DISCOUNT_PERCENT}% off first order)`,
    "",
    "Please add this address to the mailing list.",
    "",
    "Sent from gaijinpower.co.uk promo popup",
  ].join("\n");

  openEmail({
    subject: `Mailing List Signup — ${email}`,
    body,
    replyTo: email,
  });

  localStorage.setItem(PROMO_STORAGE.subscribed, "1");
  localStorage.removeItem(PROMO_STORAGE.dismissed);

  if (promoOffer) promoOffer.hidden = true;
  if (promoSuccess) promoSuccess.hidden = false;
  if (promoStatus) {
    promoStatus.textContent = "Opening your email app — send the message to complete signup.";
  }
});
