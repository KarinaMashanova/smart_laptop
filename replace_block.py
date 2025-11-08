from pathlib import Path
path = Path('public/assets/scripts/app.js')
text = path.read_text(encoding='utf-8')
start = text.index('    errorBlock.textContent = "";')
end_marker = '\r\n    form.classList.add("hidden");'
end = text.index(end_marker, start)
new = """    errorBlock.textContent = "";

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
      alert("Не удалось отправить данные в Google Sheets, но колесо мы всё равно запустим.");
    }

    savePhones([...phones, data.phone]);

""".replace('\n', '\r\n')
text = text[:start] + new + text[end:]
path.write_text(text, encoding='utf-8')
