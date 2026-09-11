import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const markdownFiles = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '*.md'],
  { encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .filter(Boolean);

const missing = [];
const markdownLink = /\[[^\]]*\]\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(markdownLink)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, '');
    if (
      !rawTarget ||
      rawTarget.startsWith('#') ||
      /^[a-z][a-z\d+.-]*:/i.test(rawTarget)
    )
      continue;

    const path = decodeURIComponent(rawTarget.split(/[?#]/, 1)[0]);
    const target = resolve(dirname(file), path);
    if (!existsSync(target)) missing.push(`${file}: missing ${rawTarget}`);
  }
}

if (missing.length) {
  console.error(missing.join('\n'));
  process.exit(1);
}

console.log(
  `docs-ok: checked local links in ${markdownFiles.length} Markdown files`,
);
