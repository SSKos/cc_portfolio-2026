#!/usr/bin/env ts-node
/**
 * tokens-to-css.ts
 *
 * Converts a Tokens Studio tokens.json into styles/tokens.css.
 * Run via: npm run tokens
 *
 * Supports:
 *   - Nested token groups (flattened to dot-paths)
 *   - Alias resolution: { value: "{color.primary.500}" } → actual value
 *   - Reference substitution: { some.dot.path } → var(--short-name) so reusable token names are preserved
 *   - VariableID refs: if styles/from-figma/variable-id-map.json exists ({"1:38": "primitives.colors.light.gray-900", ...}), {unknown.VariableID:1:38} → var(--light-gray-900)
 *   - Shadow objects → CSS box-shadow string
 *   - Both Tokens Studio formats: value/type and $value/$type (DTCG)
 *   - Numeric values get "px" for spacing, radius, fontSize, lineHeight, letterSpacing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ─── Paths (relative to project root; work from any cwd and on server) ───────

const __dirnameScript = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirnameScript, '..');
const FROM_FIGMA_DIR = path.join(PROJECT_ROOT, 'styles', 'from-figma');
const TOKENS_PATH = path.join(FROM_FIGMA_DIR, 'tokens.json');
const VARIABLE_ID_MAP_PATH = path.join(FROM_FIGMA_DIR, 'variable-id-map.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'styles', 'tokens.css');
const BASE_CSS_PATH = path.join(PROJECT_ROOT, 'styles', 'base.css');

// ─── Types ───────────────────────────────────────────────────────────────────

type TokenValue = string | number | Record<string, unknown> | Array<Record<string, unknown>>;

interface Token {
  value: TokenValue;
  type?: string;
  description?: string;
}

type TokenTree = Record<string, unknown>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** True if the object is a leaf token (has a value/type pair). */
function isToken(obj: unknown): obj is Token {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  // Support both Tokens Studio format (value) and DTCG format ($value)
  return 'value' in o || '$value' in o;
}

/** Normalise both Tokens Studio and DTCG token shapes to a single Token. */
function normalise(obj: Record<string, unknown>): Token {
  return {
    value: (obj['$value'] ?? obj['value']) as TokenValue,
    type: (obj['$type'] ?? obj['type']) as string | undefined,
    description: (obj['$description'] ?? obj['description']) as string | undefined,
  };
}

// ─── Flatten ─────────────────────────────────────────────────────────────────

/**
 * Walk the token tree recursively, emitting dot-path → Token for every leaf.
 * Metadata keys ($type, $description, $value) at group level are skipped.
 */
function flattenTokens(tree: TokenTree, prefix = ''): Map<string, Token> {
  const result = new Map<string, Token>();

  for (const [key, node] of Object.entries(tree)) {
    // Skip DTCG group-level metadata
    if (key === '$type' || key === '$description' || key === '$value') continue;

    const dotPath = prefix ? `${prefix}.${key}` : key;

    if (isToken(node)) {
      result.set(dotPath, normalise(node as unknown as Record<string, unknown>));
    } else if (typeof node === 'object' && node !== null) {
      for (const [k, v] of flattenTokens(node as TokenTree, dotPath)) {
        result.set(k, v);
      }
    }
  }

  return result;
}

// ─── Alias resolution ────────────────────────────────────────────────────────

const ALIAS_RE = /^\{([^}]+)\}$/;
const VARIABLE_ID_RE = /^unknown\.VariableID:(\d+):(\d+)$/;

/** Resolve a single alias reference, recursing if the target is also an alias. */
function resolveAlias(value: string, allTokens: Map<string, Token>, seen = new Set<string>()): string {
  const match = value.match(ALIAS_RE);
  if (!match) return value;

  const refPath = match[1];
  if (seen.has(refPath)) {
    console.warn(`Warning: circular alias detected for {${refPath}}, leaving unresolved.`);
    return value;
  }

  const target = allTokens.get(refPath);
  if (!target) {
    console.warn(`Warning: alias {${refPath}} not found in token tree.`);
    return value;
  }

  const resolved = String(target.value);
  return resolveAlias(resolved, allTokens, new Set([...seen, refPath]));
}

// ─── base.css font family vars ───────────────────────────────────────────────

const GENERIC_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace',
  'inherit', 'initial', 'unset', 'revert',
]);

/**
 * Reads styles/base.css and returns a map of font family name → CSS var name.
 * e.g. "Nunito Sans" → "--font-primary"
 *
 * Looks for declarations like:
 *   --font-primary: var(--font-nunito-sans), 'Nunito Sans', sans-serif;
 * and extracts all quoted font names from the value.
 */
