#!/bin/bash
# Deploy cc-portfolio to kk-about.me
# Usage: ./scripts/deploy.sh

set -e

SSH_KEY="$HOME/.ssh/id_ed25519_portfolio"
SSH_USER="root"
SSH_HOST="157.180.85.212"
SERVER_PATH="/var/www/cc-portfolio"
GIT_REPO="https://github.com/SSKos/cc_portfolio-2026.git"

NGINX_CONF_HOST="/var/www/html/nginx/conf.d/default.conf"
NGINX_CONTAINER="portfolio_nginx"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[deploy] $1${NC}"; }
warn()  { echo -e "${YELLOW}[warn]   $1${NC}"; }
error() { echo -e "${RED}[error]  $1${NC}"; exit 1; }

# ── 1. Check SSH key ──────────────────────────────────────────────────────────
[ -f "$SSH_KEY" ] || error "SSH key not found: $SSH_KEY"

# ── 2. Check for unpushed commits ─────────────────────────────────────────────
info "Checking git status..."
if git rev-parse --verify origin/main >/dev/null 2>&1; then
    UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')
    if [ "$UNPUSHED" -gt 0 ]; then
        warn "$UNPUSHED unpushed commit(s) found."
        echo -n "Push now? (y/n): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            info "Pushing to origin/main..."
            git push origin main || error "Push failed"
        else
            warn "Continuing without pushing. Server will get older code."
        fi
    else
        info "All commits pushed."
    fi
fi

# ── 3. Clone or pull on server ────────────────────────────────────────────────
info "Updating code on server..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash << EOF
    set -e
    if [ -d "$SERVER_PATH/.git" ]; then
        echo "Pulling latest..."
        cd "$SERVER_PATH"
        git fetch origin
        # Preserve sandbox-content edits made via admin — git reset --hard would overwrite them
        if [ -d "$SERVER_PATH/sandbox-content" ]; then
            cp -r "$SERVER_PATH/sandbox-content" /tmp/sandbox-content-backup
        fi
        git reset --hard origin/main
        # Restore user edits on top of any new files from git
        if [ -d /tmp/sandbox-content-backup ]; then
            cp -r /tmp/sandbox-content-backup/. "$SERVER_PATH/sandbox-content/"
            rm -rf /tmp/sandbox-content-backup
        fi
    else
        echo "Cloning repository..."
        rm -rf "$SERVER_PATH"
        git clone "$GIT_REPO" "$SERVER_PATH"
    fi
    echo "Code updated."
    # nextjs user in container has uid 1001 — sandbox-content must be writable by it
    chown -R 1001:1001 "$SERVER_PATH/sandbox-content"
    echo "sandbox-content ownership set."
EOF

# ── 4. Check .env on server ───────────────────────────────────────────────────
info "Checking .env on server..."
ENV_EXISTS=$(ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "[ -f $SERVER_PATH/.env ] && echo yes || echo no")

if [ "$ENV_EXISTS" = "no" ]; then
    warn ".env not found on server!"
    echo ""
    echo "Create $SERVER_PATH/.env with the following variables:"
    echo ""
    echo "  DATABASE_URL=\"postgresql://portfolio:STRONG_PASSWORD@postgres:5432/portfolio\""
    echo "  NEXTAUTH_SECRET=\"\$(openssl rand -base64 32)\""
    echo "  NEXTAUTH_URL=\"https://kk-about.me\""
    echo "  ADMIN_EMAIL=\"your@email.com\""
    echo "  ADMIN_PASSWORD=\"StrongPassword123!\""
    echo "  FIGMA_ACCESS_TOKEN=\"...\""
    echo ""
    echo "Then run this script again."
    exit 1
fi

info ".env found."

