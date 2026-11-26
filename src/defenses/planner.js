// Planner/reader split (the "dual LLM" pattern):
//   planner: decides the actions, never sees untrusted text
//   reader:  sees untrusted text, has no tools, returns only a string

// Fixed plans for the requests we support. The plan is code, not model output.
const PLANS = [
  [/build (\d+).*PR (\d+)/i, ([, build, pr]) => [
    { tool: 'readLog', args: { buildId: build }, out: '$log' },
    { read: '$log', out: '$summary' },
    { tool: 'postComment', args: { pr: Number(pr), body: '$summary' } },
  ]],
  [/issue (\d+) in ([\w-]+).*PR (\d+)/i, ([, n, repo, pr]) => [
    { tool: 'readIssue', args: { repo, n: Number(n) }, out: '$issue' },
    { read: '$issue', out: '$summary' },
    { tool: 'postComment', args: { pr: Number(pr), body: '$summary' } },
  ]],
];

export function planner(userRequest) {
  for (const [re, make] of PLANS) {
    const m = userRequest.match(re);
    if (m) return make(m);
  }
  throw new Error(`No plan for request: ${userRequest}`);
}

// The quarantined reader: no tools, so injected instructions have nothing to call.
export async function reader(untrustedText, model) {
  const { text } = await model([{ role: 'user', content: `Summarize this in one line:\n${untrustedText}` }], []);
  return String(text);
}

// Runs the plan in code. "$name" values are opaque: passed along whole, never parsed or obeyed.
export async function execute(plan, { runCall, read }) {
  const vars = {};
  const actions = [];
  const resolve = (v) => (typeof v === 'string' && v.startsWith('$') ? vars[v] : v);
  for (const step of plan) {
    if (step.read) { vars[step.out] = await read(vars[step.read]); continue; }
    const args = Object.fromEntries(Object.entries(step.args).map(([k, v]) => [k, resolve(v)]));
    actions.push({ name: step.tool, args });
    const out = await runCall({ name: step.tool, args });
    if (step.out) vars[step.out] = out;
  }
  return { vars, actions };
}