function parseFontFamilyVars(cssPath: string): Map<string, string> {
  const result = new Map<string, string>();
  if (!fs.existsSync(cssPath)) return result;

  const css = fs.readFileSync(cssPath, 'utf-8');
  const declRe = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;

  while ((m = declRe.exec(css)) !== null) {
    const varName = `--${m[1]}`;
    const value = m[2];
    const quotedRe = /['"]([^'"]+)['"]/g;
    let qm: RegExpExecArray | null;

    while ((qm = quotedRe.exec(value)) !== null) {
      const fontName = qm[1].trim();
      if (!GENERIC_FAMILIES.has(fontName.toLowerCase())) {
        result.set(fontName.toLowerCase(), varName);
      }
    }
  }

  return result;
}

// ─── Shadow object → CSS ─────────────────────────────────────────────────────

function shadowObjectToCSS(s: Record<string, unknown>): string {
  const px = (v: unknown) => { const str = String(v ?? 0); return str.endsWith('px') ? str : `${str}px`; };
  const x = px(s.offsetX ?? s.x);
  const y = px(s.offsetY ?? s.y);
  const blur = px(s.blur);
  const spread = px(s.spread);
  const color = s.color ?? 'rgba(0,0,0,0.25)';
  const inset = s.type === 'innerShadow' ? 'inset ' : '';
  return `${inset}${x} ${y} ${blur} ${spread} ${color}`;
}

// ─── Short naming: strip, rename, dedupe ───────────────────────────────────────

/** Organisational segments from Figma to remove from paths before building CSS names. */
const STRIP_SEGMENTS = new Set([
  'primitives',
  'colors',
  'semantic',
  'components',
  'numbers',
  '_styles',
]);

/** Shorten repeated or long segment names. */
const RENAME_SEGMENTS: Record<string, string> = {
  'paddings': 'pad',
  'corners': 'radius',
  'f-size': 'fs',
  'f-line': 'lh',
  'overlays': 'overlay',
  'visibility': 'vis',
  'typography': 'typo',
  'effect': 'effect',
};

/**
 * Normalise dot-path for short CSS variable names:
 * 1) Split by `.` and expand segments containing `/`
 * 2) Remove segments in STRIP_SEGMENTS (case-insensitive)
 * 3) Apply RENAME_SEGMENTS (by lowercase key)
 * 4) Dedupe: drop segment if it equals previous or if current starts with previous + '-'
 * 5) Join with `.`
 */
function shortenDotPath(dotPath: string): string {
  const raw = dotPath.split('.').flatMap(seg => seg.split('/'));
  const filtered = raw.filter(seg => !STRIP_SEGMENTS.has(seg.toLowerCase()));
  const renamed = filtered.map(seg => RENAME_SEGMENTS[seg.toLowerCase()] ?? seg);
  const deduped: string[] = [];
  for (const seg of renamed) {
    const prev = deduped[deduped.length - 1];
    if (prev !== undefined && (seg === prev || seg.startsWith(prev + '-'))) {
      deduped.pop();
    }
    deduped.push(seg);
  }
  return deduped.join('.');
}

// ─── CSS variable naming ──────────────────────────────────────────────────────

/** Safe for CSS custom property names: replace `.` and `/` with `-`. */
function toCSSVarName(path: string): string {
  return path.replace(/[./]/g, '-');
}

/** Map a dot-path to a short CSS custom property name. */
function pathToCSSVar(dotPath: string): string {
  const shortened = shortenDotPath(dotPath);
  const name = toCSSVarName(shortened);
  // CSS custom properties must not start with a digit after --
  if (!name || /^\d/.test(name)) {
    return `--${toCSSVarName(dotPath)}`;
  }
  return `--${name}`;
}

// ─── Value → CSS string ───────────────────────────────────────────────────────

/** Categories / sub-properties where bare numbers receive a "px" suffix. */
const PX_CATEGORIES = new Set(['spacing', 'radius']);
const PX_TYPOGRAPHY_PROPS = new Set(['fontSize', 'lineHeight', 'letterSpacing']);

type GetRefAsVar = (refPath: string) => string;

