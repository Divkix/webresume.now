// Server-side stub for @zxcvbn-ts/language-common and @zxcvbn-ts/language-en.
// These packages are 1.64 MB of password dictionaries. On the server, password
// strength checking is a no-op (handled client-side only), so we stub the exports.

export const dictionary = {};
export const adjacencyGraphs = {};
export const translations = {};
export default { dictionary, adjacencyGraphs, translations };
