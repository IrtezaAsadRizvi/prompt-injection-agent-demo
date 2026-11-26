// The "lethal trifecta" gate: untrusted input + private data + a way out = stop and ask.
export function createTaintGate({ askHuman = async () => false } = {}) {
  const state = { sawUntrusted: false, sawPrivate: false };
  return {
    state,
    // Call after a tool runs, with that tool's flags.
    record(flags) {
      if (flags.includes('untrusted')) state.sawUntrusted = true;
      if (flags.includes('private')) state.sawPrivate = true;
    },
    // Call before a tool runs. Only exfil tools in a tainted session are held back.
    async allow(call, flags) {
      const tainted = state.sawUntrusted && state.sawPrivate;
      if (!flags.includes('exfil') || !tainted) return true;
      return Boolean(await askHuman(call)); // all three legs present: a human decides
    },
  };
}
