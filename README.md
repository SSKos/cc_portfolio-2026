# Portfolio CMS

Self-hosted portfolio with custom admin panel. Next.js 16, PostgreSQL, NextAuth, Docker.

## Как запустить локально

### 1. Переменные окружения

Скопируйте пример и заполните:

```bash
cp .env.example .env
```

В `.env` обязательно:

- **DATABASE_URL** — строка подключения к PostgreSQL. Для локального Docker:  
  `postgresql://portfolio:portfolio@localhost:5432/portfolio`
- **NEXTAUTH_SECRET** — секрет для сессий: `openssl rand -base64 32`
- **NEXTAUTH_URL** — для dev: `http://localhost:3000`
- Для сида админа: **ADMIN_EMAIL**, **ADMIN_PASSWORD**

### 2. База данных

Поднять Postgres (Docker):

```bash
docker compose up -d postgres
```

Применить схему и создать админа:

```bash
npm run db:migrate
npm run seed:admin
```

(При первом запуске миграций Prisma создаст папку `prisma/migrations` и таблицы.)

### 3. Запуск приложения

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000):

- **/** — публичная главная (пока заглушка create-next-app)
- **/admin** — админка (редирект на логин, если не авторизован)
- **/admin/login** — форма входа (логин/пароль из `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

### Полный запуск в Docker

```bash
docker compose up --build
```

Приложение на порту 3000, Postgres — 5432. Перед первым запуском нужны миграции и сид: удобнее один раз выполнить их локально с `DATABASE_URL=postgresql://portfolio:portfolio@localhost:5432/portfolio`, затем поднимать `docker compose up`.
