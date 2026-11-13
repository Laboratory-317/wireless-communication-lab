# Сайт лаборатории беспроводной связи

Сайт лаборатории 317 ТУСУР. Статические страницы на русском и английском, два оформления в одной сборке. Серверная часть и база данных не нужны.

- [Опубликованный сайт](https://laboratory-317.github.io/wireless-communication-lab/themes-preview/modern/ru/).
- [Прежнее оформление](https://laboratory-317.github.io/wireless-communication-lab/themes-preview/journal/index.html?lang=ru).
- [Проверки и публикация на GitHub](https://github.com/Laboratory-317/wireless-communication-lab/actions).

## Быстрый запуск

Нужны [Node.js](https://nodejs.org/en/download) 24.x и [Quarto](https://github.com/quarto-dev/quarto-cli/releases/tag/v1.10.18) 1.10.18. Для тестов, просмотра полной сборки и обновления библиографии — [Python](https://www.python.org/downloads/) 3.12.x. Версии зафиксированы в `.node-version`, `.quarto-version` и `.python-version`; GitHub Actions читает те же файлы.

Из корня проекта:

```powershell
node tools/project.cjs doctor
node tools/project.cjs validate
node tools/project.cjs preview
```

Открыть [новое оформление](http://127.0.0.1:4321/themes-preview/modern/ru/) или [прежнее](http://127.0.0.1:4321/themes-preview/journal/). Остановка просмотра — `Ctrl+C`. Эти команды ничего не публикуют.

У проекта нет зависимостей npm или pip. Установка пакетов не требуется. При наличии npm доступны сокращения: `npm run build`, `npm run dev`, `npm test`, `npm run validate`.

Если программы не находятся через `PATH`, скопируйте `.env.example` в `.env` и укажите полные пути в `QUARTO_BIN` и `PYTHON_BIN`. На Windows используйте `quarto.exe` и `python.exe`. `.env` не попадает в Git. Переменные окружения имеют приоритет над этим файлом.

На Windows устанавливайте сам Quarto в папку с латинским путём, например `C:\Tools\Quarto`: в версии 1.10.18 кириллица в пути установки вызывает ошибку загрузки `modules/astshortcode`. Папка проекта может иметь русское название.

## Команды

Все команды запускаются как `node tools/project.cjs <команда>` из корня проекта.

| Команда | Что делает |
| --- | --- |
| `doctor` | Проверяет наличие и версии Node.js, Quarto и Python |
| `dev` | Открывает локальный сервер Quarto с пересборкой при правках; только новое оформление, адрес `http://127.0.0.1:4321/ru/` |
| `build` | Собирает оба оформления в корневую папку `_site/` |
| `preview` | Показывает уже собранный сайт без пересборки |
| `check:sources` | Проверяет синтаксис JavaScript, порядок годов, дубли DOI и согласованность четырёх списков публикаций |
| `test` | Выполняет `check:sources` и существующие тесты импорта публикаций; внешние запросы в тестах подменены |
| `check` | Проверяет готовую сборку, страницы, внутренние ссылки и библиографию; перед запуском нужен `build` |
| `validate` | Выполняет `test`, `build`, `check` в нужном порядке |
| `scholar:check` | Обращается к Scholar и источникам, показывает результат без записи файлов |
| `scholar:sync` | Обращается к источникам и обновляет четыре списка публикаций и очередь неподтверждённых работ |

Для `dev` и `preview` можно задать другой порт: `node tools/project.cjs dev --port 4322`. Оба сервера слушают только `127.0.0.1`. Переменная `PREVIEW_PORT` в `.env` меняет порт по умолчанию.

## Где редактировать

| Материал | Прежнее оформление | Новое оформление |
| --- | --- | --- |
| Тексты страниц | `content/<раздел>/ru.md`, `en.md` | `quarto-site/ru/*.qmd`, `quarto-site/en/*.qmd` |
| Публикации | `content/publications/ru.md`, `en.md` | `quarto-site/ru/publications.qmd`, `quarto-site/en/publications.qmd` |
| Команда | `content/people/ru.md`, `en.md` | `quarto-site/ru/people.qmd`, `quarto-site/en/people.qmd` |
| Фотографии | `assets/people/` | `quarto-site/assets/people/` |
| Новости | `content/news/` | `quarto-site/ru/news.qmd`, `quarto-site/en/news.qmd` |
| Общие стили | `css/`, `themes-preview/journal/` | `quarto-site/home.css`, `site.css`, `styles.scss` |
| Шапка и подвал | `js/render-theme.js` | `quarto-site/site-header-*.html`, `site-footer-*.html` |

Два оформления пока имеют отдельные источники. Содержательные правки нужно переносить в оба оформления и обе языковые версии. Перевод названия статьи не создаёт отдельную научную работу. Разные опубликованные журнальные версии с собственными DOI допускаются отдельными записями.

При добавлении публикации проверьте название, полный список авторов, год выпуска, журнал, страницы или номер статьи и DOI по издателю. Архив идёт от новых годов к старым; избранные записи редактируются отдельно. Учебные пособия не входят в список научных публикаций. Быстрая проверка после правки — `node tools/project.cjs check:sources`.

У нового автора добавьте ссылку из карточки сотрудника на `publications.html?researcher=Фамилия`; варианты фамилии на русском и латиницей задаются в `quarto-site/navigation.html`. Ссылки на опубликованные файлы и источники проверяйте отдельно: автоматическая проверка ссылок проверяет только файлы внутри сборки.

## Что генерируется

- `js/lab-content.js` — из `content/`, вручную не редактируется.
- `assets/research/*.svg` — схемы прежнего оформления; источник — `content/research-diagrams/` и `tools/build-diagrams.js`.
- `quarto-site/ru/_home-sections.qmd`, `en/_home-sections.qmd` — блоки главной страницы.
- `quarto-site/assets/research/*-light.svg`, `*-dark.svg` — варианты схем для цветовых тем.
- `quarto-site/_site/`, `quarto-site/.quarto/`, корневая `_site/` — результаты сборки и служебные файлы.

Сборка перезаписывает производные файлы, в том числе отслеживаемые Git `js/lab-content.js` и схемы. Поэтому перед сборкой проверьте `git status`, а перед коммитом просмотрите изменения. Папка `codex/` предназначена для местных инструментов, отчётов и временных копий; она не публикуется.

## Проверка и публикация

`.github/workflows/check.yml` проверяет запросы на слияние и изменения в рабочих ветках через `validate`. Сайт при этом не публикуется.

`.github/workflows/pages.yml` при изменении `main` запускает тесты, собирает оба оформления, проверяет результат и публикует корневую `_site/` на GitHub Pages. Обновление из Scholar остаётся отдельным этапом: по понедельникам в 10:23 по Томску или при ручном запуске этого процесса. Обычный коммит в `main` не обращается к Scholar.

Рабочие ветки называются `codex/<задача>`. Перед завершением изменений запускайте `validate`; после правок внешнего вида проверьте страницу в браузере. Секреты и платные службы для сборки не требуются.

Подробнее: [новое оформление](quarto-site/README.md), [обновление библиографии](tools/SCHOLAR-SYNC.md), [правила для помощников](AGENTS.md).
