/*
 Adds a top-of-file comment indicating the file's path relative to the
 `netflix-clone` directory. Supports JS/JSX, SQL, HTML, and CSS files.

 - JS/JSX: // path
 - SQL: -- path
 - HTML: <!-- path --> (inserted after DOCTYPE if present)
 - CSS: /* path *\/

 Skips files that already contain the correct header as the first non-empty
 line (or first line for JS/JSX/SQL/CSS). Ignores common directories like
 node_modules, .git, and build outputs.
*/

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const baseRoot = path.join(projectRoot, 'netflix-clone');

/** @type {Record<string, 'line' | 'block' | 'html'>} */
const extensionToStyle = {
  js: 'line',
  jsx: 'line',
  sql: 'line',
  html: 'html',
  css: 'block',
};

const ignoredDirectories = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  'out',
]);

function getCommentHeader(relPath, style) {
  if (style === 'line') return `// ${relPath}`;
  if (style === 'block') return `/* ${relPath} */`;
  if (style === 'html') return `<!-- ${relPath} -->`;
  return `// ${relPath}`;
}

function detectEol(text) {
  const hasCRLF = /\r\n/.test(text);
  const hasLF = /\n/.test(text);
  if (hasCRLF) return '\r\n';
  if (hasLF) return '\n';
  return '\n';
}

function shouldSkipDir(dirName) {
  return ignoredDirectories.has(dirName);
}

function isSupportedFile(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return Object.prototype.hasOwnProperty.call(extensionToStyle, ext);
}

function getRelativePathForHeader(absPath) {
  if (absPath.startsWith(baseRoot)) {
    return path.relative(baseRoot, absPath).replace(/\\/g, '/');
  }
  return path.relative(projectRoot, absPath).replace(/\\/g, '/');
}

function alreadyHasHeader(content, header, style) {
  const eol = detectEol(content);
  const lines = content.split(eol);

  if (style === 'html') {
    // Allow optional DOCTYPE on the first line
    let startIndex = 0;
    while (startIndex < lines.length && lines[startIndex].trim() === '') startIndex++;
    if (startIndex < lines.length && /^<!DOCTYPE/i.test(lines[startIndex].trim())) {
      startIndex++;
      while (startIndex < lines.length && lines[startIndex].trim() === '') startIndex++;
    }
    return startIndex < lines.length && lines[startIndex].trim() === header;
  }

  // For other types, check first non-empty line
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  return i < lines.length && lines[i].trim() === header;
}

function insertHeader(content, header, style) {
  const eol = detectEol(content);

  if (style === 'html') {
    // Insert after DOCTYPE if present, otherwise at top
    const lines = content.split(eol);
    let resultLines = [];
    let idx = 0;
    // Copy leading empty lines
    while (idx < lines.length && lines[idx].trim() === '') {
      resultLines.push(lines[idx]);
      idx++;
    }
    if (idx < lines.length && /^<!DOCTYPE/i.test(lines[idx].trim())) {
      resultLines.push(lines[idx]);
      idx++;
      // Preserve any empty lines after DOCTYPE
      while (idx < lines.length && lines[idx].trim() === '') {
        resultLines.push(lines[idx]);
        idx++;
      }
      resultLines.push(header);
      return resultLines.concat(lines.slice(idx)).join(eol);
    }
    // No DOCTYPE, add header before first non-empty
    return [header, ...lines].join(eol);
  }

  // Default: place at very top
  if (!content) return header + eol;
  return header + eol + content;
}

function walk(dir, onFile) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;
      walk(path.join(dir, entry.name), onFile);
    } else if (entry.isFile()) {
      const abs = path.join(dir, entry.name);
      if (isSupportedFile(abs)) onFile(abs);
    }
  }
}

const rootToScan = baseRoot;
if (!fs.existsSync(rootToScan) || !fs.statSync(rootToScan).isDirectory()) {
  console.error('Could not locate netflix-clone directory under project root.');
  process.exit(1);
}

let updatedCount = 0;
let skippedCount = 0;

walk(rootToScan, (absPath) => {
  const relPath = getRelativePathForHeader(absPath);
  const ext = path.extname(absPath).slice(1).toLowerCase();
  const style = extensionToStyle[ext];
  const header = getCommentHeader(relPath, style);

  try {
    const original = fs.readFileSync(absPath, 'utf8');
    if (alreadyHasHeader(original, header, style)) {
      skippedCount++;
      return;
    }
    const updated = insertHeader(original, header, style);
    fs.writeFileSync(absPath, updated, 'utf8');
    updatedCount++;
  } catch (err) {
    console.error(`Failed to process ${relPath}:`, err.message);
  }
});

console.log(`Path headers update completed. Updated: ${updatedCount}, Skipped: ${skippedCount}`);


