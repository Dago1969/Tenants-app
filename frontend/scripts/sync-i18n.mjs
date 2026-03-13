import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const propertiesDir = path.join(frontendRoot, 'public', 'i18n');
const messagesTsPath = path.join(frontendRoot, 'src', 'app', 'i18n', 'messages.ts');
const generatedPath = path.join(frontendRoot, 'src', 'app', 'i18n', 'messages.generated.ts');
const languages = ['it', 'en'];

function parseProperties(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) {
      continue;
    }

    const separatorIndex = line.search(/[:=]/);
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

function toPropertiesContent(entries) {
  return Object.entries(entries)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n';
}

function escapeForTs(value) {
  return JSON.stringify(value);
}

function extractLegacyMessages(content) {
  const match = content.match(/export const messages = (\{[\s\S]*?\}) as const;/);
  if (!match) {
    return null;
  }

  try {
    return vm.runInNewContext(`(${match[1]})`);
  } catch {
    return null;
  }
}

function loadLegacyMessagesFromGit() {
  try {
    const gitContent = execFileSync('git', ['show', 'HEAD:frontend/src/app/i18n/messages.ts'], {
      cwd: frontendRoot,
      encoding: 'utf8'
    });
    return extractLegacyMessages(gitContent);
  } catch {
    return null;
  }
}

function toGeneratedModule(messagesByLanguage) {
  const languagesBlock = languages
    .map((language) => {
      const entries = Object.entries(messagesByLanguage[language])
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `    ${JSON.stringify(key)}: ${escapeForTs(value)}`)
        .join(',\n');

      return `  ${language}: {\n${entries}\n  }`;
    })
    .join(',\n');

  return `/* AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY. */\nexport const messages = {\n${languagesBlock}\n} as const;\n`;
}

const legacyContent = await fs.readFile(messagesTsPath, 'utf8');
const legacyMessages = extractLegacyMessages(legacyContent) ?? loadLegacyMessagesFromGit() ?? { it: {}, en: {} };
const mergedMessages = {};

for (const language of languages) {
  const propertiesPath = path.join(propertiesDir, `messages_${language}.properties`);
  const propertiesContent = await fs.readFile(propertiesPath, 'utf8');
  const propertiesMessages = parseProperties(propertiesContent);
  const merged = {
    ...(legacyMessages[language] ?? {}),
    ...propertiesMessages
  };

  mergedMessages[language] = merged;
  await fs.writeFile(propertiesPath, toPropertiesContent(merged), 'utf8');
}

await fs.writeFile(generatedPath, toGeneratedModule(mergedMessages), 'utf8');
console.log('i18n synchronized from properties.');