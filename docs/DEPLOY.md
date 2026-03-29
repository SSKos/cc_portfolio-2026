# Deploy — VPS

## Требования

- VPS с Ubuntu/Debian (минимум 1 GB RAM)
- Домен (опционально, но нужен для HTTPS)

---

## 1. Подготовить сервер

```bash
ssh root@твой-ip

# Docker
curl -fsSL https://get.docker.com | sh

# Nginx
apt install nginx -y
```

---

## 2. Загрузить код

```bash
git clone https://github.com/SSKos/cc_portfolio-2026.git /var/www/portfolio
cd /var/www/portfolio
```

---

## 3. Создать `.env`

```bash
nano .env
```

```env
DATABASE_URL="postgresql://portfolio:СИЛЬНЫЙ_ПАРОЛЬ@postgres:5432/portfolio"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://твой-домен.ru"
ADMIN_EMAIL="твой@email.ru"
ADMIN_PASSWORD="СильныйПароль123!"
FIGMA_ACCESS_TOKEN="..."
```

Сгенерировать `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Поменять пароль БД в `docker-compose.yml`:
```yaml
POSTGRES_PASSWORD: СИЛЬНЫЙ_ПАРОЛЬ  # совпадает с паролем в DATABASE_URL
```

---

## 4. Запустить

```bash
# Собрать и поднять
docker compose up -d --build

# Создать admin-пользователя (только первый раз)
docker compose exec app npm run seed:admin

# Проверить логи
docker compose logs -f app
```

Приложение доступно на `http://твой-ip:3000`.

### Хранение загрузок

Загруженные файлы из медиатеки и sandbox gallery сохраняются не в контейнере, а в Docker volume `cc-portfolio_uploads`, который примонтирован в `/app/public/uploads`.

Это важно:

- пересоздание контейнера не должно удалять загруженные файлы;
- при деплое нужно использовать тот же compose project name, либо оставить volume name зафиксированным в `docker-compose.yml`;
- если нужно проверить наличие файлов, смотри volume `cc-portfolio_uploads`, а не только файловую систему контейнера.

---

## 5. Настроить Nginx

```bash
nano /etc/nginx/sites-available/portfolio
```

```nginx
server {
    listen 80;
    server_name твой-домен.ru;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 6. HTTPS — Let's Encrypt

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d твой-домен.ru
```

Certbot сам обновит конфиг Nginx и настроит автопродление сертификата.

---

## Смена пароля admin

Пароль в `.env` — только источник для seed-скрипта. В БД хранится bcrypt-хеш.
Менять `.env` без пересоздания пользователя бесполезно.

### Вариант 1 — пересоздать через seed (проще)

```bash
# Удалить пользователя из БД
docker compose exec postgres psql -U portfolio -c "DELETE FROM \"User\" WHERE email='твой@email.ru';"

# Обновить ADMIN_PASSWORD в .env
nano .env

# Пересоздать
docker compose exec app npm run seed:admin
```

### Вариант 2 — обновить хеш напрямую в БД

```bash
# Сгенерировать хеш нового пароля (запустить локально)
node -e "require('bcryptjs').hash('НовыйПароль123!', 12).then(h => console.log(h))"

# Обновить хеш в БД (подставить полученный хеш)
docker compose exec postgres psql -U portfolio -c \
  "UPDATE \"User\" SET \"hashedPassword\"='ХЕШ' WHERE email='твой@email.ru';"
```

### Вариант 3 — psql-консоль интерактивно

```bash
docker compose exec postgres psql -U portfolio

# Посмотреть пользователей
SELECT id, email FROM "User";

# Удалить и пересоздать через seed
DELETE FROM "User" WHERE email='твой@email.ru';
\q

docker compose exec app npm run seed:admin
```

> Требования к паролю: минимум 12 символов, заглавные + строчные буквы + цифра + спецсимвол.

---

## Обновление после изменений в коде

```bash
cd /var/www/portfolio
git pull
docker compose up -d --build
```

Миграции БД применяются автоматически при старте контейнера (`npx prisma migrate deploy`).
