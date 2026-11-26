// v1: one big prompt, and every tool call the model asks for just runs. No checks at all.
import { callModel } from '../model/gullible.js';
import { tools, toolDefs, outbox } from '../tools/index.js';
import { mintToken } from '../tools/github.js';
import { agentLoop, describeTools } from './loop.js';

const SYSTEM = 'You are a helpful CI assistant. Summarize failures for developers.';

export async function runNaive(task, { model = callModel, system = SYSTEM, extraTools = [] } = {}) {
  // One broad, long-lived token, as is common.
  const token = mintToken({ repos: ['public-app', 'infra-secrets'], ttlMs: 3_600_000 });
  // Third party (MCP) tools get listed right next to ours, descriptions and all.
  const defs = [...toolDefs, ...extraTools];
  const prompt = `${system}\n\nAvailable tools:\n${describeTools(defs)}\n\nUser: ${task}`;

  const runCall = async ({ name, args }) => {
    try { return await tools[name].run(args, { token }); } catch (e) { return `ERROR ${e.status ?? e.message}`; }
  };
  const { text, calls } = await agentLoop({ prompt, model, tools: defs, runCall });
  return { text, outbox: [...outbox], calls };
}
