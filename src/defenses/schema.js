// Every tool declares exactly which args it accepts. Anything else is rejected before it runs.
const REPOS = ['public-app']; // the only repo this agent works on
const SAFE_PATH = /^(?!.*\.\.)[\w./-]+$/; // no "..", no odd characters

// Rule types: 'string' | 'number' (typeof), RegExp (string must match), Array (must be one of).
export const SCHEMAS = {
  readLog: { buildId: /^\d+$/ },
  readIssue: { repo: REPOS, n: 'number' },
  readRepoFile: { repo: REPOS, path: SAFE_PATH },
  readSecrets: { name: /^[A-Z_]+$/ },
  postComment: { pr: 'number', body: 'string' },
  fetchUrl: { url: /^https:\/\/github\.com\// },
};

// Returns null if the call is fine, otherwise a short reason.
export function validate(name, args) {
  const schema = SCHEMAS[name];
  if (!schema) return `unknown tool "${name}"`;
  if (!args || typeof args !== 'object') return 'args must be an object';
  for (const key of Object.keys(args)) if (!(key in schema)) return `unexpected arg "${key}"`;
  for (const [key, rule] of Object.entries(schema)) {
    const value = args[key];
    if (value === undefined) return `missing arg "${key}"`;
    const ok = Array.isArray(rule) ? rule.includes(value)
      : rule instanceof RegExp ? typeof value === 'string' && rule.test(value)
      : typeof value === rule;
    if (!ok) return `bad value for "${key}": ${JSON.stringify(value)}`;
  }
  return null;
}
