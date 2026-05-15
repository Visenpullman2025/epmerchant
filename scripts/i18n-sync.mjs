#!/usr/bin/env node
// i18n 增量同步：以 zh.json 为 source，AI 翻译缺失 key 到 en/th
//
// 用法：
//   npm run i18n               # 同步缺失 key
//   npm run i18n -- --force    # 强制重新翻译所有 key（覆盖现有 en/th）
//
// 需要环境变量：
//   ANTHROPIC_API_KEY     # 推荐
//
// 设计：只翻译"叶子字符串"——遍历 zh 树形结构，记录 path；en/th 缺失则补。
// 模型一次最多翻 50 条以保护 token 预算。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, '..', 'src', 'messages');
const FORCE = process.argv.includes('--force');
const BATCH = 50;

const TARGETS = [
  { code: 'en', label: 'English' },
  { code: 'th', label: 'Thai (ภาษาไทย)' },
];

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf-8'));
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function collectLeaves(obj, prefix = []) {
  const out = [];
  for (const [k, v] of Object.entries(obj ?? {})) {
    const p = [...prefix, k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...collectLeaves(v, p));
    } else if (typeof v === 'string') {
      out.push({ path: p, value: v });
    }
  }
  return out;
}

function getAt(obj, path) {
  let cur = obj;
  for (const seg of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[seg];
  }
  return cur;
}

function setAt(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    if (cur[seg] == null || typeof cur[seg] !== 'object') cur[seg] = {};
    cur = cur[seg];
  }
  cur[path[path.length - 1]] = value;
}

async function translateBatch(items, targetLang) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing ANTHROPIC_API_KEY env var. Add it to ep/.env.local then re-run.'
    );
  }
  const prompt = `Translate the following Chinese UI strings to ${targetLang}. Output JSON only — a JSON array of strings in the same order as input. Do not add quotes inside strings unless they exist in the source. Keep brand/code tokens unchanged (e.g. "ExpatTH", "Local & Now"). Keep ฿ symbol if present.\n\nInput (JSON array):\n${JSON.stringify(items.map((i) => i.value))}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json?.content?.[0]?.text ?? '';
  const m = content.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('AI did not return a JSON array. Response: ' + content.slice(0, 200));
  const arr = JSON.parse(m[0]);
  if (!Array.isArray(arr) || arr.length !== items.length) {
    throw new Error(`Expected ${items.length} translations, got ${arr.length}`);
  }
  return arr;
}

async function main() {
  const zhFile = path.join(MESSAGES_DIR, 'zh.json');
  const zh = await readJson(zhFile);
  const zhLeaves = collectLeaves(zh);
  console.log(`[i18n] zh.json: ${zhLeaves.length} leaf strings`);

  for (const target of TARGETS) {
    const file = path.join(MESSAGES_DIR, `${target.code}.json`);
    const existing = await readJson(file).catch(() => ({}));

    const missing = zhLeaves.filter(
      (leaf) => FORCE || typeof getAt(existing, leaf.path) !== 'string'
    );

    if (missing.length === 0) {
      console.log(`[i18n] ${target.code}.json: 已同步 ✓`);
      continue;
    }
    console.log(`[i18n] ${target.code}.json: ${missing.length} 条缺失，准备 AI 翻译…`);

    const out = existing;
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      const translated = await translateBatch(batch, target.label);
      batch.forEach((leaf, idx) => setAt(out, leaf.path, translated[idx]));
      console.log(`[i18n]   ${target.code} batch ${i / BATCH + 1}: ${batch.length} 条 ✓`);
    }
    await writeJson(file, out);
    console.log(`[i18n] ${target.code}.json: 写回 ${missing.length} 条 ✓`);
  }

  console.log('[i18n] 完成 ✅');
}

main().catch((err) => {
  console.error('[i18n] 失败：', err.message);
  process.exit(1);
});
