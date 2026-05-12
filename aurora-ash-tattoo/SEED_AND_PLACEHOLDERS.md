# Запуск сайта и замена плейсхолдеров

Сайт полностью наполнен контентом — пять артистов, 26 работ, 12 стилей,
семь статических страниц (`home`, `about`, `aftercare`, `faq`, `privacy`,
`terms`, `accessibility`, `contact`), параллакс-секции, image-feature,
аккордеоны и artist-grid. Все картинки — атмосферные SVG/JPG-плейсхолдеры
в стиле «золото на угле», которые легко заменить на реальные фотографии.

---

## 1. Запуск с нуля

```powershell
cd C:\Users\dark\Desktop\Aurora_and_Ash\aurora-ash-tattoo
npm install        # установит зависимости + бинарники sharp и next-swc для Windows
npm run dev        # запускает Next.js на http://localhost:3000
```

В отдельной вкладке, как только dev-сервер поднимется:

```
http://localhost:3000/api/seed
```

Эта одна ручка делает всё:

1. Генерирует плейсхолдер-картинки в `public/seed-images/` (если их там ещё нет).
2. Создаёт стили, артистов, работы, sample-inquiries.
3. Загружает media в коллекцию Payload и привязывает их к артистам/работам.
4. Собирает все семь страниц из блоков Payload (`hero`, `content`, `parallax`,
   `imageFeature`, `accordion`, `artistGrid`) и публикует.

Можно вызывать сколько угодно раз — повторный запуск:
* обновляет блочный состав страниц до канонического (если ты что-то редактировал
  в админке, перезатрёт — это by design, чтобы seed был источником правды);
* пропускает уже существующие стили/артистов/работы;
* не трогает уже заполненные изображения у артистов/работ;
* не трогает уже заполненные поля `siteSettings`.

После seed зайди в админку — `http://localhost:3000/admin` — создай первого
пользователя-админа и проверь страницы.

---

## 2. Структура плейсхолдеров

Все плейсхолдеры лежат в `public/seed-images/`. Имена файлов значимы — при
повторном запуске seed ищет файл с тем же именем и подставляет его в нужный
блок. То есть **заменяй файлы in-place, имена не меняй**.

### Hero / Studio
| Файл | Где используется | Соотношение |
|---|---|---|
| `studio_hero.png` | Hero на главной + `siteSettings.heroImage` + hero на `/contact` | 16:9 (2000×1125) |
| `studio_philosophy.png` | Hero на `/about` | 4:5 (1200×1500) |
| `og_image.png` | Open Graph share preview | 1200×630 |

### Parallax-секции
| Файл | Где используется |
|---|---|
| `parallax_studio.jpg` | Главная, `/about` — "A private gallery for permanent art" |
| `parallax_craft.jpg` | Главная — "Craft. Lineage. Longevity." |
| `parallax_cta.jpg` | Главная, `/about`, `/aftercare`, `/faq` — финальный CTA |
| `parallax_aftercare.jpg` | Hero на `/aftercare` |
| `parallax_contact.jpg` | `/contact` — финальный CTA |

### Image-feature блоки
| Файл | Где используется |
|---|---|
| `feature_room.jpg` | Главная + `/about` — full-width фото зала |
| `feature_work.jpg` | Главная — content-width «selected work» |
| `feature_aftercare.jpg` | `/aftercare` — content-width «healed at 6 months» |
| `feature_map.jpg` | `/contact` — карта/локация |

### Портреты артистов
| Файл | Слот |
|---|---|
| `marcus_portrait.jpg`, `marcus_cover.png` | Marcus Reyes |
| `elena_portrait.jpg`, `elena_cover.png` | Elena Voss |
| `kai_portrait.jpg`, `kai_cover.png` | Kai Nakamura |
| `riley_portrait.jpg`, `riley_cover.png` | Riley O'Brien |
| `sofia_portrait.jpg`, `sofia_cover.png` | Sofia Mendez |

Portrait — 4:5 (1200×1500), cover — 16:9 (2000×1125).

### Работы (gallery)
Имена вида `{artistLastName}_{work-slug}.jpg`. Полный список — в
`scripts/seed-media-runner.ts`, массив `WORK_IMAGES`. По одной картинке на
работу; квадрат (1500×1500). Если нужно несколько ракурсов одной работы —
дозагрузи их через админку.

