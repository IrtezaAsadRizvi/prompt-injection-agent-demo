// The loop both agents share: ask the model, run each new tool call once, feed the result back.
export const describeTools = (defs) => defs.map((t) => `- ${t.name}: ${t.description}`).join('\n');

export async function agentLoop({ prompt, model, tools, runCall, maxTurns = 6 }) {
  const seen = new Set();
  const calls = [];
  let text = '';
  for (let turn = 0; turn < maxTurns; turn++) {
    const reply = await model([{ role: 'user', content: prompt }], tools);
    text = reply.text;
    const fresh = reply.toolCalls.filter((c) => !seen.has(JSON.stringify(c)));
    if (fresh.length === 0) break; // nothing new to do: the model is finished
    for (const call of fresh) {
      const key = JSON.stringify(call);
      if (seen.has(key)) continue;
      seen.add(key);
      calls.push(call);
      // Tool output goes straight back into the prompt. This is where injections ride in.
      prompt += `\n\n[result of ${call.name}]\n${await runCall(call)}`;
    }
  }
  return { text, calls };
}