function tokenValueToCSS(
  dotPath: string,
  token: Token,
  allTokens: Map<string, Token>,
  getRefAsVar: GetRefAsVar | null,
  variableIdToPath: Map<string, string> | null,
): string {
  const { value } = token;

  // Shadow object
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return shadowObjectToCSS(value as Record<string, unknown>);
  }

  // Shadow array (multiple layers)
  if (Array.isArray(value)) {
    return value.map(s => shadowObjectToCSS(s as Record<string, unknown>)).join(', ');
  }

  let str = String(value);

  // Reference: substitute with var(--short-name)
  if (ALIAS_RE.test(str) && getRefAsVar) {
    const refPath = str.match(ALIAS_RE)![1];
    let pathToUse: string | null = allTokens.has(refPath) ? refPath : null;
    if (!pathToUse && variableIdToPath && VARIABLE_ID_RE.test(refPath)) {
      const m = refPath.match(VARIABLE_ID_RE);
      if (m) pathToUse = variableIdToPath.get(`${m[1]}:${m[2]}`) ?? null;
    }
    if (pathToUse) return getRefAsVar(pathToUse);
  }

  // Fallback: resolve to literal (or leave unresolved)
  if (ALIAS_RE.test(str)) {
    str = resolveAlias(str, allTokens);
  }

  // Add px to bare numeric values where appropriate
  const [category, sub] = dotPath.split('.');
  const isNumeric = /^\d+(\.\d+)?$/.test(str);

  if (isNumeric) {
    if (PX_CATEGORIES.has(category)) {
      str = `${str}px`;
    } else if (category === 'typography' && PX_TYPOGRAPHY_PROPS.has(sub)) {
      str = `${str}px`;
    }
  }

  return str;
}

// ─── Category metadata for output grouping (by original dot-path first segment) ─

const CATEGORY_ORDER = [
  'primitives',
  'semantic',
  'components',
  'columns',
  '_styles/color',
  '_styles/typography',
  '_styles/effect',
];

const CATEGORY_LABELS: Record<string, string> = {
  'primitives': 'Primitives',
  'semantic': 'Semantic',
  'components': 'Components',
  'columns': 'Columns',
  '_styles/color': 'Styles: Color',
  '_styles/typography': 'Styles: Typography',
  '_styles/effect': 'Styles: Effect',
};

const SEPARATOR_WIDTH = 66;

