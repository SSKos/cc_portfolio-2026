import styles from './obo-mne.module.css'
import { Carousel } from '@/components/ui/Carousel'

/**
 * Sandbox: obo-mne
 * Обо мне
 *
 * Редактируй этот файл в IDE — изменения видны с hot reload.
 * Превью: /dev/sandbox/obo-mne
 */

// CAROUSEL: данные слайдов
// Каждый слайд: { id: string, src: string, alt?: string }
// Пути берёшь из кнопки "Copy path" в UI Kit → Images
const DEMO_SLIDES = [
  { id: '1', src: '/media/2', alt: 'Слайд 1' },
  { id: '2', src: '/media/5', alt: 'Слайд 2' },
  { id: '3', src: '/media/4', alt: 'Слайд 3' },
]
const DEMO_COVER = '/media/1'
// END CAROUSEL

export default function OboMnePage() {
  return (
    <div className={styles.page}>

      {/* CAROUSEL: контейнер задаёт размер, Carousel заполняет его как cover.
          Высоту меняй здесь — карусель подстроится.
          border-radius + overflow:hidden обрезают углы слайдов. */}
      <div className={styles.carouselWrap}>
        <Carousel slides={DEMO_SLIDES} cover={DEMO_COVER} />
      </div>
      {/* END CAROUSEL */}

      <h1 className={styles.title}>Обо мне</h1>
      {/* Твоя вёрстка здесь */}

    </div>
  )
}
