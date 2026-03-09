'use client'

import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import styles from './page.module.css'

export function ToastPreview() {
  const { showToast } = useToast()

  return (
    <div className={styles.previewRow}>
      <Button
        variant="primary"
        onClick={() => showToast('Операция выполнена успешно', 'success')}
      >
        Show success
      </Button>
      <Button
        variant="secondary"
        onClick={() => showToast('Произошла ошибка при сохранении', 'error')}
      >
        Show error
      </Button>
    </div>
  )
}
