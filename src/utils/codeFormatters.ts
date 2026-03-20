import type { Plugin } from 'prettier';

export type DiffLanguage =
  | 'text'
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'sql'
  | 'html'
  | 'xml'
  | 'css'
  | 'yaml'
  | 'markdown';

function formatXml(xml: string) {
  const compactXml = xml.replace(/>\s*</g, '><').trim();
  const tokens = compactXml.split(/(<[^>]+>)/g).filter((token) => token.trim() !== '');

  let indent = 0;
  const lines: string[] = [];

  for (const token of tokens) {
    if (/^<\/\w/.test(token)) {
      indent -= 1;
    }

    lines.push(`${'  '.repeat(Math.max(0, indent))}${token}`);

    if (
      /^<\w[^>]*[^/]?>$/.test(token) &&
      !/^<\?xml/.test(token) &&
      !/^<!/.test(token) &&
      !/^<\/\w/.test(token)
    ) {
      indent += 1;
    }
  }

  return lines.join('\n').trim();
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortJsonValue((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}

async function loadXmlFormatter() {
  const { XMLBuilder, XMLParser, XMLValidator } = await import('fast-xml-parser');
  return { XMLBuilder, XMLParser, XMLValidator };
}

async function formatWithPrettier(source: string, parser: 'babel' | 'typescript' | 'html' | 'css' | 'yaml') {
  const [{ format }, selectedPlugin] = await Promise.all([
    import('prettier/standalone'),
    ({
      babel: () => import('prettier/plugins/babel'),
      typescript: () => import('prettier/plugins/typescript'),
      html: () => import('prettier/plugins/html'),
      css: () => import('prettier/plugins/postcss'),
      yaml: () => import('prettier/plugins/yaml'),
    } as const)[parser](),
  ]);

  const plugins: Plugin[] = [selectedPlugin.default as Plugin];

  if (parser === 'babel' || parser === 'typescript') {
    const estreePlugin = await import('prettier/plugins/estree');
    plugins.unshift(estreePlugin.default as Plugin);
  }

  return format(source, {
    parser,
    plugins,
    printWidth: 100,
    tabWidth: 2,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    htmlWhitespaceSensitivity: 'css',
  });
}

export function canFormatLanguage(language: DiffLanguage) {
  return language !== 'text' && language !== 'markdown';
}

export function canReorderJson(language: DiffLanguage) {
  return language === 'json';
}

export async function formatContent(value: string, language: DiffLanguage) {
  if (!value.trim()) {
    return value;
  }

  switch (language) {
    case 'json':
      return JSON.stringify(JSON.parse(value), null, 2);
    case 'javascript':
      return formatWithPrettier(value, 'babel');
    case 'typescript':
      return formatWithPrettier(value, 'typescript');
    case 'html':
      return formatWithPrettier(value, 'html');
    case 'css':
      return formatWithPrettier(value, 'css');
    case 'yaml':
      return formatWithPrettier(value, 'yaml');
    case 'sql': {
      const { format } = await import('sql-formatter');
      return format(value, {
        language: 'sql',
        tabWidth: 2,
        keywordCase: 'upper',
      });
    }
    case 'xml': {
      const { XMLBuilder, XMLParser, XMLValidator } = await loadXmlFormatter();
      const validation = XMLValidator.validate(value);
      if (validation !== true) {
        throw new Error(`XML 格式错误: ${validation.err.msg}`);
      }

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        trimValues: true,
      });

      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        format: false,
        suppressUnpairedNode: false,
        suppressBooleanAttributes: false,
      });

      return formatXml(builder.build(parser.parse(value)));
    }
    case 'markdown':
    case 'text':
      return value;
  }
}

export function reorderJsonContent(value: string) {
  if (!value.trim()) {
    return value;
  }

  const parsed = JSON.parse(value);
  return JSON.stringify(sortJsonValue(parsed), null, 2);
}
