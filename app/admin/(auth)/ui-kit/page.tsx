import fs from 'fs'
import path from 'path'
import { ComponentBlock } from './ComponentBlock'
import { UiKitSidebar } from './UiKitSidebar'
import { InputShowcase } from '@/app/dev/ui/InputShowcase'
import { DropdownShowcase } from '@/app/dev/ui/DropdownShowcase'
import { CarouselShowcase } from '@/app/dev/ui/CarouselShowcase'
import { ToastPreview } from './ToastPreview'
import { ImageGallery } from './ImageGallery'
import { Button } from '@/components/ui/Button'
import styles from './page.module.css'

function readSrc(relPath: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), relPath), 'utf-8')
  } catch {
    return '// Source not available in this environment'
  }
}

const COMPONENTS: { id: string; name: string; sources: Record<string, string> }[] = [
  {
    id: 'button',
    name: 'Button',
    sources: {
      'Button.tsx': readSrc('components/ui/Button.tsx'),
      'Button.module.css': readSrc('components/ui/Button.module.css'),
    },
  },
  {
    id: 'input',
    name: 'Input',
    sources: {
      'Input.tsx': readSrc('components/ui/Input.tsx'),
      'Input.module.css': readSrc('components/ui/Input.module.css'),
    },
  },
  {
    id: 'dropdown',
    name: 'Dropdown',
    sources: {
      'Dropdown.tsx': readSrc('components/ui/Dropdown.tsx'),
      'Dropdown.module.css': readSrc('components/ui/Dropdown.module.css'),
    },
  },
  {
    id: 'toast',
    name: 'Toast',
    sources: {
      'Toast.tsx': readSrc('components/ui/Toast.tsx'),
      'Toast.module.css': readSrc('components/ui/Toast.module.css'),
    },
  },
  {
    id: 'carousel',
    name: 'Carousel',
    sources: {
      'Carousel.tsx': readSrc('components/ui/Carousel.tsx'),
      'Carousel.module.css': readSrc('components/ui/Carousel.module.css'),
    },
  },
]

export default function AdminUiKitPage() {
  return (
    <div className={styles.layout}>
      <UiKitSidebar items={COMPONENTS.map(c => ({ id: c.id, name: c.name }))} />

      <main className={styles.content}>
        <h1 className={styles.pageTitle}>UI Kit</h1>

        <ComponentBlock id="button" name="Button" sources={COMPONENTS[0].sources}>
          <div className={styles.previewRow}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
          <div className={styles.previewRow}>
            <Button variant="primary" icon={<span aria-hidden>→</span>}>
              С иконкой
            </Button>
            <Button variant="primary" icon={<span aria-hidden>+</span>} />
          </div>
          <div className={styles.previewRow}>
            <Button action="delete" aria-label="delete" />
            <Button action="add" aria-label="add" />
            <Button action="edit" aria-label="edit" />
            <Button action="hide" aria-label="hide" />
            <Button action="online" aria-label="online" />
            <Button action="preview" aria-label="preview" />
          </div>
        </ComponentBlock>

        <ComponentBlock id="input" name="Input" sources={COMPONENTS[1].sources}>
          <InputShowcase />
        </ComponentBlock>

        <ComponentBlock id="dropdown" name="Dropdown" sources={COMPONENTS[2].sources}>
          <DropdownShowcase />
        </ComponentBlock>

        <ComponentBlock id="toast" name="Toast" sources={COMPONENTS[3].sources}>
          <ToastPreview />
        </ComponentBlock>

        <ComponentBlock id="carousel" name="Carousel" sources={COMPONENTS[4].sources}>
          <CarouselShowcase />
        </ComponentBlock>

        {/* Галерея медиафайлов — вне ComponentBlock, это не UI-компонент */}
        <ImageGallery />
      </main>
    </div>
  )
}
