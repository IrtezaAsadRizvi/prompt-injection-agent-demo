// A fake GitHub with scoped, expiring tokens. All contents are fake.
const REPOS = {
  'public-app': { files: { 'README.md': '# public-app\nA perfectly ordinary app.' } },
  'infra-secrets': { files: { 'deploy.env': 'AWS_SECRET_ACCESS_KEY=aws_FAKE_456' } },
};

// A token lists the repos it may read and when it stops working.
export function mintToken({ repos, ttlMs = 60_000 }) {
  return Object.freeze({ repos: Object.freeze([...repos]), expiresAt: Date.now() + ttlMs });
}

export function getRepoFile(token, repo, path) {
  const allowed = token.repos.includes(repo) && Date.now() < token.expiresAt;
  const content = allowed ? REPOS[repo]?.files[path] : undefined;
  // 404, not 403: an out-of-scope token can't even confirm the repo exists.
  if (content === undefined) throw Object.assign(new Error('Not Found'), { status: 404 });
  return content;
}
