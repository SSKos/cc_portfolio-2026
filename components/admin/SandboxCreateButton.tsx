'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, IconPlus } from '@/components/ui/Button'
import { EditContentModal } from './EditContentModal'

export function SandboxCreateButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleSaved() {
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="create" icon={<IconPlus />} onClick={() => setOpen(true)}>
        Добавить файл
      </Button>

      {open && (
        <EditContentModal
          mode={{ type: 'create' }}
          onClose={() => setOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
