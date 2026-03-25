# CC_Инструкция_Для_Генерации_Страниц

## Что это и зачем

Этот документ фиксирует инструкцию для нейросети, которая должна создавать новые страницы для сайта-портфолио в визуальной логике текущего проекта.

Главная задача:
- генерировать страницы, которые визуально и технически совпадают с существующим сайтом;
- в первую очередь ориентироваться на стилистику страницы проекта;
- не плодить новые типографические паттерны, если в проекте уже есть подходящий общий стиль;
- использовать токены и общую типографику как единый источник истины.

Это важно, потому что проект уже начал обрастать общими правилами:
- токены в `styles/tokens.css`;
- общий форматтер текста в `lib/formatText.ts`;
- общие текстовые стили в `sandbox-content/shared/typography.module.css`;
- существующие визуальные референсы в `sandbox-content/main/main.tsx` и `sandbox-content/design-systems/design-systems.tsx`.

## Ключевое решение

Для генерации новых страниц нужно считать источником визуальной правды не абстрактный UI-kit, а уже собранные страницы проекта:

- основной референс: `sandbox-content/design-systems/design-systems.tsx`;
- дополнительный референс: `sandbox-content/main/main.tsx`.

Почему так:
- страница проекта точнее задаёт структуру контентных блоков, ритм текста, поведение изображений и общую атмосферу;
- главная страница полезна как вторичный ориентир для hero-блоков, карточек, общих текстовых размеров и responsive-поведения;
- общая типографика уже вынесена в `sandbox-content/shared/typography.module.css`, поэтому новые страницы должны подключать готовые стили, а не копировать размеры вручную.

## Инструкция для нейросети

```text
Create page components for this portfolio site using the existing project conventions and visual language.

Project context
- Framework: Next.js App Router
- Language: TypeScript, strict mode
- Styling: CSS Modules only
- Design tokens: always use values from styles/tokens.css
- Shared text styles: use the common typography module at sandbox-content/shared/typography.module.css
- Text formatting: all authored text must follow the same typographic rules as lib/formatText.ts

General design direction
- Match the overall visual language of the existing site.
- The closest visual reference is the project page design, with the homepage as a secondary reference.
- The result should feel editorial, product-focused, spacious, calm, and premium.
- Avoid generic landing-page styling, Tailwind-like utility patterns, or arbitrary visual changes.
- Keep strong hierarchy, large headings, generous spacing, dark surfaces, and restrained accent usage.

Layout rules
- Content should usually be centered and constrained to the same content width used by existing pages.
- Standard text sections should align to the same reading column as the current project page.
- On viewports narrower than the base content width, add horizontal page padding of 1rem.
- Images must scale proportionally and never distort.
- Prefer aspect-ratio, width: 100%, height: auto, object-fit: cover/contain where appropriate.
- On smaller screens, convert multi-column layouts into stacked vertical layouts.
- Avoid overflow that creates unintended extra space on the right.

Tokens and CSS rules
- Never hardcode colors, spacing, radii, or typography values if an existing token can be used.
- Use CSS custom properties from styles/tokens.css for color, spacing, radius, and other reusable values.
- Use CSS Modules only. No Tailwind. No CSS-in-JS.
- Reuse existing spacing rhythm and section padding patterns from the current homepage/project pages.

Typography rules
- Reuse shared typography classes from sandbox-content/shared/typography.module.css via CSS Modules composes.
- Use shared styles for:
  - section headings
  - lead text
  - body text
  - card headings
  - card body text
  - stat labels and secondary text
- New pages should not redefine text styles if an equivalent shared style already exists.
- The project page is the main source of truth for text sizing and behavior.
- On mobile, typography should scale down similarly to the existing shared typography behavior.

Text content rules
- All text should be compatible with the formatText typography pipeline.
- Preserve proper Russian typography:
  - typographic quotes
  - em dashes
  - non-breaking spaces for short prepositions where appropriate
- Do not introduce formatting that conflicts with lib/formatText.ts.
- Be careful with short headings containing a colon. They should not force an unwanted non-breaking space after the colon.

Hero rules
- Hero sections should behave like the existing project-page hero system:
  - responsive
  - proportional image scaling
  - overflow hidden only when intentional
  - layered images can be wrapped in dedicated containers
- If multiple hero images are used, group them in a shared wrapper and control scaling through the wrapper, not by distorting the images.
- Hero must remain visually stable on mobile and should keep a sensible minimum height.
- Background images should fill the hero container fully and stay anchored predictably, usually top-left unless another behavior is explicitly required.

Component and structure rules
- Follow the project’s atomic structure:
  - ui
  - blocks
  - sections
  - layout
- Prefer semantic HTML and clean section-based composition.
- Keep JSX structure clear and easy to reuse in sandbox-content pages and public pages.

Responsive behavior
- Desktop behavior should remain consistent with the current site.
- Tablet/mobile layouts should:
  - stack columns vertically
  - reduce text sizes via shared typography rules
  - preserve image proportions
  - avoid horizontal scrolling
  - keep content aligned to the same side paddings as text sections
- If a visual group becomes too large on small screens, reduce its height or width by container rules, not by stretching the media.

Implementation preferences
- When creating new page styles, first look for an existing shared style before adding a new one.
- If a text style is reusable, place it in the shared typography module instead of duplicating it in the page CSS.
- Keep page-specific CSS focused on layout and composition, not on redefining global typography patterns.

Output expectation
- Produce production-ready TSX + CSS Module code.
- Keep it visually consistent with:
  - sandbox-content/main/main.tsx
  - sandbox-content/design-systems/design-systems.tsx
- Favor the project page style when there is any ambiguity.
```

