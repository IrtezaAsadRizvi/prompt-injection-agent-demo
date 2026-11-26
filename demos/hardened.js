// `npm run demo:hardened`: the same poisoned input, with every defense on.
import { runHardened, runPlanned } from '../src/agents/hardened.js';
import { resetOutbox } from '../src/tools/index.js';
import { pickModel } from '../src/model/index.js';
import { title, step, good, bad, warn, info, indent } from './_print.js';

const model = await pickModel();

title('Hardened agent vs the same poisoned build log');
step('Mode 1: the model still picks tools, but every call goes through the gates');

const run = await runHardened('Summarize build 1234', { model });
for (const w of run.warnings) warn(w);
for (const c of run.calls) {
  const blocked = run.blocked.find((b) => b.call === c);
  if (blocked) good(`BLOCKED ${c.name}(${JSON.stringify(c.args)})\n         reason: ${blocked.reason}`);
  else info(`ran ${c.name}(${JSON.stringify(c.args)})`);
}
step('What the user saw:');
console.log(indent(run.text));
step('What left the building:');
if (run.outbox.length === 0) good('Nothing.');
for (const item of run.outbox) bad(`PR #${item.pr}: "${item.body}"`);

resetOutbox();
step('Mode 2: planner/reader split. Code picks the actions, the model only summarizes');
const planned = await runPlanned('Summarize build 1234 and post it to PR 42', { model });
for (const a of planned.actions) info(`ran ${a.name}(${JSON.stringify(a.args)})`);
good('The injected readSecrets/postComment never ran: the reader has no tools to call.');
step('Posted comment:');
for (const item of planned.outbox) info(`PR #${item.pr}: "${item.body}"`);

console.log('\nSame input, same gullible model. The difference is what the code lets it do.\n');
