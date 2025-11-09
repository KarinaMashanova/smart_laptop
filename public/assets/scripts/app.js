(() => {
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const toggleHidden = (node, hide = true) => node?.classList.toggle("hidden", hide);

  const setCurrentYear = () => {
    qsa("#year").forEach((node) => (node.textContent = new Date().getFullYear().toString()));
  };

  // =========================
  // iPhone Quiz
  // =========================
  const initQuiz = () => {
    const button = qs("#iphoneQuizButton");
    const result = qs("#iphoneResult");
    const image = qs("#iphoneImage");
    const title = qs("#iphoneTitle");
    const text = qs("#iphoneText");
    if (!button || !result || !image || !title || !text) return;

    const variants = [
      {
        name: "iPhone 17",
        img: "assets/images/iphones/17.png",
        description: "Главная модель с Super Retina XDR 6,1\" и чипом A18 Bionic. Баланс автономности, камер и цены."
      },
      {
        name: "iPhone 17 Plus",
        img: "assets/images/iphones/17_plus.png",
        description: "6,7\" дисплей для фильмов и презентаций, мощность A18 Bionic и батарея на весь день."
      },
      {
        name: "iPhone 17 Pro",
        img: "assets/images/iphones/17_pro.png",
        description: "Титановый корпус, ProMotion 120 Гц и тройная камера с LiDAR. Лучший инструмент для съёмки."
      },
      {
        name: "iPhone 17 Pro Max",
        img: "assets/images/iphones/17_pro_max.png",
        description: "Самый большой 6,9\" экран, пятикратный зум и рекордная автономность для работы и контента."
      }
    ];

    button.addEventListener("click", () => {
      const choice = variants[Math.floor(Math.random() * variants.length)];
      image.src = choice.img;
      image.alt = `${choice.name} — рекомендация AppleHub`;
      title.textContent = choice.name;
      text.textContent = choice.description;
      result.classList.add("visible");
      button.textContent = "Подобрать ещё раз";
    });
  };

  // =========================
  // Catalog
  // =========================
  const initCatalog = () => {
    const grid = qs("#catalogGrid");
    const emptyState = qs("#catalogEmpty");
    const tabs = qsa(".tab");
    if (!grid || !emptyState || !tabs.length) return;

    let products = [];
    let filter = "all";

    const render = () => {
      grid.innerHTML = "";
      const filtered =
        filter === "all" ? products : products.filter((i) => i.category.toLowerCase() === filter.toLowerCase());
      if (!filtered.length) {
        emptyState.textContent = "По выбранной категории ничего не найдено. Попробуйте другой фильтр.";
        emptyState.classList.remove("hidden");
        return;
      }
      emptyState.classList.add("hidden");

      const fragment = document.createDocumentFragment();
      filtered.forEach((item) => {
        const card = document.createElement("article");
        card.className = "product-card";
        card.innerHTML = `
          <div class="product-card__media">
            <img src="${item.image}" alt="${item.title}">
          </div>
          <div class="product-card__body">
            <h3>${item.title}</h3>
            <p class="product-card__description">${item.description}</p>
            <span class="product-card__meta">${item.availability}</span>
          </div>
        `;
        fragment.appendChild(card);
      });
      grid.appendChild(fragment);
    };

    tabs.forEach((tab) =>
      tab.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.remove("tab--active"));
        tab.classList.add("tab--active");
        filter = tab.dataset.filter || "all";
        render();
      })
    );

    fetch("assets/data/catalog.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        products = Array.isArray(d) ? d : [];
        render();
      })
      .catch(() => {
        emptyState.textContent = "Не удалось загрузить каталог.";
        emptyState.classList.remove("hidden");
      });
  };

  // =========================
  // Warranty Form
  // =========================
  const initWarrantyForm = () => {
    const toggleButton = qs("#warrantyButton");
    const formWrapper = qs("#warrantyFormBlock");
    const form = qs("#warrantyForm");
    const alertNode = qs("#warrantyAlert");
    if (!toggleButton || !formWrapper || !form || !alertNode) return;

    const WARRANTY_WEBHOOK_URL =
      "https://applehub-proxy.masanovakarina82.workers.dev/?u=https://script.google.com/macros/s/AKfycbx6vAvkHAf6Qm7uKsCrDPdKCajAeZQhva6KOxLNdZEEmFileWBM3Sz_ridE43K3AV641w/exec";

    toggleButton.addEventListener("click", () => {
      const shouldShow = formWrapper.classList.contains("hidden");
      toggleHidden(formWrapper, !shouldShow);
      formWrapper.setAttribute("aria-hidden", (!shouldShow).toString());
      toggleButton.textContent = shouldShow ? "Скрыть форму" : "Заполнить заявку";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.warrantyName?.value.trim();
      const phone = form.warrantyPhone?.value.replace(/\D/g, "") ?? "";
      if (!name || phone.length < 10) {
        alert("Пожалуйста, заполните имя и телефон полностью.");
        return;
      }

      alertNode.textContent = "Отправляем...";
      alertNode.classList.remove("alert--error");
      alertNode.classList.remove("alert--success");
      toggleHidden(alertNode, false);

      try {
        const response = await fetch(WARRANTY_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "warranty",
            name,
            phone: "+" + phone,
            time: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        alertNode.classList.add("alert--success");
        alertNode.textContent = "Ваш страховой полис уже готовится!";
        form.reset();
      } catch (error) {
        console.error("Ошибка при отправке гарантии:", error);
        alertNode.classList.add("alert--error");
        alertNode.textContent = "Не удалось отправить заявку. Попробуйте позже.";
      }
    });
  };
  document.addEventListener("DOMContentLoaded", () => {
    setCurrentYear();
    initQuiz();
    initCatalog();
    initWarrantyForm();
  });
})();

