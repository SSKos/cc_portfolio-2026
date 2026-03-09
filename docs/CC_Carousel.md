# CC_Carousel — Компонент карусели

## Что построено и зачем

Компонент `Carousel` для отображения стека изображений с плавным crossfade-переходом и PNG-оверлеем поверх слайдов. Используется как UI-атом в витрине `/dev/ui` и в будущем — как блок в публичных страницах портфолио.

Сделан в два слоя:
- **Phase 1** — `Carousel.tsx` / `Carousel.module.css`: чистый компонент только с пропсами, никакой логики управления внутри.
- **Phase 2** — `CarouselShowcase.tsx`: интерактивная панель управления в UI Kit (загрузка, порядок, замена, удаление слайдов и обложки).

---

## Архитектура

### Файлы

```
components/ui/
  Carousel.tsx              # атом, принимает только пропсы
  Carousel.module.css

app/dev/ui/
  CarouselShowcase.tsx      # витрина + панель управления
  CarouselShowcase.module.css
```

### Пропсы Carousel

```typescript
interface CarouselSlide { id: string; src: string; alt?: string }

interface CarouselProps {
  slides: CarouselSlide[]   // пустой массив → плейсхолдер
  cover?: string            // URL к PNG-оверлею (позиция absolute, z-index выше стека; optional)
  className?: string
}
```

### Слои внутри компонента

```
.outer  (position: relative; width: 100%; height: 100%; overflow: hidden)
  ├── <img .slide> × N  (position: absolute; inset: 0; object-fit: cover; opacity управляется JS)
  └── <img .coverOverlay>  (position: absolute; inset: 0; z-index: 10; pointer-events: none)
```

Карусель занимает весь CONT через `width: 100%; height: 100%`. Масштабирование слайдов — `object-fit: cover`, аналог CSS cover для изображений: заполняет без пустых полос, кропает от центра. Никакого ResizeObserver не нужно.

---

## Анимация — конечный автомат

### Состояние

```
currentIdx   — индекс видимого слайда
nextIdx      — индекс следующего (null вне перехода)
transitioning — true во время crossfade
```

### Тайминг (slides.length >= 2)

```
IDLE (currentIdx=N)
  │
  │  setTimeout(4000ms) — фаза удержания
  ▼
setNextIdx((N+1)%len), setTransitioning(true)
  │  → рендер: slide[N] opacity 1→0, slide[N+1] opacity 0→1
  │     (CSS transition: 600ms ease-in-out, оба одновременно)
  │
  │  setTimeout(600ms) — фаза завершения
  ▼
setCurrentIdx(N+1), setNextIdx(null), setTransitioning(false)
  │  → IDLE
  ...
```

### Граничные случаи

| slides.length | Поведение |
|---|---|
| 0 | Плейсхолдер (`.empty`), таймеры не запускаются |
| 1 | Слайд отображается статично, класс `.slideAnimated` не применяется, таймеры не запускаются — явная проверка `slides.length <= 1` |
| ≥ 2 | Полная анимация |

### Сброс при смене слайдов

Отдельный `useEffect([slides])` сбрасывает `currentIdx → 0`, `nextIdx → null`, `transitioning → false` при любом изменении массива слайдов. React делает два рендера: первый — сброс, второй — корректный перезапуск hold-таймера.

---

## ResizeObserver — масштабирование

**Принцип**: `.outer` заполняет доступное пространство, `.frame` получает вычисленные пиксели через inline style.

```
observer наблюдает .outer

при изменении размера:
  cw = contentRect.width
  ch = contentRect.height

  если cw / ch >= aspectRatio:
    width  = ch * aspectRatio   (ограничение по высоте)
    height = ch
  иначе:
    width  = cw                 (ограничение по ширине)
    height = cw / aspectRatio

  setDims({ width, height })
```

