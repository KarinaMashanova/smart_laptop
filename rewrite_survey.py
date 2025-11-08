from pathlib import Path
path = Path('public/assets/scripts/app.js')
text = path.read_text(encoding='utf-8')
start = text.index('function initSurveyForm() {')
end = text.index('\n\ndocument.addEventListener', start)
new_func = """function initSurveyForm() {
  const form = document.getElementById(\"surveyForm\");
  if (!form) return;

  const wheelWrapper = document.getElementById(\"wheelWrapper\");
  const wheel = document.getElementById(\"wheel\");
  const discountResult = document.getElementById(\"discountResult\");
  const qrBlock = document.querySelector(\".qr-thanks\");
  const button = form.querySelector(\"button\");
  if (!wheelWrapper || !wheel || !discountResult || !button) return;

  const SHEETS_URL =
    \"https://applehub-proxy.masanovakarina82.workers.dev/?u=https://script.google.com/macros/s/AKfycbx9y2i4SaES1aQlUZy59TeAOPHR0JS74O_l-NeHrgPYhyAc6FTrDj4tr2r2JnsN4anw8w/exec\";

  const DISCOUNTS = [3, 5, 7, 10, 12, 15];
  const SLICE_ANGLE = 360 / DISCOUNTS.length;
  const BASE_SPINS = 5;
  const SPIN_DURATION = 3.8;
  const STORAGE_KEY = \"applehub-discount-phones\";

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

  form.addEventListener(\"submit\", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.phone = (data.phone || \"\").replace(/\\D/g, \"\");

    const phones = readPhones();
    const phoneInput = form.querySelector('input[name=\"phone\"]');
    const errorBlock = phoneInput.nextElementSibling?.classList.contains(\"error-message\")
      ? phoneInput.nextElementSibling
      : (() => {
          const span = document.createElement(\"div\");
          span.className = \"error-message\";
          phoneInput.insertAdjacentElement(\"afterend\", span);
          return span;
        })();

    errorBlock.textContent = \"\";

    if (phones.includes(data.phone)) {
      phoneInput.classList.add(\"error\");
      errorBlock.textContent = \"Этот номер уже участвовал в розыгрыше.\";
      return;
    }

    if (data.phone.length < 10) {
      phoneInput.classList.add(\"error\");
      errorBlock.textContent = \"Пожалуйста, укажите номер телефона полностью.\";
      return;
    }

    phoneInput.classList.remove(\"error\");
    errorBlock.textContent = \"\";

    button.disabled = true;
    button.textContent = \"Отправляем...\";
    const payload = { type: \"survey\", ...data };

    let requestOk = true;
    try {
      const response = await fetch(SHEETS_URL, {
        method: \"POST\",
        headers: { \"Content-Type\": \"application/json\" },
        body: JSON.stringify(payload)
      });
      const textResponse = await response.text();
      console.log(\"RAW ответ сервера:\", textResponse);
      const parsed = JSON.parse(textResponse);
      if (parsed?.status !== \"ok\") {
        requestOk = false;
      }
    } catch (error) {
      requestOk = false;
      console.error(\"Ошибка при отправке анкеты:\", error);
    }

    button.textContent = \"Запустить колесо\";
    button.disabled = false;

    if (!requestOk) {
      alert(\"Не удалось отправить данные в Google Sheets, но колесо всё равно запустим.\");
    }

    savePhones([...phones, data.phone]);

    form.classList.add(\"hidden\");
    wheelWrapper.classList.remove(\"hidden\");
    discountResult.classList.remove(\"show\");
    discountResult.textContent = \"\";
    qrBlock?.classList.remove(\"show\");
    qrBlock?.classList.add(\"hidden\");

    const selected = Math.floor(Math.random() * DISCOUNTS.length);
    const finalRotation = BASE_SPINS * 360 + selected * SLICE_ANGLE + SLICE_ANGLE / 2;

    wheel.style.setProperty(\"--spin-duration\", `${SPIN_DURATION}s`);
    wheel.classList.remove(\"is-spinning\");
    void wheel.offsetWidth;

    requestAnimationFrame(() => {
      wheel.classList.add(\"is-spinning\");
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    });

    const handleSpinEnd = async () => {
      wheel.classList.remove(\"is-spinning\");
      const discount = `${DISCOUNTS[selected]}%`;
      discountResult.textContent = `Ваша скидка — ${discount}`;
      discountResult.classList.add(\"show\");

      setTimeout(() => {
        qrBlock?.classList.remove(\"hidden\");
        qrBlock?.classList.add(\"show\");
      }, 600);

      if (!requestOk) return;

      try {
        await fetch(SHEETS_URL, {
          method: \"POST\",
          headers: { \"Content-Type\": \"application/json\" },
          body: JSON.stringify({
            type: \"discount\",
            name: data.name,
            phone: \"+\" + data.phone,
            discount,
            time: new Date().toISOString()
          })
        });
      } catch (error) {
        console.warn(\"Не удалось записать скидку:\", error);
      }
    };

    wheel.addEventListener(\"transitionend\", handleSpinEnd, { once: true });
  });
}
"""
new_func = new_func.replace('\n', '\r\n')
text = text[:start] + new_func + text[end:]
path.write_text(text, encoding='utf-8')