## Строгий checklist-вариант

Использовать как короткую проверку перед финализацией новой страницы.

```text
Page Creation Checklist

Visual reference
- Use sandbox-content/design-systems/design-systems.tsx as the primary design reference.
- Use sandbox-content/main/main.tsx as the secondary reference.
- Keep the page visually consistent with the existing portfolio style.

Tech constraints
- Use TypeScript.
- Use Next.js App Router conventions.
- Use CSS Modules only.
- Do not use Tailwind.
- Do not use CSS-in-JS.

Tokens
- Use design tokens from styles/tokens.css.
- Do not hardcode colors if a token already exists.
- Do not hardcode spacing if a token already exists.
- Do not hardcode radius values if a token already exists.

Typography
- Reuse shared typography from sandbox-content/shared/typography.module.css.
- Prefer composes over redefining text styles locally.
- Use shared styles for section headings, lead text, body text, card titles, and card body text.
- Keep mobile typography behavior aligned with the shared typography module.

Text formatting
- Make all text compatible with lib/formatText.ts.
- Preserve Russian typography rules.
- Do not introduce formatting that conflicts with formatText.ts.
- Be careful with headings containing a colon.

Layout
- Keep content aligned to the existing reading width.
- Add 1rem horizontal page padding below the base content width.
- Avoid accidental right overflow.
- Use the same spacing rhythm as the existing pages.

Images and media
- Images must scale proportionally.
- Images must never be distorted.
- Use aspect-ratio where helpful.
- Use width: 100% and height: auto when appropriate.
- Use object-fit deliberately.

Hero
- Keep hero responsive.
- Maintain a sensible minimum hero height.
- If the hero uses layered images, wrap them in containers and scale via layout, not distortion.
- Background images should fill the hero cleanly and stay predictably anchored.

Responsive behavior
- Stack columns vertically on smaller screens.
- Reduce text sizes on mobile in the same way as the shared typography module.
- Ensure there is no horizontal scrolling.
- Ensure content and headings align with the same side paddings as body text.

Code organization
- Keep JSX semantic and section-based.
- Keep page-specific CSS focused on layout.
- Move reusable text styles into the shared typography module instead of duplicating them.

Definition of done
- Visual style matches the project page first, homepage second.
- Text styles come from the shared typography module where possible.
- Tokens are used consistently.
- Mobile layout is clean and without overflow.
- Images remain proportional.
- The page is ready to be used both in sandbox-content and public rendering.
```

## Что важно не забыть дальше

- Если в новой странице появляется новый повторяемый текстовый паттерн, его надо сначала проверить: это действительно новый типографический стиль или уже существующий можно переиспользовать через `composes`.
- Если меняется поведение типографики, надо помнить, что это может затронуть публичные страницы и sandbox одновременно.
- Если форматирование текста меняется в `lib/formatText.ts`, это влияет не только на новые строки, но и на то, как надо пересохранять уже существующие тексты в БД.

## Связь с остальной системой

- `styles/tokens.css` задаёт визуальные примитивы;
- `sandbox-content/shared/typography.module.css` задаёт общую типографику страниц;
- `lib/formatText.ts` отвечает за типографическую нормализацию текста;
- `sandbox-content/main/main.tsx` и `sandbox-content/design-systems/design-systems.tsx` работают как реальные визуальные референсы для генерации следующих страниц.

Этот документ нужен как опорная инструкция, чтобы новые страницы не уходили в сторону по ритму, типографике и responsive-поведению.
