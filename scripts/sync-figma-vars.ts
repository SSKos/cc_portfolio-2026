#!/usr/bin/env ts-node
/**
 * sync-figma-vars.ts
 *
 * Автоматически обновляет styles/from-figma/variable-id-map.json
 * на основе переменных из Figma REST API.
 *
 * Алгоритм:
 *   1. Загружает все локальные переменные из Figma файла (Variables API)
 *   2. Строит карту hex-значение → dot-path по примитивам из tokens.json
 *   3. Сопоставляет каждую Figma-переменную с примитивным токеном по значению
 *   4. Записывает variable-id-map.json
 *
 * Требует:
 *   FIGMA_ACCESS_TOKEN — в .env (Personal Access Token из Figma → Account → API)
 *   FIGMA_FILE_KEY     — в .env (из URL: figma.com/design/{FILE_KEY}/...)
 *
 * Запуск:
 *   npm run sync:figma-vars
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

const __dirnameScript = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirnameScript, '..');

loadEnv({ path: path.join(PROJECT_ROOT, '.env') });

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;

if (!FIGMA_TOKEN) {
  console.error('Error: FIGMA_ACCESS_TOKEN not set in .env');
  console.error('  Get it: Figma → Account settings → Personal access tokens');
  process.exit(1);
}
if (!FIGMA_FILE_KEY) {
  console.error('Error: FIGMA_FILE_KEY not set in .env');
  console.error('  Get it: from the Figma URL — figma.com/design/{FILE_KEY}/...');
  process.exit(1);
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const TOKENS_PATH = path.join(PROJECT_ROOT, 'styles', 'from-figma', 'tokens.json');
const MAP_PATH = path.join(PROJECT_ROOT, 'styles', 'from-figma', 'variable-id-map.json');

// ─── Figma API ────────────────────────────────────────────────────────────────

interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
}

interface FigmaVariablesResponse {
  variables: Record<string, FigmaVariable>;
}

async function fetchFigmaVariables(): Promise<Record<string, FigmaVariable>> {
  const url = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/variables/local`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN! },
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403) {
      throw new Error(
        `Figma API 403: недостаточно прав у токена.\n` +
        `  Нужен скоуп: file_variables:read\n` +
        `  Figma → Settings → Security → Personal access tokens → создай новый с Variables: Read`
      );
    }
    throw new Error(`Figma API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as FigmaVariablesResponse;
  return data.variables ?? {};
}

// ─── RGBA → hex ───────────────────────────────────────────────────────────────

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (Math.round(a * 255) < 255) return hex + toHex(a);
  return hex;
}

// ─── Scan primitives: build hex → dot-path map ────────────────────────────────

type TokenTree = Record<string, unknown>;

function buildHexMap(tree: TokenTree, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();

  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith('$')) continue;
    const dotPath = prefix ? `${prefix}.${key}` : key;

    if (typeof node === 'object' && node !== null) {
      const obj = node as Record<string, unknown>;
      const val = obj['$value'] ?? obj['value'];

      if (typeof val === 'string' && val.startsWith('#')) {
        // Only register direct hex values (primitives), skip aliases
        if (!result.has(val.toLowerCase())) {
          result.set(val.toLowerCase(), dotPath);
        }
      } else {
        buildHexMap(obj as TokenTree, dotPath).forEach((v, k) => {
            if (!result.has(k)) result.set(k, v);
          });
      }
    }
  }

  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  // Load existing map
  const existingMap: Record<string, string> = fs.existsSync(MAP_PATH)
    ? (JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8')) as Record<string, string>)
    : {};

  // Build hex → dot-path index from tokens.json primitives
  const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8')) as TokenTree;
  const hexMap = buildHexMap(tokens);
  console.log(`  Indexed ${hexMap.size} primitive hex values from tokens.json`);

  // Fetch Figma variables
  console.log(`  Fetching variables from Figma file ${FIGMA_FILE_KEY}...`);
  const variables = await fetchFigmaVariables();
  const total = Object.keys(variables).length;
  console.log(`  Got ${total} variables from Figma`);

  const newMap: Record<string, string> = { ...existingMap };
  let added = 0;
  let skipped = 0;
  let unresolved = 0;

  for (const variable of Object.values(variables)) {
    if (variable.resolvedType !== 'COLOR') continue;

    // Extract short ID: "VariableID:1:7" → "1:7"
    const shortId = variable.id.replace(/^VariableID:/, '');
    if (newMap[shortId]) {
      skipped++;
      continue;
    }

    // Get the first mode's value
    const modeValues = Object.values(variable.valuesByMode);
    if (!modeValues.length) continue;

    const color = modeValues[0] as { r?: number; g?: number; b?: number; a?: number; type?: string };
    const { r, g, b, a } = color;
    if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') continue;

    const hex = rgbaToHex(r, g, b, a ?? 1).toLowerCase();
    const dotPath = hexMap.get(hex);

    if (dotPath) {
      newMap[shortId] = dotPath;
      console.log(`  + ${shortId} (${variable.name}) → ${dotPath} [${hex}]`);
      added++;
    } else {
      console.log(`  ? ${shortId} (${variable.name}) = ${hex} — no matching primitive`);
      unresolved++;
    }
  }

  // Sort by ID for readability
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(newMap).sort((a, b) => {
    const [a1, a2] = a.split(':').map(Number);
    const [b1, b2] = b.split(':').map(Number);
    return a1 - b1 || a2 - b2;
  })) {
    sorted[key] = newMap[key];
  }

  fs.writeFileSync(MAP_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');

  console.log(`\n✓ variable-id-map.json updated`);
  console.log(`  added: ${added}, skipped (already mapped): ${skipped}, unresolved: ${unresolved}`);
  if (unresolved > 0) {
    console.log(`  Unresolved variables have no matching primitive hex in tokens.json.`);
    console.log(`  Add them to the primitives section of tokens.json and re-run.`);
  }
}

run().catch(err => {
  console.error('Error:', (err as Error).message);
  process.exit(1);
});
