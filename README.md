# AppleHub Smart Start

AppleHub Smart Start — лендинг и accompanying Cloudflare Worker для обработки заявок на предзаказ и сервисные услуги Apple.

## Структура проекта

- `public/` — статический фронтенд
  - `index.html` — лендинг AppleHub с блоками предзаказа, сервисов, Finbox-рассрочки, каталога, колесом скидок и формой расширенной гарантии
  - `assets/styles/main.css` — основной стиль проекта
  - `assets/scripts/app.js` — клиентская логика (квиз, каталог, колесо скидок, отправка заявок)
  - `assets/data/catalog.json` — данные каталога аксессуаров и сервисов
  - `assets/images/` — изображения и логотипы витрины
- `applehub-proxy/` — Cloudflare Worker, который проксирует запросы к Google Apps Script и убирает ограничения CORS

## Основные возможности

- Квиз «Какой вы сегодня iPhone?» с рандомным подбором модели и мгновенным отображением результата
- Каталог аксессуаров и сервисов с фильтрацией по вкладкам без перезагрузки страницы
- Колесо скидок: сохраняет номера в `localStorage`, отправляет результаты в Google Sheets через Cloudflare Worker
- Форма AppleHub Care+ — отправляет заявки в отдельную таблицу (замените `YOUR_SCRIPT_ID` в `app.js` на ID вашего Google Apps Script)
- Поддержка Finbox-рассрочки через подключённый `finbox-create-order` скрипт

## Локальный запуск

Проект статический, поэтому достаточно поднять локальный http-сервер:

```bash
npx serve public
```

Либо используйте любой другой способ (Live Server, http-server и т.д.).

## Cloudflare Worker

В каталоге `applehub-proxy` расположен Worker, который проксирует запросы вида
`https://applehub-proxy.example.workers.dev/?u=https://script.google.com/...` на нужный Google Apps Script и возвращает корректные CORS-заголовки.

Основные команды (выполняйте из директории `applehub-proxy`):

```bash
npm install        # установка зависимостей
npm run dev        # запуск локально через Miniflare
npm test           # юнит-тесты (Vitest)
npm run deploy     # публикация Worker в Cloudflare
```

## Что настроить

1. В файле `public/assets/scripts/app.js` замените `YOUR_SCRIPT_ID` на реальный ID Google Apps Script для листа «Гарантии».
2. Убедитесь, что ваш Cloudflare Worker разрешает обращения с домена лендинга.
3. Проверьте наличие всех изображений в `assets/images` (hero, каталожные карточки, логотип).

После обновлений не забудьте прогнать ручной сценарий: квиз, фильтрация каталога, запуск колеса скидок, отправка формы AppleHub Care+.
