// Unicode "tag" characters (U+E0000 block) render as nothing, but models still read them.
const BASE = 0xe0000;

// Turn ASCII text into invisible tag characters.
export const encodeTags = (text) =>
  [...text].map((ch) => String.fromCodePoint(BASE + ch.codePointAt(0))).join('');

// Turn tag characters back into ASCII, in place. This is roughly what a tokenizer "sees".
export const decodeTags = (text) =>
  text.replace(/[\u{E0020}-\u{E007E}]/gu, (ch) => String.fromCodePoint(ch.codePointAt(0) - BASE));

// Remove tag characters entirely. This is what a human sees on screen.
export const stripTags = (text) => text.replace(/[\u{E0000}-\u{E007F}]/gu, '');
