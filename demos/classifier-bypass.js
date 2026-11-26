// `npm run demo:bypass`: a phrase-list classifier catches the loud attack and misses the polite one.
import { runNaive } from '../src/agents/naive.js';
import { looksLikeInjection } from '../src/defenses/classifier.js';
import { fixture } from '../src/tools/index.js';
import { pickModel } from '../src/model/index.js';
import { title, step, bad, good, info } from './_print.js';

const model = await pickModel();
title('Injection classifier vs a polite paraphrase');

for (const [name, file] of [['Obvious payload', 'build-log-poisoned.txt'], ['Paraphrased payload', 'issue-paraphrased.md']]) {
  step(`${name} (fixtures/${file})`);
  if (looksLikeInjection(fixture(file))) good('Classifier flagged it.');
  else bad('Classifier says it looks fine.');
}

step('Does the paraphrased one still work on the model? Triage issue 42:');
const { outbox } = await runNaive('Triage issue 42 in public-app', { model });
if (outbox.length === 0) good('Nothing leaked this time.');
for (const item of outbox) bad(`PR #${item.pr}: "${item.body}"`);

console.log('\nA classifier is a smoke alarm, not a wall. Keep it as a signal; never rely on it alone.\n');
