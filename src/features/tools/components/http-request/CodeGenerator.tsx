import { useState } from 'react';
import { Copy, Check, Code, Terminal, FileCode, Braces, Coffee } from 'lucide-react';
import { useClipboard } from '../../../../hooks/useLocalStorage';

export type CodeLanguage = 'curl' | 'javascript' | 'python' | 'java' | 'go' | 'php';

export interface CodeGeneratorProps {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

const languages = [
  { value: 'curl' as CodeLanguage, label: 'cURL', icon: Terminal },
  { value: 'javascript' as CodeLanguage, label: 'JavaScript', icon: Braces },
  { value: 'python' as CodeLanguage, label: 'Python', icon: Code },
  { value: 'java' as CodeLanguage, label: 'Java', icon: Coffee },
  { value: 'go' as CodeLanguage, label: 'Go', icon: Code },
  { value: 'php' as CodeLanguage, label: 'PHP', icon: FileCode },
];

function generateCode(language: CodeLanguage, method: string, url: string, headers: Record<string, string>, body: string | null): string {
  switch (language) {
    case 'curl':
      return generateCurl(method, url, headers, body);
    case 'javascript':
      return generateJavaScript(method, url, headers, body);
    case 'python':
      return generatePython(method, url, headers, body);
    case 'java':
      return generateJava(method, url, headers, body);
    case 'go':
      return generateGo(method, url, headers, body);
    case 'php':
      return generatePHP(method, url, headers, body);
    default:
      return '';
  }
}

function generateCurl(method: string, url: string, headers: Record<string, string>, body: string | null): string {
  let code = `curl -X ${method.toUpperCase()} '${url}'`;
  
  Object.entries(headers).forEach(([key, value]) => {
    code += ` \\\n  -H '${key}: ${value}'`;
  });
  
  if (body && body.trim()) {
    code += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`;
  }
  
  return code;
}

function generateJavaScript(method: string, url: string, headers: Record<string, string>, body: string | null): string {
  const hasBody = body && body.trim();
  
  let code = `const options = {\n`;
  code += `  method: '${method.toUpperCase()}',\n`;
  
  if (Object.keys(headers).length > 0) {
    code += `  headers: {\n`;
    Object.entries(headers).forEach(([key, value]) => {
      code += `    '${key}': '${value}',\n`;
    });
    code += `  },\n`;
  }
  
  if (hasBody) {
    code += `  body: \`${body}\`,\n`;
  }
  
  code += `};\n\n`;
  code += `fetch('${url}', options)\n`;
  code += `  .then(response => response.text())\n`;
  code += `  .then(data => console.log(data))\n`;
  code += `  .catch(error => console.error('Error:', error));`;
  
  return code;
}

function generatePython(method: string, url: string, headers: Record<string, string>, body: string | null): string {
  const hasBody = body && body.trim();
  
  let code = `import requests\n\n`;
  code += `url = "${url}"\n`;
  
  if (Object.keys(headers).length > 0) {
    code += `headers = {\n`;
    Object.entries(headers).forEach(([key, value]) => {
      code += `    "${key}": "${value}",\n`;
    });
    code += `}\n`;
  }
  
  if (hasBody) {
    code += `data = """${body}"""\n\n`;
  }
  
  code += `response = requests.${method.toLowerCase()}(url`;
  if (Object.keys(headers).length > 0) {
    code += `, headers=headers`;
  }
  if (hasBody) {
    code += `, data=data`;
  }
  code += `)\n\n`;
  code += `print(response.text)`;
  
  return code;
}

function generateJava(method: string, url: string, headers: Record<string, string>, body: string | null): string {
  const hasBody = body && body.trim();
  
  let code = `import java.net.http.HttpClient;\n`;
  code += `import java.net.http.HttpRequest;\n`;
  code += `import java.net.http.HttpResponse;\n`;
  code += `import java.net.URI;\n`;
  if (hasBody) {
    code += `import java.net.http.HttpRequest.BodyPublishers;\n`;
  }
  code += `\n`;
  
  code += `HttpClient client = HttpClient.newHttpClient();\n\n`;
  
  code += `HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()\n`;
  code += `    .uri(URI.create("${url}"))\n`;
  code += `    .method("${method.toUpperCase()}", `;
  
  if (hasBody) {
    code += `BodyPublishers.ofString("""\n${body}\n"""))`;
  } else {
    code += `BodyPublishers.noBody())`;
  }
  code += `;\n\n`;
  
  Object.entries(headers).forEach(([key, value]) => {
    code += `requestBuilder.header("${key}", "${value}");\n`;
  });
  code += `\n`;
  
  code += `HttpResponse<String> response = client.send(\n`;
  code += `    requestBuilder.build(),\n`;
  code += `    HttpResponse.BodyHandlers.ofString()\n`;
  code += `);\n\n`;
  code += `System.out.println(response.body());`;
  
  return code;
}

function generateGo(method: string, url: string, headers: Record<string, string>, body: string | null): string {
  const hasBody = body && body.trim();
  
  let code = `package main\n\n`;
  code += `import (\n`;
  code += `    "fmt"\n`;
  code += `    "net/http"\n`;
  if (hasBody) {
    code += `    "strings"\n`;
  }
  code += `)\n\n`;
  
  code += `func main() {\n`;
  
  if (hasBody) {
    code += `    payload := strings.NewReader(\`${body}\`)\n\n`;
    code += `    req, _ := http.NewRequest("${method.toUpperCase()}", "${url}", payload)\n`;
  } else {
    code += `    req, _ := http.NewRequest("${method.toUpperCase()}", "${url}", nil)\n`;
  }
  
  Object.entries(headers).forEach(([key, value]) => {
    code += `    req.Header.Add("${key}", "${value}")\n`;
  });
  
  code += `\n`;
  code += `    res, _ := http.DefaultClient.Do(req)\n`;
  code += `    defer res.Body.Close()\n\n`;
  code += `    fmt.Println(res)\n`;
  code += `}`;
  
  return code;
}

function generatePHP(method: string, url: string, headers: Record<string, string>, body: string | null): string {
  const hasBody = body && body.trim();
  
  let code = `<?php\n\n`;
  code += `$curl = curl_init();\n\n`;
  code += `curl_setopt_array($curl, array(\n`;
  code += `  CURLOPT_URL => '${url}',\n`;
  code += `  CURLOPT_RETURNTRANSFER => true,\n`;
  code += `  CURLOPT_CUSTOMREQUEST => '${method.toUpperCase()}',\n`;
  
  if (hasBody) {
    code += `  CURLOPT_POSTFIELDS => '${body.replace(/'/g, "\\'")}',\n`;
  }
  
  if (Object.keys(headers).length > 0) {
    code += `  CURLOPT_HTTPHEADER => array(\n`;
    Object.entries(headers).forEach(([key, value]) => {
      code += `    '${key}: ${value}',\n`;
    });
    code += `  ),\n`;
  }
  
  code += `));\n\n`;
  code += `$response = curl_exec($curl);\n`;
  code += `$err = curl_error($curl);\n\n`;
  code += `curl_close($curl);\n\n`;
  code += `if ($err) {\n`;
  code += `  echo 'cURL Error #:' . $err;\n`;
  code += `} else {\n`;
  code += `  echo $response;\n`;
  code += `}`;
  
  return code;
}

export function CodeGenerator({ method, url, headers, body }: CodeGeneratorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('curl');
  const { copied, copy } = useClipboard();
  
  const code = generateCode(selectedLanguage, method, url, headers, body);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">生成代码</span>
        </div>
        <button
          onClick={() => copy(code)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      
      {/* 语言选择 */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-slate-700">
        {languages.map((lang) => {
          const Icon = lang.icon;
          return (
            <button
              key={lang.value}
              onClick={() => setSelectedLanguage(lang.value)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedLanguage === lang.value
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lang.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* 代码显示 */}
      <div className="relative">
        <pre className="p-4 bg-gray-50 dark:bg-slate-900 overflow-auto max-h-80 text-xs font-mono text-gray-700 dark:text-gray-300">
          {code}
        </pre>
      </div>
    </div>
  );
}
