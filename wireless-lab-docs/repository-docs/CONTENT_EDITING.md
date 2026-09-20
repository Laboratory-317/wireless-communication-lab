# Как редактировать сайт

Почти весь сайт редактируется обычными Markdown-файлами в `content/`.
Главное правило: структура страницы задается заголовками.

```markdown
# Заголовок страницы

Обычный текст.

## Карточка или раздел

Текст раздела.

### Подраздел

- Список
- Еще пункт
```

После правок запустите:

```powershell
node tools/build-content.js
```

## Перевод RU -> EN

Автоматический перевод не запускается при обычной сборке, чтобы сайт можно было
обновлять без интернета и без дневных лимитов внешних сервисов.

```powershell
node tools/translate-ru-to-en.js --all --write --if-source-newer
```

Для локального LibreTranslate:

```powershell
node tools/translate-ru-to-en.js --all --write --if-source-newer --provider libre
```

## Основные страницы

- `home/ru.md` и `home/en.md` — главная.
- `people/ru.md` и `people/en.md` — коллектив.
- `projects/ru.md` и `projects/en.md` — проекты и гранты.
- `patents/ru.md` и `patents/en.md` — патенты.
- `publications/ru.md` и `publications/en.md` — публикации.
- `media/ru.md` и `media/en.md` — медиа.
- `news/ru.md` и `news/en.md` — новости.

## Новости

Каждый заголовок `##` в `content/news/<lang>.md` становится отдельной новостью.
Поле `Дата:` необязательно.

## CV сотрудников

Формат файлов: `content/cv/surname_ru.md` и `content/cv/surname_en.md`.

Ссылка из карточки сотрудника:

```markdown
- CV: [CV](cv.html?person=kryukov)
```

На сайте отдельная строка CV не показывается: кликабельным становится ФИО.

## Чего лучше не делать

- Не редактировать `js/lab-content.js` вручную.
- Не писать HTML внутри Markdown без необходимости.
- Не менять `themes-preview/`, если меняется только текст.
