// SQL Advisor Hook - 封装 Web Worker 的使用
import { useState, useCallback, useRef, useEffect } from 'react';

type DatabaseType = 'mysql' | 'postgresql' | 'sqlite' | 'mariadb' | 'bigquery';

interface AnalysisResult {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'optimization' | 'success';
  category: string;
  title: string;
  description: string;
  sql?: string;
  line?: number;
  suggestion?: string;
  details?: string[];
}

interface TableSchema {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    isPrimary?: boolean;
    isNullable?: boolean;
    defaultValue?: string;
    length?: number;
    precision?: number;
    scale?: number;
    unsigned?: boolean;
  }>;
  indexes?: Array<{
    name: string;
    columns: string[];
    isPrimary?: boolean;
    isUnique?: boolean;
    type?: 'BTREE' | 'HASH' | 'FULLTEXT' | 'SPATIAL';
  }>;
  engine?: string;
  charset?: string;
}

interface UseSqlAdvisorReturn {
  results: AnalysisResult[];
  schemas: TableSchema[];
  isAnalyzing: boolean;
  analyze: (sqlInput: string, ddlInput: string, dbType: DatabaseType) => void;
  error: string | null;
}

export function useSqlAdvisor(): UseSqlAdvisorReturn {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingIdRef = useRef<number>(0);

  // 初始化 Worker
  useEffect(() => {
    // 使用 URL 创建 Worker，Vite 会自动处理
    const worker = new Worker(new URL('../workers/sqlAdvisorWorker.ts', import.meta.url), {
      type: 'module'
    });
    
    worker.onmessage = (event: MessageEvent) => {
      const { type, results, schemas, error, id } = event.data;
      
      // 只处理最新的请求结果
      if (id !== pendingIdRef.current) return;
      
      setIsAnalyzing(false);
      
      if (type === 'success') {
        setResults(results);
        setSchemas(schemas);
        setError(null);
      } else {
        setError(error);
      }
    };

    worker.onerror = (err) => {
      console.error('SQL Advisor Worker error:', err);
      setIsAnalyzing(false);
      setError('Worker 发生错误');
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const analyze = useCallback((sqlInput: string, ddlInput: string, dbType: DatabaseType) => {
    if (!workerRef.current) return;
    
    // 如果没有SQL输入，清空结果
    if (!sqlInput.trim()) {
      setResults([]);
      setSchemas([]);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    // 增加请求 ID，用于处理竞态
    pendingIdRef.current += 1;
    
    workerRef.current.postMessage({
      sqlInput,
      ddlInput,
      dbType,
      id: pendingIdRef.current
    });
  }, []);

  return {
    results,
    schemas,
    isAnalyzing,
    analyze,
    error
  };
}
