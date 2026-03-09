'use client'

import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import styles from './page.module.css'

// Maps display filename → path relative to project root (for the save API)
const FILE_PATHS: Record<string, string> = {
  'Button.tsx':             'components/ui/Button.tsx',
  'Button.module.css':      'components/ui/Button.module.css',
  'Input.tsx':              'components/ui/Input.tsx',
  'Input.module.css':       'components/ui/Input.module.css',
  'Dropdown.tsx':           'components/ui/Dropdown.tsx',
  'Dropdown.module.css':    'components/ui/Dropdown.module.css',
  'Toast.tsx':              'components/ui/Toast.tsx',
  'Toast.module.css':       'components/ui/Toast.module.css',
  'Carousel.tsx':           'components/ui/Carousel.tsx',
  'Carousel.module.css':    'components/ui/Carousel.module.css',
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type Props = {
  id: string
  name: string
  sources: Record<string, string>
  children: ReactNode
}

export function ComponentBlock({ id, name, sources, children }: Props) {
  const fileNames = Object.keys(sources)
  const [activeTab, setActiveTab] = useState<'preview' | string>('preview')

  // Track edited content per file; undefined = not yet edited (use original)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({})
  const [copied, setCopied] = useState(false)

  const getContent = (fileName: string) => edits[fileName] ?? sources[fileName]
  const isDirty = (fileName: string) => fileName in edits && edits[fileName] !== sources[fileName]

  const handleChange = useCallback((fileName: string, value: string) => {
    setEdits(prev => ({ ...prev, [fileName]: value }))
    setSaveStates(prev => ({ ...prev, [fileName]: 'idle' }))
  }, [])

  const handleSave = useCallback(async (fileName: string) => {
    const filePath = FILE_PATHS[fileName]
    if (!filePath) return

    setSaveStates(prev => ({ ...prev, [fileName]: 'saving' }))
    try {
      const res = await fetch('/api/admin/ui-kit/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content: getContent(fileName) }),
      })
      setSaveStates(prev => ({
        ...prev,
        [fileName]: res.ok ? 'saved' : 'error',
      }))
      if (res.ok) setTimeout(() => setSaveStates(prev => ({ ...prev, [fileName]: 'idle' })), 2000)
    } catch {
      setSaveStates(prev => ({ ...prev, [fileName]: 'error' }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits])

  const handleCopy = useCallback(async () => {
    const tsxFile = fileNames.find(f => f.endsWith('.tsx')) ?? fileNames[0]
    try {
      await navigator.clipboard.writeText(getContent(tsxFile))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileNames, edits])

  const saveLabel = (fileName: string): string => {
    const state = saveStates[fileName] ?? 'idle'
    if (state === 'saving') return 'Saving...'
    if (state === 'saved')  return 'Saved!'
    if (state === 'error')  return 'Error!'
    return 'Save'
  }

  const isSourceTab = activeTab !== 'preview'

  return (
    <section id={id} className={styles.block}>
      <div className={styles.blockHeader}>
        <h2 className={styles.blockTitle}>{name}</h2>
        <div className={styles.blockActions}>
          {isSourceTab && (
            <button
              className={`${styles.saveBtn} ${isDirty(activeTab) ? styles.saveBtnDirty : ''} ${saveStates[activeTab] === 'error' ? styles.saveBtnError : ''}`}
              onClick={() => handleSave(activeTab)}
              disabled={!isDirty(activeTab) || saveStates[activeTab] === 'saving'}
              type="button"
            >
              {saveLabel(activeTab)}
            </button>
          )}
          <button className={styles.copyBtn} onClick={handleCopy} type="button">
            {copied ? 'Copied!' : 'Copy TSX'}
          </button>
        </div>
      </div>

      <div className={styles.tabBar}>
        <button
          type="button"
          className={activeTab === 'preview' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        {fileNames.map(fileName => (
          <button
            key={fileName}
            type="button"
            className={activeTab === fileName ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(fileName)}
          >
            {fileName}
            {isDirty(fileName) && <span className={styles.dirtyDot} aria-hidden />}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'preview' ? (
          <div className={styles.preview}>{children}</div>
        ) : (
          <textarea
            className={styles.editor}
            value={getContent(activeTab)}
            onChange={e => handleChange(activeTab, e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        )}
      </div>
    </section>
  )
}
