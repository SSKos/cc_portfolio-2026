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
  { id: '1', src: '/uploads/8e444982-d9d8-4331-ab48-f320d4e3d153.png', alt: 'Слайд 1' },
  { id: '2', src: '/uploads/7524ab19-cb9c-4aad-9ae2-f9072539721e.png', alt: 'Слайд 2' },
  { id: '3', src: '/uploads/83158a04-8767-453e-bbad-308f7b1779c6.png', alt: 'Слайд 3' },
]
const DEMO_COVER = '/uploads/68b5e369-add0-4745-821b-8f8e3238fe57.png'
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
