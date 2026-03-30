/**
 * sandboxRuntimeLoader.ts
 *
 * Server-side: compiles sandbox TSX to a CJS bundle via esbuild.
 * Cache: .sandbox-cache/{slug}.cjs, invalidated on source change.
 *
 * CSS modules → { className: 'className' } maps so the bundle can run
 * without webpack. Actual styles served by /api/admin/sandbox-css/[slug].
 */

import 'server-only'
import fs from 'fs'
import path from 'path'

// /tmp is always writable by any user (including the nextjs uid-1001 container user)
export const SANDBOX_CACHE_DIR = path.join('/tmp', '.sandbox-cache')

// ── CSS helpers ────────────────────────────────────────────────────────────

function classNamesFromCss(css: string): Record<string, string> {
  const names = new Set<string>()
  for (const [, name] of css.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)\s*(?=[{,\s:])/g)) {
    names.add(name)
  }
  return Object.fromEntries([...names].map(n => [n, n]))
}

/**
 * Resolve `composes: ClassName from './path'` by inlining the referenced
 * CSS properties, so the file can be served as plain CSS.
 */
export function processComposesInCss(cssSource: string, cssFilePath: string): string {
  return cssSource.replace(
    /composes:\s*(\w+)\s+from\s+['"]([^'"]+)['"]\s*;/g,
    (_match, className: string, fromPath: string) => {
      try {
        const resolved = path.resolve(path.dirname(cssFilePath), fromPath)
        const shared = fs.readFileSync(resolved, 'utf-8')
        const match = shared.match(new RegExp(`\\.${className}\\s*\\{([^}]+)\\}`))
        return match ? match[1].trim() : ''
      } catch {
        return ''
      }
    },
  )
}

// ── Bundle compilation ─────────────────────────────────────────────────────

/**
 * Compile `sandbox-content/{slug}/{slug}.tsx` to a CJS bundle.
 * Returns the bundle source, or null if source is missing or build fails.
 *
 * Externals (injected by the client canvas at runtime):
 *   - react, react/jsx-runtime, react-dom  — browser globals
 *   - __sandboxText__                       — useText hook from @/lib/sandboxText
 */
export async function compileToBundle(slug: string): Promise<string | null> {
  const srcFile = path.join(process.cwd(), 'sandbox-content', slug, `${slug}.tsx`)
  if (!fs.existsSync(srcFile)) return null

  const outFile = path.join(SANDBOX_CACHE_DIR, `${slug}.cjs`)

  // Skip if cache is fresh
  try {
    const srcMtime = fs.statSync(srcFile).mtimeMs
    if (fs.existsSync(outFile) && fs.statSync(outFile).mtimeMs >= srcMtime) {
      return fs.readFileSync(outFile, 'utf-8')
    }
  } catch { /* rebuild */ }

  let esbuild: typeof import('esbuild')
  try {
    esbuild = (await import('esbuild')) as typeof import('esbuild')
  } catch {
    console.error('[sandboxRuntimeLoader] esbuild unavailable')
    return null
  }

  fs.mkdirSync(SANDBOX_CACHE_DIR, { recursive: true })

  try {
    await esbuild.build({
      entryPoints: [srcFile],
      outfile: outFile,
      bundle: true,
      // IIFE format: sets window.__SBX_COMPONENT__ = { default: ComponentFn }
      // The canvas reads this global after the script tag loads.
      format: 'iife',
      globalName: '__SBX_COMPONENT__',
      platform: 'browser',
      jsx: 'automatic',
      jsxImportSource: 'react',
      define: { 'process.env.NODE_ENV': '"production"' },
      absWorkingDir: process.cwd(),
      tsconfig: fs.existsSync(path.join(process.cwd(), 'tsconfig.json'))
        ? path.join(process.cwd(), 'tsconfig.json')
        : undefined,
      logLevel: 'silent',
      plugins: [
        // Redirect runtime deps to globals set by SandboxRuntimeCanvas before the script loads.
        // The canvas sets: window.__SBX_REACT__, __SBX_JSX__, __SBX_TEXT__
        {
          name: 'runtime-globals',
          setup(build) {
            const GLOBAL_MAP: Record<string, string> = {
              'react':               '__SBX_REACT__',
              'react/jsx-runtime':   '__SBX_JSX__',
              'react-dom':           '{}',
            }
            // react + react-dom
            build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, (args) => ({
              path: args.path, namespace: 'sbx-globals',
            }))
            // @/lib/sandboxText → __SBX_TEXT__
            build.onResolve({ filter: /^@\/lib\/sandboxText/ }, () => ({
              path: '@/lib/sandboxText', namespace: 'sbx-globals',
            }))
            // next/link → thin <a> wrapper (no Next.js router needed in IIFE context)
            build.onResolve({ filter: /^next\/link$/ }, () => ({
              path: 'next/link', namespace: 'sbx-globals',
            }))
            // next/image → thin <img> wrapper
            build.onResolve({ filter: /^next\/image$/ }, () => ({
              path: 'next/image', namespace: 'sbx-globals',
            }))
            build.onLoad({ filter: /.*/, namespace: 'sbx-globals' }, (args) => {
              if (GLOBAL_MAP[args.path] !== undefined) {
                return { contents: `module.exports = ${GLOBAL_MAP[args.path]}`, loader: 'js' }
              }
              if (args.path === '@/lib/sandboxText') {
                return { contents: `module.exports = __SBX_TEXT__`, loader: 'js' }
              }
              if (args.path === 'next/link') {
                return {
                  // Capture React at IIFE init time (before window globals are cleared).
                  contents: `
var __R = __SBX_REACT__;
var __Link = function(props) {
  var h = typeof props.href === 'string' ? props.href : (props.href && props.href.pathname) || '#';
  return __R.createElement('a', { href: h, className: props.className, style: props.style, target: props.target, rel: props.rel, 'aria-label': props['aria-label'] }, props.children);
};
module.exports = __Link;
module.exports.default = __Link;
`,
                  loader: 'js',
                }
              }
              if (args.path === 'next/image') {
                return {
                  // Capture React at IIFE init time (before window globals are cleared).
                  contents: `
var __R = __SBX_REACT__;
var __Img = function(props) {
  return __R.createElement('img', { src: props.src, alt: props.alt || '', width: props.width, height: props.height, className: props.className, style: props.style });
};
module.exports = __Img;
module.exports.default = __Img;
`,
                  loader: 'js',
                }
              }
              return { contents: `module.exports = {}`, loader: 'js' }
            })
          },
        },
        // CSS modules → { className: 'className' } (matches the raw CSS served by the CSS endpoint)
        {
          name: 'css-modules',
          setup(build) {
            build.onLoad({ filter: /\.css$/ }, ({ path: cssPath }) => {
              try {
                const css = fs.readFileSync(cssPath, 'utf-8')
                return { contents: `module.exports=${JSON.stringify(classNamesFromCss(css))}`, loader: 'js' }
              } catch {
                return { contents: 'module.exports={}', loader: 'js' }
              }
            })
          },
        },
      ],
    })
  } catch (e) {
    console.error(`[sandboxRuntimeLoader] Build failed for "${slug}":`, e)
    try { fs.unlinkSync(outFile) } catch { /* ok */ }
    return null
  }

  return fs.readFileSync(outFile, 'utf-8')
}
