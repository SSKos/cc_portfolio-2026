'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Editor, { loader, type BeforeMount, type Monaco, type OnMount } from '@monaco-editor/react'
import styles from './SandboxCodeEditor.module.css'

type EditorInstance = Parameters<OnMount>[0]

// ─── Types ────────────────────────────────────────────────────────────────────

interface CodeFile {
  filename: string
  language: string
  content: string
  scope: 'page' | 'shared'
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  slug: string
  name: string
}

export function SandboxCodeEditor({ slug, name }: Props) {
  const apiBase = `/api/admin/sandbox/${slug}/code`

  const [editorReady, setEditorReady] = useState(false)
  const [files, setFiles] = useState<CodeFile[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState(false)

  // Keep editor instance to get current value before save
  const editorRef = useRef<EditorInstance | null>(null)

  // ── Load files ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function setupMonaco() {
      const monaco = await import('monaco-editor')
      if (cancelled) return
      // Use the bundled monaco instance instead of the default CDN loader.
      loader.config({ monaco })
      setEditorReady(true)
    }

    void setupMonaco()
    return () => { cancelled = true }
  }, [])

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiBase)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as { files: CodeFile[] }
      setFiles(data.files)
      setDrafts({})
      setActiveIndex(0)
    } catch {
      setError('Не удалось загрузить файлы')
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  // ── Active file ────────────────────────────────────────────────────────────

  const activeFile = files[activeIndex] ?? null

  function contentFor(file: CodeFile): string {
    return drafts[file.filename] ?? file.content
  }

  // Flush current editor value into drafts before switching tabs
  function flushCurrentEditor() {
    if (editorRef.current && activeFile) {
      const value = editorRef.current.getValue()
      if (value !== contentFor(activeFile)) {
        setDrafts(prev => ({ ...prev, [activeFile.filename]: value }))
      }
    }
  }

  function handleTabClick(index: number) {
    flushCurrentEditor()
    setActiveIndex(index)
  }

  const handleEditorMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance
  }

  function handleEditorChange(value: string | undefined) {
    if (activeFile && value !== undefined) {
      setDrafts(prev => ({ ...prev, [activeFile.filename]: value }))
    }
  }

  const handleBeforeMount: BeforeMount = useCallback((monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      allowJs: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    })

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    })
  }, [])

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!files.length) return
    flushCurrentEditor()

    setSaving(true)
    setError(null)
    try {
      // Only send files that have unsaved edits
      const dirtyFiles = files
        .filter(f => f.filename in drafts && drafts[f.filename] !== f.content)
        .map(f => ({ filename: f.filename, content: drafts[f.filename], scope: f.scope }))

      if (!dirtyFiles.length) return

      const res = await fetch(apiBase, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: dirtyFiles }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Save failed')
      }

      // Commit drafts into files state
      setFiles(prev => prev.map(f => ({
        ...f,
        content: drafts[f.filename] ?? f.content,
      })))
      setDrafts({})
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  // ── Dirty state ────────────────────────────────────────────────────────────

  const isDirty = files.some(f => f.filename in drafts && drafts[f.filename] !== f.content)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href={`/admin/sandbox/${slug}`} className={styles.back}>
            ← {name}
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.current}>Код</span>
        </div>

        <div className={styles.headerActions}>
          {error && <span className={styles.errorMsg}>{error}</span>}
          {savedMsg && <span className={styles.savedMsg}>Сохранено!</span>}
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || loading || !isDirty}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* File tabs */}
      {files.length > 1 && (
        <div className={styles.tabs}>
          {files.map((file, i) => (
            <button
              key={file.filename}
              className={[
                styles.tab,
                i === activeIndex ? styles.tabActive : '',
                file.filename in drafts ? styles.tabDirty : '',
                file.scope === 'shared' ? styles.tabShared : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleTabClick(i)}
              title={file.scope === 'shared' ? 'shared/ — общий для всех страниц' : undefined}
            >
              {file.scope === 'shared' ? `shared/${file.filename}` : file.filename}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className={styles.editorWrap}>
        {!editorReady || loading ? (
          <p className={styles.stateMsg}>Загрузка…</p>
        ) : !activeFile ? (
          <p className={styles.stateMsg}>Файлы не найдены</p>
        ) : (
          <Editor
            height="100%"
            path={activeFile.scope === 'shared'
              ? `/sandbox-content/shared/${activeFile.filename}`
              : `/sandbox-content/${slug}/${activeFile.filename}`
            }
            language={activeFile.language}
            value={contentFor(activeFile)}
            theme="vs-dark"
            beforeMount={handleBeforeMount}
            onMount={handleEditorMount}
            onChange={handleEditorChange}
            options={{
              fontSize: 13,
              lineNumbers: 'on',
              links: false,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'off',
              tabSize: 2,
              renderWhitespace: 'boundary',
              padding: { top: 16, bottom: 16 },
            }}
          />
        )}
      </div>
    </div>
  )
}
