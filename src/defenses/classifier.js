// A naive injection detector: a list of phrases attackers are known to use.
// Useful as a signal, useless as a wall. Polite rewording walks straight past it.
const KNOWN_ATTACKS = [
  /ignore (all |any )?(previous|prior|above) instructions/i,
  /disregard (all |any )?(previous|prior|your) instructions/i,
  /\b(CI-BOT|SYSTEM|ADMIN) INSTRUCTION\b/i,
  /\byou are now\b/i,
  /\bnew instructions\b/i,
  /do not (tell|mention|inform) the user/i,
];

export const looksLikeInjection = (text) => KNOWN_ATTACKS.some((re) => re.test(text));
