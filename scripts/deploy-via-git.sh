#!/bin/bash

# Скрипт для деплоя через Git
# Использование: ./deploy-via-git.sh [frontend|backend|all]

set -e

SSH_KEY="$HOME/.ssh/id_ed25519_portfolio"
SSH_USER="root"
SSH_HOST="157.180.85.212"
SERVER_PATH="/var/www/html"
SERVICE="${1:-frontend}"  # frontend, backend или all
GIT_PULL_EXIT_CODE=0

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Проверка SSH ключа
if [ ! -f "$SSH_KEY" ]; then
    error "SSH ключ не найден: $SSH_KEY"
fi

# Проверка что изменения запушены
info "Проверяем статус Git..."

# Проверяем существует ли remote tracking branch origin/main
if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
    warn "Remote branch origin/main не найдена. Это может быть первый запуск или ветка еще не настроена."
    info "Пропускаем проверку незапушенных коммитов."
    LOCAL_COMMITS=0
else
    # Безопасно получаем количество незапушенных коммитов
    LOCAL_COMMITS_OUTPUT=$(git log origin/main..HEAD --oneline 2>/dev/null)
    if [ -z "$LOCAL_COMMITS_OUTPUT" ]; then
        # Если вывод пустой, значит нет незапушенных коммитов
        LOCAL_COMMITS=0
    else
        # Считаем количество строк (коммитов)
        LOCAL_COMMITS=$(echo "$LOCAL_COMMITS_OUTPUT" | grep -c . || echo "0")
        # Проверяем что это число
        if ! [[ "$LOCAL_COMMITS" =~ ^[0-9]+$ ]]; then
            LOCAL_COMMITS=0
        fi
    fi
fi

if [ "$LOCAL_COMMITS" -gt 0 ]; then
    warn "У вас есть $LOCAL_COMMITS незапушенных коммитов!"
    echo "Запушить сейчас? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        info "Пушим изменения..."
        git push origin main || error "Не удалось запушить"
    else
        warn "Коммиты не запушены. Продолжить всё равно? (y/n)"
        read -r continue_response
        if [[ ! "$continue_response" =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
fi

info "🚀 Деплой через Git..."

# Проверяем существует ли git репозиторий на сервере
info "📥 Проверяем Git репозиторий на сервере..."
IS_GIT_REPO=$(ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $SERVER_PATH && git rev-parse --is-inside-work-tree 2>/dev/null || echo 'false'")

# Проверяем, настроен ли remote origin
HAS_ORIGIN=$(ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $SERVER_PATH && git remote get-url origin 2>/dev/null && echo 'true' || echo 'false'")

if [ "$IS_GIT_REPO" != "true" ] || [ "$HAS_ORIGIN" != "true" ]; then
    if [ "$IS_GIT_REPO" != "true" ]; then
        warn "⚠️  На сервере нет Git репозитория в $SERVER_PATH"
    else
        warn "⚠️  На сервере Git репозиторий есть, но не настроен remote 'origin'"
    fi
    echo ""
    echo "Это может быть если проект был развернут через rsync, а не через git clone."
    echo ""
    echo "Выберите действие:"
    echo "  1) Инициализировать Git репозиторий и подключить к GitHub (рекомендуется)"
    echo "  2) Пропустить git pull и продолжить деплой (будет использован текущий код на сервере)"
    echo "  3) Отменить"
    echo ""
    read -p "Ваш выбор (1/2/3): " git_setup_choice
    
    case "$git_setup_choice" in
        1)
            info "Инициализируем Git репозиторий на сервере..."
            
            # Определяем URL репозитория
            GIT_REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
            
            if [ -z "$GIT_REPO_URL" ]; then
                echo "Не удалось определить URL репозитория. Введите URL вручную:"
                read -p "GitHub URL репозитория: " GIT_REPO_URL
            fi
            
            if [ -z "$GIT_REPO_URL" ]; then
                error "URL репозитория не указан. Отменяем."
            fi
            
            # Конвертируем HTTPS URL в SSH URL для GitHub (если нужно)
            if echo "$GIT_REPO_URL" | grep -q "^https://github.com/"; then
                GIT_REPO_URL=$(echo "$GIT_REPO_URL" | sed 's|https://github.com/|git@github.com:|' | sed 's|\.git$||')
                GIT_REPO_URL="${GIT_REPO_URL}.git"
                info "Конвертируем HTTPS URL в SSH: $GIT_REPO_URL"
            fi
            
            info "Настраиваем Git на сервере..."
            ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << EOF
                set -e
                cd $SERVER_PATH
                
                # Инициализируем git репозиторий (если еще не инициализирован)
                if [ "$IS_GIT_REPO" != "true" ]; then
                    git init
                fi
                
                # Добавляем или обновляем remote
                if git remote get-url origin >/dev/null 2>&1; then
                    git remote set-url origin "$GIT_REPO_URL"
                    echo "✅ Remote origin обновлен"
                else
                    git remote add origin "$GIT_REPO_URL"
                    echo "✅ Remote origin добавлен"
                fi
                
                # Добавляем все файлы в первый коммит (если еще нет коммитов)
                if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
                    git add .
                    git commit -m "Initial commit from server" || true
                fi
                
                # Настраиваем ветку
                git branch -M main 2>/dev/null || true
                
                # Получаем изменения из GitHub
                echo "📥 Получаем изменения из GitHub..."
                git fetch origin main || git fetch origin || true
                
                # Пытаемся смержить или переключиться
                if git rev-parse --verify origin/main >/dev/null 2>&1; then
                    # Если есть удаленная ветка, пытаемся обновиться
                    echo "🔄 Обновляем код из GitHub..."
                    git reset --hard origin/main 2>/dev/null || git pull origin main --allow-unrelated-histories || true
                fi
                
                echo "✅ Git репозиторий настроен"
EOF
            
            if [ $? -eq 0 ]; then
                info "✅ Git репозиторий успешно инициализирован"
            else
                warn "⚠️  Были проблемы при настройке Git, но продолжаем..."
            fi
            ;;
        2)
            warn "Пропускаем git pull. Будет использован текущий код на сервере."
            IS_GIT_REPO="false"  # Устанавливаем флаг для использования rsync
            ;;
        3)
            error "Деплой отменен пользователем"
            ;;
        *)
            error "Неверный выбор. Деплой отменен."
            ;;
    esac
