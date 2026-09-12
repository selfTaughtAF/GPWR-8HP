(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const clone = (value) => JSON.parse(JSON.stringify(value));

  let content = clone(window.SITE_CONTENT || {});
  let activeProductTab = "kits";

  const slugify = (text) =>
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `item-${Date.now()}`;

  const uniqueId = (base, items) => {
    let id = base;
    let counter = 2;
    while (items.some((item) => item.id === id)) {
      id = `${base}-${counter}`;
      counter += 1;
    }
    return id;
  };

  const setStatus = (message, ok = false) => {
    const el = $("[data-admin-status]");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-ok", ok);
  };

  const getByPath = (obj, path) => path.split(".").reduce((acc, key) => acc?.[key], obj);

  const setByPath = (obj, path, value) => {
    const keys = path.split(".");
    const last = keys.pop();
    let current = obj;
    keys.forEach((key) => {
      if (!current[key]) current[key] = {};
      current = current[key];
    });
    current[last] = value;
  };

  const bindScalarFields = () => {
    $$("[data-bind]").forEach((field) => {
      const path = field.dataset.bind;
      const value = getByPath(content, path);

      if (field.type === "checkbox") {
        field.checked = Boolean(value);
        field.onchange = () => setByPath(content, path, field.checked);
        return;
      }

      field.value = value ?? "";
      field.oninput = () => setByPath(content, path, field.value);
    });
  };

  const renderGuideSelect = () => {
    const select = $("[data-bind='guide.mostPopularId']");
    if (!select || !content.guide?.items) return;

    select.innerHTML = content.guide.items
      .map((item) => `<option value="${item.id}">${item.title}</option>`)
      .join("");
    select.value = content.guide.mostPopularId;
    select.onchange = () => {
      content.guide.mostPopularId = select.value;
    };
  };

  const renderGuideItems = () => {
    const container = $("[data-guide-items]");
    if (!container) return;

    container.innerHTML = content.guide.items
      .map(
        (item, index) => `
      <div class="admin-guide-item" data-guide-index="${index}">
        <div class="admin-grid admin-grid-2">
          <div class="admin-field">
            <label>Gearbox name</label>
            <input type="text" data-guide-field="title" value="${escapeAttr(item.title)}" />
          </div>
          <div class="admin-field">
            <label>Torque rating (e.g. 750 Nm)</label>
            <input type="text" data-guide-field="spec" value="${escapeAttr(item.spec)}" />
          </div>
          <div class="admin-field" style="grid-column: 1 / -1;">
            <label>Description</label>
            <textarea data-guide-field="description">${escapeHtml(item.description)}</textarea>
          </div>
        </div>
      </div>
    `,
      )
      .join("");

    $$("[data-guide-index]", container).forEach((block) => {
      const index = Number(block.dataset.guideIndex);
      $$("[data-guide-field]", block).forEach((field) => {
        field.addEventListener("input", () => {
          content.guide.items[index][field.dataset.guideField] = field.value;
          if (field.dataset.guideField === "title") renderGuideSelect();
        });
      });
    });
  };

  const productCategories = [
    { key: "kits", label: "Vehicle kit", categoryLabel: "Domiworks kit", withConfiguratorLabels: true },
    { key: "controllers", label: "Controller", categoryLabel: "Controller", withConfiguratorLabels: true },
    { key: "shifters", label: "Shifter", categoryLabel: "Shifter", withConfiguratorLabels: true },
    { key: "accessories", label: "Accessory", categoryLabel: "Accessory", withConfiguratorLabels: false },
  ];

  const escapeHtml = (value) => {
    const el = document.createElement("span");
    el.textContent = value ?? "";
    return el.innerHTML;
  };

  const escapeAttr = (value) => escapeHtml(value).replace(/"/g, "&quot;");

  const renderProductFields = (item, category) => {
    const configuratorFields = category.withConfiguratorLabels
      ? `
        <div class="admin-field">
          <label>Configurator short label</label>
          <input type="text" data-product-field="configuratorTitle" value="${escapeAttr(item.configuratorTitle || item.name)}" />
        </div>
        <div class="admin-field">
          <label>Configurator subtitle</label>
          <input type="text" data-product-field="configuratorSubtitle" value="${escapeAttr(item.configuratorSubtitle || item.name)}" />
        </div>
        <div class="admin-field" style="grid-column: 1 / -1;">
          <label>Build sheet / summary name</label>
          <input type="text" data-product-field="configuratorLabel" value="${escapeAttr(item.configuratorLabel || item.name)}" />
        </div>
      `
      : "";

    return `
      <div class="admin-grid admin-grid-2">
        <div class="admin-field">
          <label>Product name</label>
          <input type="text" data-product-field="name" value="${escapeAttr(item.name)}" />
        </div>
        <div class="admin-field">
          <label>Photo filename</label>
          <input type="text" data-product-field="image" value="${escapeAttr(item.image)}" placeholder="my-product.jpg" />
          <small>Upload the photo to <code>assets/parts</code> in your GitHub Pages repo using this exact filename.</small>
        </div>
        <div class="admin-field" style="grid-column: 1 / -1;">
          <label>Description</label>
          <textarea data-product-field="description">${escapeHtml(item.description)}</textarea>
        </div>
        ${configuratorFields}
        <label class="admin-check">
          <input type="checkbox" data-product-field="inCatalogue" ${item.inCatalogue ? "checked" : ""} />
          Show in parts catalogue
        </label>
        <label class="admin-check">
          <input type="checkbox" data-product-field="inConfigurator" ${item.inConfigurator ? "checked" : ""} />
          Show in configurator
        </label>
      </div>
    `;
  };

  const renderProducts = () => {
    const panels = $("[data-product-panels]");
    if (!panels) return;

    panels.innerHTML = productCategories
      .map((category) => {
        const items = content.products[category.key] || [];
        const hidden = category.key === activeProductTab ? "" : " hidden";
        return `
          <div data-product-panel="${category.key}"${hidden}>
            ${items
              .map(
                (item, index) => `
              <div class="admin-product" data-product-category="${category.key}" data-product-index="${index}">
                <div class="admin-product-head">
                  <h3>${escapeHtml(item.name || "Untitled product")}</h3>
                  <button type="button" class="btn btn-outline btn-sm admin-danger" data-remove-product>Remove</button>
                </div>
                ${renderProductFields(item, category)}
              </div>
            `,
              )
              .join("")}
            <button type="button" class="btn btn-outline" data-add-product="${category.key}" style="margin-top: 1rem;">+ Add ${category.label.toLowerCase()}</button>
          </div>
        `;
      })
      .join("");

    $$("[data-product-panel]").forEach((panel) => {
      $$("[data-product-category]", panel).forEach((card) => {
        const categoryKey = card.dataset.productCategory;
        const index = Number(card.dataset.productIndex);
        const category = productCategories.find((entry) => entry.key === categoryKey);

        $$("[data-product-field]", card).forEach((field) => {
          const key = field.dataset.productField;
          field.addEventListener("input", () => {
            if (field.type === "checkbox") {
              content.products[categoryKey][index][key] = field.checked;
            } else {
              content.products[categoryKey][index][key] = field.value;
              if (key === "name") {
                $("[data-product-index='" + index + "'] h3", panel)?.replaceChildren(document.createTextNode(field.value || "Untitled product"));
              }
            }
          });
          field.addEventListener("change", () => {
            if (field.type === "checkbox") {
              content.products[categoryKey][index][key] = field.checked;
            }
          });
        });

        $("[data-remove-product]", card)?.addEventListener("click", () => {
          if (!confirm("Remove this product from the website?")) return;
          content.products[categoryKey].splice(index, 1);
          renderProducts();
        });
      });

      const addKey = panel.dataset.productPanel;
      $(`[data-add-product='${addKey}']`, panel)?.addEventListener("click", () => {
        const name = prompt(`Enter a name for the new ${addKey.slice(0, -1)}:`);
        if (!name) return;
        const id = uniqueId(slugify(name), content.products[addKey]);
        const categoryMeta = productCategories.find((entry) => entry.key === addKey);
        const base = {
          id,
          name,
          categoryLabel: categoryMeta?.categoryLabel || "Product",
          description: "",
          image: "placeholder.jpg",
          imageAlt: name,
          inCatalogue: true,
          inConfigurator: true,
        };
        if (addKey !== "accessories") {
          Object.assign(base, {
            configuratorTitle: name,
            configuratorSubtitle: name,
            configuratorLabel: name,
          });
        }
        content.products[addKey].push(base);
        activeProductTab = addKey;
        syncProductTabs();
        renderProducts();
      });
    });
  };

  const syncProductTabs = () => {
    $$("[data-product-tab]").forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.productTab === activeProductTab);
    });
    $$("[data-product-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.productPanel !== activeProductTab;
    });
  };

  const bindProductTabs = () => {
    $$("[data-product-tab]").forEach((tab) => {
      tab.onclick = () => {
        activeProductTab = tab.dataset.productTab;
        syncProductTabs();
      };
    });
  };

  const serializeContent = () => `window.SITE_CONTENT = ${JSON.stringify(content, null, 2)};\n`;

  const downloadSettings = () => {
    const blob = new Blob([serializeContent()], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "site-content.js";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Settings downloaded. Upload site-content.js to the js folder in your GitHub Pages repo to publish your changes.", true);
  };

  const loadSettingsFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        let parsed;
        if (file.name.endsWith(".json")) {
          parsed = JSON.parse(text);
        } else {
          const fn = new Function(`${text}; return window.SITE_CONTENT;`);
          parsed = fn();
        }
        if (!parsed?.settings || !parsed?.products || !parsed?.guide) {
          throw new Error("Invalid settings file");
        }
        content = clone(parsed);
        init();
        setStatus("Backup loaded. Review your settings, then save and upload.", true);
      } catch {
        setStatus("Could not read that file. Please choose a site-content.js backup from this website.");
      }
    };
    reader.readAsText(file);
  };

  const init = () => {
    content.settings = {
      footerIntro: "8HP swap parts, kits, and build consultations.",
      hoursWeekdays: "Mon–Fri 08:00–18:00",
      hoursSaturday: "Saturday by appointment",
      hoursSunday: "Sunday closed",
      siteGateEnabled: false,
      siteGatePassword: "",
      ...content.settings,
    };
    bindScalarFields();
    renderGuideSelect();
    renderGuideItems();
    syncProductTabs();
    renderProducts();
  };

  $$("[data-save-settings]").forEach((btn) => btn.addEventListener("click", downloadSettings));

  $("[data-load-file]")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) loadSettingsFile(file);
    event.target.value = "";
  });

  bindProductTabs();
  init();
})();
