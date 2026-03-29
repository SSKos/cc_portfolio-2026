'use client'

/**
 * SandboxRuntimeCanvas
 *
 * Renders a sandbox component that was uploaded after the production build
 * and is not part of the Next.js bundle.
 *
 * Loading flow:
 *   1. Set window globals: __SBX_REACT__, __SBX_JSX__, __SBX_TEXT__
 *   2. Inject a <script> tag pointing to /api/admin/sandbox-bundle/[slug]
 *      The bundle is compiled to IIFE format and sets window.__SBX_COMPONENT__
 *   3. On script load: read the component from window.__SBX_COMPONENT__.default
 *   4. Load raw CSS via <link rel="stylesheet" href="/api/admin/sandbox-css/[slug]">
 *   5. Render inside SandboxTextProvider (full text editing works)
 *
 * Because the bundle is executed in the normal browser context (not eval),
 * all React hooks, state, effects, and animations work correctly.
 */

import { useEffect, useRef, useState, type ComponentType } from 'react'
import * as React from 'react'
import * as ReactJSXRuntime from 'react/jsx-runtime'
import { useText, SandboxTextProvider } from '@/lib/sandboxText'

// Type for the global set by the IIFE bundle
interface SbxBundle { default?: ComponentType }

declare global {
  interface Window {
    __SBX_REACT__?: typeof React
    __SBX_JSX__?: typeof ReactJSXRuntime
    __SBX_TEXT__?: { useText: typeof useText }
    __SBX_COMPONENT__?: SbxBundle
  }
}

type Props = {
  slug: string
  contentId: string
  initialTexts: Record<string, string>
  bundleUrl?: string
  cssUrl?: string
}

export function SandboxRuntimeCanvas({
  slug,
  contentId,
  initialTexts,
  bundleUrl = `/api/admin/sandbox-bundle/${slug}`,
  cssUrl = `/api/admin/sandbox-css/${slug}`,
}: Props) {
  const [Component, setComponent] = useState<ComponentType | null>(null)
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading')
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    // Inject runtime deps as window globals so the IIFE bundle can access them.
    // react + jsx-runtime: same instance as the rest of the app → hooks work.
    // sandboxText: same module → useText reads from the SandboxTextProvider below.
    window.__SBX_REACT__ = React
    window.__SBX_JSX__ = ReactJSXRuntime
    window.__SBX_TEXT__ = { useText }

    const script = document.createElement('script')
    script.src = `${bundleUrl}?t=${Date.now()}`

    script.onload = () => {
      const comp = window.__SBX_COMPONENT__?.default ?? null
      if (comp) {
        setComponent(() => comp)
        setState('ready')
      } else {
        setState('error')
      }
      // Clean up globals — no longer needed after the IIFE captured them
      window.__SBX_REACT__ = undefined
      window.__SBX_JSX__ = undefined
      window.__SBX_TEXT__ = undefined
      window.__SBX_COMPONENT__ = undefined
    }

    script.onerror = () => {
      setState('error')
      window.__SBX_REACT__ = undefined
      window.__SBX_JSX__ = undefined
      window.__SBX_TEXT__ = undefined
    }

    scriptRef.current = script
    document.body.appendChild(script)

    return () => {
      if (scriptRef.current) {
        try { document.body.removeChild(scriptRef.current) } catch { /* ok */ }
      }
    }
  }, [bundleUrl])

  if (state === 'loading') {
    return (
      <div style={{ padding: '40px 32px', color: 'var(--text-darker)', fontWeight: 300 }}>
        Компиляция…
      </div>
    )
  }

  if (state === 'error' || !Component) {
    return (
      <div style={{ padding: '40px 32px', color: 'var(--alerts-error)', fontWeight: 300 }}>
        Не удалось загрузить компонент. Проверь консоль сервера (bundle API).
      </div>
    )
  }

  return (
    <>
      {/* Raw CSS with composes: resolved — styles for runtime-compiled components */}
      <link rel="stylesheet" href={cssUrl} />

      <SandboxTextProvider slug={slug} contentId={contentId} initialTexts={initialTexts}>
        <Component />
      </SandboxTextProvider>
    </>
  )
}
