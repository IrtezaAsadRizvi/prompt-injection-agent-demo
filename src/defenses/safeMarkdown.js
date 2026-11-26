// Links and images to hosts not on the allowlist become plain text, so rendering can't leak data.
export const ALLOWED_HOSTS = new Set(['github.com', 'docs.github.com']);

const MD_LINK = /(!?)\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g; // [text](url) and ![alt](url)
const HTML_IMG = /<img\b[^>]*>/gi; // raw HTML images leak the same way

export function safeMarkdown(markdown, allowed = ALLOWED_HOSTS) {
  return markdown
    .replace(MD_LINK, (whole, bang, label, url) => {
      let host;
      try { host = new URL(url).hostname; } catch { return label; }
      if (allowed.has(host)) return whole;
      return `${label || (bang ? 'image' : 'link')} (removed: ${host} is not allowlisted)`;
    })
    .replace(HTML_IMG, '(image removed)');
}