// =========================
// Опрос + колесо бонусов
// =========================
function initSurveyForm() {
  const form = document.getElementById("surveyForm");
  if (!form) return;

  const wheelWrapper = document.getElementById("wheelWrapper");
  const wheel = document.getElementById("wheel");
  const discountResult = document.getElementById("discountResult");
  const qrBlock = document.querySelector(".qr-thanks");
  const button = form.querySelector("button");
  if (!wheelWrapper || !wheel || !discountResult || !button) return;

  const SHEETS_URL =
    "https://applehub-proxy.masanovakarina82.workers.dev/?u=https://script.google.com/macros/s/AKfycbx9y2i4SaES1aQlUZy59TeAOPHR0JS74O_l-NeHrgPYhyAc6FTrDj4tr2r2JnsN4anw8w/exec";

  const DISCOUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const SLICE_ANGLE = 360 / DISCOUNTS.length;
  const BASE_SPINS = 5;
  const SPIN_DURATION = 3.8;
  const STORAGE_KEY = "applehub-discount-phones";

  const readPhones = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    } catch {
      return [];
    }
  };

  const savePhones = (phones) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(phones));
    } catch {}
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.phone = (data.phone || "").replace(/\D/g, "");

    const phones = readPhones();
    const phoneInput = form.querySelector('input[name="phone"]');
    const errorBlock = phoneInput.nextElementSibling?.classList.contains("error-message")
      ? phoneInput.nextElementSibling
      : (() => {
          const span = document.createElement("div");
          span.className = "error-message";
          phoneInput.insertAdjacentElement("afterend", span);
          return span;
        })();

    errorBlock.textContent = "";

    if (phones.includes(data.phone)) {
      phoneInput.classList.add("error");
      errorBlock.textContent = "Этот номер уже участвовал в розыгрыше.";
      return;
    }

    if (data.phone.length < 10) {
      phoneInput.classList.add("error");
      errorBlock.textContent = "Пожалуйста, укажите номер телефона полностью.";
      return;
    }

    phoneInput.classList.remove("error");
    errorBlock.textContent = "";

    button.disabled = true;
    button.textContent = "Отправляем...";
    const payload = { type: "survey", ...data };

    let requestOk = true;
    try {
      const response = await fetch(SHEETS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const textResponse = await response.text();
      console.log("RAW ответ сервера:", textResponse);
      const parsed = JSON.parse(textResponse);
      if (parsed?.status !== "ok") {
        requestOk = false;
      }
    } catch (error) {
      requestOk = false;
      console.error("Ошибка при отправке анкеты:", error);
    }

    button.textContent = "Запустить колесо";
    button.disabled = false;

    if (!requestOk) {
      alert("Не удалось отправить данные в Google Sheets, но колесо всё равно запустим.");
    }

    savePhones([...phones, data.phone]);

    form.classList.add("hidden");
    wheelWrapper.classList.remove("hidden");
    discountResult.classList.remove("show");
    discountResult.textContent = "";
    qrBlock?.classList.remove("show");
    qrBlock?.classList.add("hidden");

    const selected = Math.floor(Math.random() * DISCOUNTS.length);
    const finalRotation = BASE_SPINS * 360 + (360 - (selected * SLICE_ANGLE + SLICE_ANGLE / 2));


    wheel.style.setProperty("--spin-duration", `${SPIN_DURATION}s`);
    wheel.classList.remove("is-spinning");
    void wheel.offsetWidth;

    requestAnimationFrame(() => {
      wheel.classList.add("is-spinning");
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    });

    const handleSpinEnd = async () => {
      wheel.classList.remove("is-spinning");
      const discount = `${DISCOUNTS[selected]}%`;
      discountResult.textContent = `Ваша скидка — ${discount}`;
      discountResult.classList.add("show");

      setTimeout(() => {
        qrBlock?.classList.remove("hidden");
        qrBlock?.classList.add("show");
      }, 600);

      if (!requestOk) return;

      try {
        await fetch(SHEETS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "discount",
            name: data.name,
            phone: "+" + data.phone,
            discount,
            time: new Date().toISOString()
          })
        });
      } catch (error) {
        console.warn("Не удалось записать скидку:", error);
      }
    };

    wheel.addEventListener("transitionend", handleSpinEnd, { once: true });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSurveyForm();
});