**Важно**: `ResizeObserver` наблюдает за `.outer` (внешний контейнер, не за `.frame` с вычисленными размерами). Это принципиально — иначе наблюдатель реагировал бы на собственные изменения размера.

---

## Phase 2 — управляющая панель

### Что умеет CarouselShowcase

- Загрузка нескольких слайдов (`<input multiple>`) через `POST /api/admin/media`
- Замена отдельного слайда
- Удаление слайда
- Перетаскивание для изменения порядка (dnd-kit)
- Загрузка и замена cover PNG (явно помечен как optional)
- Карусель без cover = просто слайдшоу

### Персистентность — localStorage

Картинки грузятся через `/api/admin/media` и сохраняются в `/public/uploads/` — у них постоянные URL. Список слайдов и cover сохраняются в `localStorage` под ключом `carousel-showcase-v1`. После перезагрузки страницы конфигурация восстанавливается.

```
загрузка файла → POST /api/admin/media → { url: "/uploads/..." }
                                         ↓
                               слайд с постоянным URL
                               + localStorage сохранение
```

**Blob URLs не используются** — только постоянные URL из media API.

### Drag and drop

Используется `@dnd-kit` (уже был в `package.json`). Выбор обоснован:
- Headless — не конфликтует с CSS Modules
- Работает с React 19
- `PointerSensor` — мышь и тач
- `KeyboardSensor` с `sortableKeyboardCoordinates` — клавиатурная доступность

---

## Ключевые решения

### 1. Компонент — только пропсы

В `Carousel.tsx` нет ни загрузки файлов, ни drag-and-drop, ни состояния кроме анимации. Это осознанное решение — компонент используется в публичном рендере страниц, где управление неуместно. Вся логика управления живёт исключительно в `CarouselShowcase`.

### 2. CSS transition, не библиотека

Crossfade реализован через `transition: opacity 600ms ease-in-out` в CSS модуле. Класс `.slideAnimated` добавляется только когда `slides.length > 1`, чтобы при одном слайде в DOM не было лишнего правила перехода.

### 3. Два таймера вместо одного цикла

Hold и crossfade — два независимых `useEffect` с разными зависимостями. Это чище, чем один `setInterval` или рекурсивный `setTimeout`, и корректно очищается при unmount и при смене слайдов.

### 4. Oверлей без clip-path

PNG overlay рендерится простым `<img position: absolute; width/height: 100%>`. Никаких SVG-масок, clip-path, z-index-хаков. Работает потому что frame поддерживает корректный aspect ratio — overlay и слайды всегда одного размера.

---

## Подводные камни

- **ResizeObserver loop**: никогда не наблюдать за элементом, размер которого зависит от ResizeObserver-коллбека — бесконечный цикл. Наблюдаем `.outer`, меняем только `.frame`.
- **Blob URL утечка**: если не вызвать `revokeObjectURL`, объекты остаются в памяти. Особенно критично при множественных заменах слайдов.
- **Stale closure в таймерах**: `setTimeout` захватывает значения из замыкания. Поэтому каждый `useEffect` возвращает cleanup с `clearTimeout` — при следующем рендере таймер пересоздаётся со свежими значениями.
- **slides.length === 1 и transition**: класс `.slideAnimated` не навешивается намеренно, но даже если бы навешивался — opacity никогда не меняется, перехода визуально не было бы. Однако явный пропуск класса делает намерение очевидным в коде.

---

## Связь с остальной системой

- Компонент живёт в `components/ui/` (атомный уровень), не `blocks/` или `sections/` — у него нет своего контента, только рендер пропсов.
- В будущем: `Section` с `type: "figma_block"` или `type: "hero"` может включать `<Carousel>` как дочерний элемент.
- `CarouselShowcase` в витрине `/dev/ui` — инструмент для дизайнера/разработчика, не попадает в production bundle публичного сайта.
- Токены используются везде: `--surface-level-*`, `--radius-*`, `--pad-*`, `--typo-*`, `--text-*`. Ни одного hardcoded значения.