function sectionComment(label: string): string {
  const dashes = '─'.repeat(Math.max(2, SEPARATOR_WIDTH - label.length));
  return `  /* ─── ${label} ${dashes} */`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function generate(): void {
  if (!fs.existsSync(TOKENS_PATH)) {
    console.error(`Error: tokens file not found at ${TOKENS_PATH}\n`);
    console.error('To get started:');
    console.error('  1. Create the folder: styles/from-figma/');
    console.error('  2. Open your Figma file and launch the Tokens Studio plugin');
    console.error('  3. Export tokens (menu → Export → JSON)');
    console.error('  4. Save the file as styles/from-figma/tokens.json');
    console.error('  5. Run: npm run tokens\n');
    process.exit(1);
  }

  let raw: string;
  try {
    raw = fs.readFileSync(TOKENS_PATH, 'utf-8');
  } catch (err) {
    console.error(`Error: could not read ${TOKENS_PATH}:`, (err as Error).message);
    process.exit(1);
  }

  let tree: TokenTree;
  try {
    tree = JSON.parse(raw) as TokenTree;
  } catch (err) {
    console.error(`Error: tokens.json is not valid JSON:`, (err as Error).message);
    process.exit(1);
  }

  const allTokens = flattenTokens(tree);
  const fontFamilyVars = parseFontFamilyVars(BASE_CSS_PATH);
  if (fontFamilyVars.size > 0) {
    console.log(`✓ base.css: found ${fontFamilyVars.size} font family var(s): ${[...fontFamilyVars.entries()].map(([f, v]) => `"${f}" → ${v}`).join(', ')}`);
  }

  // Collision detection: short name → list of dot-paths that map to it
  const shortNameToPaths = new Map<string, string[]>();
  for (const dotPath of allTokens.keys()) {
    const short = pathToCSSVar(dotPath);
    if (!shortNameToPaths.has(short)) shortNameToPaths.set(short, []);
    shortNameToPaths.get(short)!.push(dotPath);
  }
  const collisionPaths = new Set<string>();
  for (const paths of shortNameToPaths.values()) {
    if (paths.length > 1) {
      for (const p of paths) collisionPaths.add(p);
      console.warn(`Warning: short name collision for ${paths[0]} (${paths.length} paths). Using full names.`);
    }
  }

  /** Final CSS var name: short unless this dot-path is in a collision. */
  function cssVarName(dotPath: string): string {
    if (collisionPaths.has(dotPath)) {
      return `--${toCSSVarName(dotPath)}`;
    }
    return pathToCSSVar(dotPath);
  }

  /** Resolve a reference to var(--short-name) so reusable token names are preserved. */
  const getRefAsVar: GetRefAsVar = (refPath) => `var(${cssVarName(refPath)})`;

  let variableIdToPath: Map<string, string> | null = null;
  if (fs.existsSync(VARIABLE_ID_MAP_PATH)) {
    try {
      const raw = fs.readFileSync(VARIABLE_ID_MAP_PATH, 'utf-8');
      const obj = JSON.parse(raw) as Record<string, string>;
      variableIdToPath = new Map(Object.entries(obj));
    } catch (e) {
      console.warn('Warning: could not load variable-id-map.json, VariableID refs will stay unresolved.');
    }
  }

  // Bucket tokens by top-level category (original dot-path first segment)
  type Entry = { cssVar: string; cssValue: string; description?: string };
  const groups = new Map<string, Entry[]>();

  for (const [dotPath, token] of allTokens) {
    const category = dotPath.split('.')[0];
    if (!groups.has(category)) groups.set(category, []);

    // Handle typography objects explicitly
    if (
      token.type === 'typography' ||
      (typeof token.value === 'object' && token.value !== null && 'fontFamily' in token.value && !Array.isArray(token.value))
    ) {
      const val = token.value as Record<string, string>;
      const baseVar = cssVarName(dotPath);

      const subPaths: Record<string, string> = {
        fontFamily: 'font-family',
        fontWeight: 'font-weight',
        fontSize: 'font-size',
        lineHeight: 'line-height',
        letterSpacing: 'letter-spacing',
        textCase: 'text-transform',
        textDecoration: 'text-decoration',
      };

      const fw = String(val.fontWeight || '400');
      const weightMap: Record<string, string> = {
        Thin: '100',
        ExtraLight: '200',
        Light: '300',
        Regular: '400',
        Medium: '500',
        SemiBold: '600',
        Bold: '700',
        ExtraBold: '800',
        Black: '900',
      };
      const resolvedWeight = weightMap[fw] || fw;

      const fs = String(val.fontSize || 'inherit');
      const lh = String(val.lineHeight || 'normal');
      let ff = String(val.fontFamily || 'inherit');
      if (ff.includes(' ') && !ff.startsWith('"') && !ff.startsWith("'")) {
        ff = `"${ff}"`;
      }

      // Replace literal font family with CSS var if base.css declares one for it
      const ffUnquoted = ff.replace(/^["']|["']$/g, '');
      const fontVar = fontFamilyVars.get(ffUnquoted.toLowerCase());
      const ffResolved = fontVar ? `var(${fontVar})` : ff;

      // 1. Shorthand variable
      groups.get(category)!.push({
        cssVar: baseVar,
        cssValue: `normal ${resolvedWeight} ${fs}/${lh} ${ffResolved}`,
        description: token.description ? `${token.description} (shorthand)` : 'shorthand',
      });

      // 2. Individual properties
      for (const [k, v] of Object.entries(val)) {
        if (!v || (k === 'textCase' && v === 'ORIGINAL') || (k === 'textDecoration' && v === 'NONE')) continue;
        const propName = subPaths[k] || k;
        let finalVal = String(v);

        if (k === 'fontWeight') finalVal = resolvedWeight;
        if (k === 'fontFamily') finalVal = ffResolved;

        groups.get(category)!.push({
          cssVar: `${baseVar}-${propName}`,
          cssValue: finalVal,
          description: token.description,
        });
      }
      continue;
    }

    groups.get(category)!.push({
      cssVar: cssVarName(dotPath),
      cssValue: tokenValueToCSS(dotPath, token, allTokens, getRefAsVar, variableIdToPath),
      description: token.description,
    });
  }

  // Build output lines
  const timestamp = new Date().toISOString();
  const lines: string[] = [
    '/**',
    ' * Design Tokens — auto-generated from tokens.json',
    ` * Generated: ${timestamp}`,
    ' * 🔄 Short naming enabled.',
    ' *',
    ' * ⚠️  Do not edit manually. Run `npm run tokens` to regenerate.',
    ' * Source: Figma → Tokens Studio → styles/from-figma/tokens.json → this script',
    ' */',
    '',
    ':root {',
  ];

  // Emit known categories in order, then any unknown ones at the end
  const orderedKeys = [
    ...CATEGORY_ORDER.filter(k => groups.has(k)),
    ...[...groups.keys()].filter(k => !CATEGORY_ORDER.includes(k)),
  ];

  for (const category of orderedKeys) {
    const entries = groups.get(category)!;
    const label = CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);

    lines.push('');
    lines.push(sectionComment(label));

    for (const { cssVar, cssValue, description } of entries) {
      const comment = description ? `   /* ${description} */` : '';
      lines.push(`  ${cssVar}: ${cssValue};${comment}`);
    }
  }

  lines.push('}', '');

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf-8');
  console.log(`✓ Generated ${OUTPUT_PATH} (${allTokens.size} tokens from ${orderedKeys.length} groups)`);
}

generate();
