// A fake model that obeys every instruction it finds, wherever it finds it.
// It is the worst case on purpose. Security has to plan for the model that falls for it.
import { decodeTags } from '../util/unicodeTags.js';

const OBJ = String.raw`\{(?:\{\{\w+\}\}|\{[^{}\n]*\}|[^{}\n])*\}`; // one flat JSON object; {{placeholders}} allowed
const CALL = new RegExp(String.raw`call (\w+) with (${OBJ})`, 'gi'); // "call postComment with {...}"
const ACTION = new RegExp(String.raw`AGENT_ACTION\s*(${OBJ})`, 'g'); // AGENT_ACTION {"name": ..., "args": {...}}
const SAY = /\bsay "([^"]+)"/i; // "Say "..."" overrides the summary
const FAILURE = /^.*(FAIL|Error)\b.*$/m; // first failing line becomes the summary
const IMAGE = /!\[[^\]]*\]\([^)\s]+\)/g; // markdown images get echoed into the reply
const TASKS = [ // the legit requests it understands
  [/summarize build (\d+)/i, (m) => ['readLog', { buildId: m[1] }]],
  [/triage issue (\d+) in ([\w-]+)/i, (m) => ['readIssue', { repo: m[2], n: Number(m[1]) }]],
];

export async function callModel(messages, tools = [], { honorsDelimiters = false } = {}) {
  // A model sees one stream of text: system, user and tool output all blend together.
  let context = decodeTags(messages.map((m) => m.content).join('\n'));
  // Best case for delimiters: ignore anything inside a properly closed <untrusted> block.
  if (honorsDelimiters) context = context.replace(/<untrusted>[\s\S]*?<\/untrusted>/g, '');

  // Latest first line of each tool result, used to fill {{toolName}} placeholders.
  const results = {};
  for (const [, name, line] of context.matchAll(/\[result of (\w+)\]\n(.*)/g)) results[name] = line;
  const fill = (s, escape) => {
    const names = [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    if (names.some((n) => !(n in results))) return null; // not ready yet, try next turn
    return s.replace(/\{\{(\w+)\}\}/g, (_, n) => escape(results[n]));
  };
  const parse = (json) => {
    const filled = fill(json, (v) => JSON.stringify(v).slice(1, -1));
    try { return filled && JSON.parse(filled); } catch { return null; }
  };

  // Collect every call it was asked for, legit or not. It can only call tools it was given.
  const known = new Set(tools.map((t) => t.name));
  const toolCalls = [];
  const add = (name, args) => known.has(name) && args && toolCalls.push({ name, args });
  for (const [re, make] of TASKS) { const m = context.match(re); if (m) add(...make(m)); }
  for (const [, name, json] of context.matchAll(CALL)) add(name, parse(json));
  for (const [, json] of context.matchAll(ACTION)) { const a = parse(json); if (a) add(a.name, a.args); }

  const failure = context.match(FAILURE)?.[0].trim().replace(/\s+/g, ' ');
  const lines = [`Summary: ${context.match(SAY)?.[1] ?? failure ?? 'no failures found.'}`];
  for (const [img] of context.matchAll(IMAGE)) { const f = fill(img, (v) => v); if (f) lines.push(f); }
  return { text: lines.join('\n'), toolCalls };
}
