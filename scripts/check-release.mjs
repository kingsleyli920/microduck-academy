import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const candidates = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .filter(Boolean);

const forbiddenPaths = [
  'public/pyodide/',
  'public/bundle/',
  'public/policies/',
  'public/robot/',
  'public/assets/',
  'public/simulator/',
  'public/microduck-simulator/',
  'public/runtime-versions.json',
  'vendor/',
];

const forbiddenText = [
  { label: 'personal absolute path', pattern: new RegExp('/Users/' + 'kingsley' + '/') },
  { label: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
  { label: 'GitHub token', pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/ },
  { label: 'GitHub fine-grained token', pattern: /github_pat_[A-Za-z0-9_]{20,}/ },
  { label: 'OpenAI-style secret key', pattern: /sk-[A-Za-z0-9_-]{20,}/ },
  { label: 'private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

const problems = [];
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
if (packageJson.private !== true) {
  problems.push('package.json: must set private=true to prevent accidental npm publication');
}
for (const file of candidates) {
  if (forbiddenPaths.some((prefix) => file === prefix.slice(0, -1) || file.startsWith(prefix))) {
    problems.push(`${file}: generated or third-party runtime must stay out of Git`);
    continue;
  }

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (content.includes('\0')) continue;

  for (const check of forbiddenText) {
    if (check.pattern.test(content)) problems.push(`${file}: contains ${check.label}`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`release-ok: scanned ${candidates.length} source files`);