---

## 3. Как заменить плейсхолдер

Есть два способа:

### Способ А — через файлы (быстро, для bulk-замены)

1. Положи реальную фотографию в `public/seed-images/` с тем же именем, что
   у плейсхолдера. Размер не критичен (Payload автоматически нарежет
   thumbnail / card / feature / hero), но желательно держать соотношение
   сторон такое же или похожее.
2. Удали соответствующую запись из коллекции `Media` в админке
   (`/admin/collections/media`). Это снимет привязку.
3. Дёрни ещё раз `http://localhost:3000/api/seed`. Файл загрузится заново,
   и блок на сайте подхватит новую картинку.

### Способ Б — прямо через админку (для одиночной замены)

1. Зайди в админку → `Library / Media library` → найди плейсхолдер по имени
   (например `parallax_studio.jpg`).
2. Открой запись и нажми «Replace file» — выбери новый файл.
3. На фронте картинка обновится без повторного запуска seed.

---

## 4. Что заполнено в админке после seed

* `Catalog / Tattoo styles` — 12 стилей (Fine Line, Blackwork, Neo-Traditional,
  Japanese, Geometric, и т.д.) с описаниями.
* `Content / Artists` — 5 артистов, каждый с короткой и длинной биографией,
  ролью, связями со стилями, соцсетями и статусом записи.
* `Content / Works` — 26 работ, привязанных к артистам, со стилями,
  размещением, размером, годом и описанием.
* `Content / Pages` — 8 страниц (`home`, `about`, `aftercare`, `faq`,
  `privacy`, `terms`, `accessibility`, `contact`), собранных из блоков.
* `Operations / Inquiries` — 4 sample-заявки для демонстрации workflow.
* `Settings / Site Settings` — телефон, email, адрес, часы, соцсети,
  hero-картинка.

---

## 5. Что было исправлено помимо контента

* **Главная страница теперь не пустая.** Старый seed писал в несуществующее
  поле `content` Pages-коллекции — все страницы получались без тела. Теперь
  страницы создаются через корректное поле `blocks` (Hero, Content, Parallax,
  ImageFeature, Accordion, ArtistGrid).
* **Меню Inquiry → `/inquiry`** (раньше скроллило к подвалу).
* **Постоянная Inquiry-кнопка в шапке** — главный CTA всегда виден.
* **Битые ссылки `/contact`, `/aftercare`, `/faq`, `/terms`, `/accessibility`** —
  теперь все эти страницы существуют и наполнены.
* **Footer** — единая золотая палитра, телефон/email/адрес из CMS, footer's
  link `MAKE AN APPOINTMENT` теперь ведёт на `/inquiry`.
* **Inquiry-форма** — раздельные поля Email / Phone / Telegram с правильной
  валидацией каждого; требуется минимум один канал связи (раньше
  обязателен был только email).
* **Hover-only подписи в галерее** — на тач-устройствах теперь видны постоянно.
* **Скролл-бар компенсируется** при открытии полноэкранного меню и lightbox —
  страница больше не «прыгает».
* **OG / Twitter / metadataBase** — заполнены для шеров.
* **Skip-to-content link** — z-index подняли, не теряется под header'ом.
* **Токены типографики** в `globals.css` — `--text-primary/secondary/muted`
  заменяют `text-[#D4AF37]/40..60` (читаемость на small text).

---

## 6. Если что-то пошло не так

* **«Could not load sharp»** или **«SWC binary not installed»** при первом
  запуске — выполни `npm install --include=optional` (Windows-бинарники
  иногда не подтягиваются с базовым install).
* **`/api/seed` возвращает 500** — открой ответ, в JSON будет `error` и
  `stack`. Самые частые причины: занятый порт, нет прав на запись в
  `public/seed-images/`, или payload.db залочен другим процессом.
* **Страница `/aftercare` (или другая) пишет «no blocks»** — значит seed не
  отработал до конца. Перезапусти `npm run dev` и дёрни `/api/seed` ещё раз.
* **Хочешь обнулить базу** — закрой dev-сервер, удали `payload.db` и папку
  `public/media/` (а ещё `public/seed-images/` если хочешь перегенерить
  плейсхолдеры), запусти `npm run dev` и снова `/api/seed`.
