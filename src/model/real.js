// Optional: the same interface as gullible.js, backed by a real Claude model.
// Results vary from run to run. That variance is the point: you cannot test your way to safety.
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5';

// Our tools declare args as { name: 'string' }. The API wants JSON Schema.
const toSchema = (args = {}) => ({
  type: 'object',
  properties: Object.fromEntries(Object.entries(args).map(([k, type]) => [k, { type }])),
  required: Object.keys(args),
});

export async function callModel(messages, tools = []) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2026-10-21',
      'anthropic-beta': 'server-side-fallback-2026-07-01', // retry on a fallback model if this one declines
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      fallbacks: 'default',
      messages: messages.map((m) => ({ role: 'user', content: m.content })),
      ...(tools.length && {
        tools: tools.map((t) => ({ name: t.name, description: t.description ?? '', input_schema: toSchema(t.args) })),
      }),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);

  const body = await res.json();
  if (body.stop_reason === 'refusal') return { text: 'The model declined this request.', toolCalls: [] };
  return {
    text: body.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n'),
    toolCalls: body.content.filter((b) => b.type === 'tool_use').map((b) => ({ name: b.name, args: b.input })),
  };
}