# ── 5. Build and start containers ─────────────────────────────────────────────
info "Building and starting containers..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash << EOF
    set -e
    cd "$SERVER_PATH"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml pull --quiet 2>/dev/null || true
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    echo "Containers started."
    # Fix uploads volume ownership (nextjs user uid 1001 needs write access)
    UPLOADS_PATH=\$(docker volume inspect cc-portfolio_uploads --format '{{.Mountpoint}}' 2>/dev/null || true)
    if [ -n "\$UPLOADS_PATH" ]; then
        chown -R 1001:1001 "\$UPLOADS_PATH"
    fi
    # Ensure app container is on nginx_shared (docker-compose sometimes fails to assign IP)
    docker network disconnect nginx_shared cc_portfolio_app 2>/dev/null || true
    docker network connect nginx_shared cc_portfolio_app
    echo "Network reconnected."
EOF

# ── 6. Seed admin user (only if User table is empty) ──────────────────────────
info "Checking admin user..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash << EOF
    set -e
    cd "$SERVER_PATH"
    # Wait up to 30s for app to be healthy
    for i in \$(seq 1 6); do
        STATUS=\$(docker inspect --format='{{.State.Health.Status}}' cc_portfolio_app 2>/dev/null || echo "none")
        if [ "\$STATUS" = "healthy" ] || [ "\$STATUS" = "none" ]; then break; fi
        echo "Waiting for app container... (\$i/6)"
        sleep 5
    done
    COUNT=\$(docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
        psql -U portfolio -tAc 'SELECT COUNT(*) FROM "User"' 2>/dev/null || echo "0")
    if [ "\$COUNT" = "0" ]; then
        echo "Creating admin user..."
        docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T app npm run seed:admin
    else
        echo "Admin user already exists, skipping seed."
    fi
EOF

# ── 7. Update nginx config for kk-about.me ────────────────────────────────────
info "Updating nginx config for kk-about.me..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash << 'SSHEOF'
cat > /var/www/html/nginx/conf.d/default.conf << 'NGINXEOF'
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name _;

    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/certbot;
        default_type "text/plain";
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# www → non-www
server {
    listen 443 ssl;
    http2 on;
    server_name www.kk-about.me;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    return 301 https://kk-about.me$request_uri;
}

# kk-about.me → cc_portfolio_app (Next.js)
server {
    listen 443 ssl;
    http2 on;
    server_name kk-about.me _;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_ciphers               ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache         shared:SSL:10m;
    ssl_session_timeout       1d;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options           "SAMEORIGIN" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;

    client_max_body_size 20M;

    # Gzip compression
    gzip              on;
    gzip_comp_level   5;
    gzip_min_length   1024;
    gzip_proxied      any;
    gzip_vary         on;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # Docker internal DNS — dynamic resolution so nginx starts even if app is down
    resolver 127.0.0.11 valid=10s;

    # Next.js static assets — long-lived cache
    location /_next/static/ {
        set $upstream http://cc_portfolio_app:3000;
        proxy_pass       $upstream;
        proxy_set_header Host $host;
        add_header       Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Public uploads (direct static via Next.js)
    location /uploads/ {
        set $upstream http://cc_portfolio_app:3000;
        proxy_pass       $upstream;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }

    # Media API (stable ID-based URLs, cached by Nginx for 1h)
    location /media/ {
        set $upstream http://cc_portfolio_app:3000;
        proxy_pass         $upstream;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_hide_header  Cache-Control;
        add_header         Cache-Control "public, max-age=3600, stale-while-revalidate=604800";
        access_log off;
    }

    # Everything else → Next.js
    location / {
        set $upstream http://cc_portfolio_app:3000;
        proxy_pass         $upstream;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF
echo "nginx config written."
SSHEOF

# ── 8. Reload nginx ───────────────────────────────────────────────────────────
info "Reloading nginx..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" bash << EOF
    docker exec $NGINX_CONTAINER nginx -t && \
    docker exec $NGINX_CONTAINER nginx -s reload && \
    echo "nginx reloaded."
EOF

# ── 9. Status ─────────────────────────────────────────────────────────────────
info "Container status:"
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $SERVER_PATH && docker compose -f docker-compose.yml -f docker-compose.prod.yml ps"

echo ""
info "Done! https://kk-about.me"
