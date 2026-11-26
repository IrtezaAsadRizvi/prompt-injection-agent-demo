// Tiny console helpers. ANSI colors, no libraries. Set NO_COLOR=1 to turn colors off.
const paint = (code) => (s) => (process.env.NO_COLOR ? String(s) : `\x1b[${code}m${s}\x1b[0m`);
export const red = paint(31);
export const green = paint(32);
export const yellow = paint(33);
export const dim = paint(2);
export const bold = paint(1);

export const title = (s) => console.log(`\n${bold(s)}\n${dim('-'.repeat(s.length))}`);
export const step = (s) => console.log(`\n${bold('>')} ${s}`);
export const bad = (s) => console.log(`  ${red('LEAK')}   ${s}`);
export const good = (s) => console.log(`  ${green('SAFE')}   ${s}`);
export const warn = (s) => console.log(`  ${yellow('WARN')}   ${s}`);
export const info = (s) => console.log(`  ${dim('....')}   ${s}`);
export const indent = (text) => text.split('\n').map((l) => `         ${dim(l)}`).join('\n');
