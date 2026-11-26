// Wraps untrusted text in tags so the model can tell it apart from instructions.
// Deliberately does NOT escape a closing tag inside the text. See the bypass test for why that
// matters, and note that escaping it only moves the problem: the model still reads the words.
export const wrapUntrusted = (text) => `<untrusted>\n${text}\n</untrusted>`;
