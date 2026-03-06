# CC_Фаза1_Скелет

## Что было сделано

Создана базовая инфраструктура проекта Portfolio CMS v2 на Next.js 15 (App Router).

### Созданные файлы

| Файл | Назначение |
|------|-----------|
| `prisma/schema.prisma` | Схема БД: модели Page, Section, Media, User; enum SectionType |
| `prisma.config.ts` | Конфиг Prisma 7 — URL базы данных живёт здесь |
| `lib/formatText.ts` | Типографический форматтер (перенесён из v1) |
| `lib/prisma.ts` | Singleton Prisma Client с автоформатированием текста |
| `lib/auth.ts` | NextAuth v5 (credentials + JWT) |
| `middleware.ts` | Защита маршрутов `/admin/*` |
| `styles/tokens.css` | Все дизайн-токены проекта |
| `app/globals.css` | Базовый CSS-сброс, импорт токенов |
| `docker-compose.yml` | PostgreSQL + App, volumes для uploads |
| `Dockerfile` | Multi-stage build, standalone output |
| `scripts/seed-admin.ts` | Скрипт создания первого администратора |
| `.env` / `.env.example` | Переменные окружения |

---

## Ключевые решения

### Prisma 7 — новый способ подключения к БД

В Prisma 7 убрали `url` из `datasource` в `schema.prisma`. Теперь:

- URL базы данных задаётся в `prisma.config.ts` (для миграций)
- Для клиента используется адаптер `@prisma/adapter-pg` с пакетом `pg`

```ts
// lib/prisma.ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const client = new PrismaClient({ adapter })
```

```ts
// prisma.config.ts (уже создан автоматически)
datasource: {
  url: process.env["DATABASE_URL"],
}
```

**Зависимости:** `@prisma/adapter-pg`, `pg`, `@types/pg`

### Prisma 7 — убрали $use middleware

Вместо `client.$use(...)` теперь используется `client.$extends`:

```ts
client.$extends({
  query: {
    page: {
      async create({ args, query }) {
        args.data.title = formatText(args.data.title)
        return query(args)
      }
    }
  }
})
```

### formatText — типограф

Перенесён из `v1/frontend/src/utils/typography.ts`. Добавлена защита висячей строки (последнее слово через `\u00A0`).

Правила:
- Кавычки → ёлочки («»)
- Дефис с пробелами → длинное тире (—)
- Дефис внутри слова → неразрывный дефис (‑)
- Предлоги и союзы → неразрывный пробел после
- Числа + единицы → неразрывный пробел
- Висячая строка → неразрывный пробел перед последним словом

**Вызывать обязательно** перед сохранением любого текста в БД.

### NextAuth v5 (beta)

- Стратегия: JWT (не database sessions)
- Провайдер: Credentials (email + bcryptjs)
- Страница входа: `/admin/login`
- Все `/admin/*` маршруты защищены через `middleware.ts`

### CSS-архитектура

Все визуальные значения — только через токены из `styles/tokens.css`.

```css
/* ✅ Правильно */
color: var(--color-text-primary);
padding: var(--space-4);

/* ❌ Неправильно */
color: #333;
padding: 16px;
```

Файл `styles/tokens.css` **нельзя менять без явного указания** — изменения затрагивают всю систему.

---

## Подводные камни

### .bin/ — не симлинки после копирования

При создании проекта через `create-next-app` в непустую папку возникла проблема: файлы из `/tmp` были скопированы через `cp`, и `.bin/` содержал копии вместо симлинков. Бинарники (`tsc`, `next`) не находили свои модули.

**Решение:** `rm -rf node_modules && npm install` — пересоздаёт правильные симлинки.

### prisma generate нужен перед build

Без `prisma generate` сборка падает с `Module not found: Can't resolve '.prisma/client/default'`.

В `package.json` добавлено:
```json
"build": "prisma generate && next build"
```

---

## Как запустить

```bash
# 1. Поднять PostgreSQL
docker compose up postgres -d

# 2. Применить схему
npm run db:push   # или npm run db:migrate (с историей миграций)

# 3. Создать admin-пользователя
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret npm run seed:admin

# 4. Запустить dev-сервер
npm run dev
```

---

## Связи с остальной системой

- `lib/formatText.ts` ← вызывается из `lib/prisma.ts` (автоматически для Page.title и Page.description)
- `lib/auth.ts` ← используется в `middleware.ts` и будущих admin API-маршрутах
- `styles/tokens.css` ← импортируется в `app/globals.css`, используется во всех CSS Modules
- `prisma/schema.prisma` ← основа для всех API-маршрутов (Phase 3) и рендерера (Phase 4)