else
    # Git репозиторий существует и origin настроен, делаем pull
    info "📥 Получаем изменения из Git на сервере..."
    # Сначала делаем fetch, потом pull
    if ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "cd $SERVER_PATH && git fetch origin && git pull origin main"; then
        info "✅ Git pull выполнен успешно"
        GIT_PULL_EXIT_CODE=0
    else
        GIT_PULL_EXIT_CODE=$?
        warn "⚠️  Git pull не удался (код выхода: $GIT_PULL_EXIT_CODE)"
        echo ""
        echo "Возможные причины:"
        echo "  - Конфликты между локальными и удаленными изменениями на сервере"
        echo "  - Проблемы с доступом к репозиторию"
        echo "  - Ветка origin/main не настроена на сервере"
        echo ""
        echo "Продолжить деплой всё равно? (y/n)"
        read -r continue_response
        if [[ ! "$continue_response" =~ ^[Yy]$ ]]; then
            error "Деплой отменен пользователем"
        fi
        warn "Продолжаем деплой несмотря на ошибку git pull..."
    fi
fi

# Если git pull не удался или Git не настроен, синхронизируем файлы через rsync
NEED_RSYNC=false
if [ "$IS_GIT_REPO" != "true" ] || [ "$GIT_PULL_EXIT_CODE" != "0" ]; then
    NEED_RSYNC=true
fi

if [ "$NEED_RSYNC" = "true" ]; then
    warn "⚠️  Используем rsync для синхронизации файлов..."
    
    if [ "$SERVICE" = "frontend" ] || [ "$SERVICE" = "all" ]; then
        info "📤 Синхронизируем frontend..."
        rsync -avz --exclude='node_modules' --exclude='dist' --exclude='.vite' \
            -e "ssh -i $SSH_KEY" \
            frontend/ \
            "$SSH_USER@$SSH_HOST:$SERVER_PATH/frontend/"
    fi
    
    if [ "$SERVICE" = "backend" ] || [ "$SERVICE" = "all" ]; then
        info "📤 Синхронизируем backend..."
        rsync -avz --exclude='__pycache__' --exclude='*.pyc' --exclude='venv' --exclude='.venv' \
            -e "ssh -i $SSH_KEY" \
            backend/ \
            "$SSH_USER@$SSH_HOST:$SERVER_PATH/backend/"
    fi
    
    if [ "$SERVICE" = "all" ]; then
        info "📤 Синхронизируем корневые файлы..."
        # Важно: исключаем .env.production чтобы не перезаписать настройки на сервере
        rsync -avz --exclude='.git' --exclude='node_modules' --exclude='frontend' --exclude='backend' \
            --exclude='.env' --exclude='.env.production' --exclude='.env.*' \
            -e "ssh -i $SSH_KEY" \
            docker-compose.prod.yml \
            "$SSH_USER@$SSH_HOST:$SERVER_PATH/" 2>/dev/null || true
    fi
fi

# Выполняем команды деплоя на сервере
info "🔨 Пересобираем $SERVICE на сервере..."

ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << EOF
    set -e
    cd $SERVER_PATH
    
    # Устанавливаем права на выполнение для скриптов деплоя
    chmod +x deploy*.sh 2>/dev/null || true
    
    if [ "$SERVICE" = "frontend" ]; then
        ./deploy-frontend.sh
    elif [ "$SERVICE" = "backend" ]; then
        ./deploy-backend.sh
    else
        ./deploy.sh
    fi
    
    echo "✅ Деплой завершен!"
    echo ""
    echo "Статус контейнеров:"
    docker compose -f docker-compose.prod.yml --env-file .env.production ps
EOF

info "✅ Готово! Изменения задеплоены на production"

