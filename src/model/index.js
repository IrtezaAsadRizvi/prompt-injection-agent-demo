// Picks the model for demos: the deterministic gullible one, or a real one with MODEL=real.
export async function pickModel() {
  if (process.env.MODEL !== 'real') return (await import('./gullible.js')).callModel;
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('MODEL=real needs ANTHROPIC_API_KEY to be set.');
  console.log('Using a real model. Results will vary from run to run, which is the point.\n');
  return (await import('./real.js')).callModel;
}
