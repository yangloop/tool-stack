// Docker 转换工具自定义 Hooks

import { useState, useCallback } from 'react';
import type { DockerRunOptions } from './types';
import { defaultOptions } from './types';
import { parseDockerRun, parseCompose } from './parsers';
import { generateDockerCompose, generateDockerRun, generateDockerRunFromCompose } from './generators';

export function useDockerConverter() {
  const [options, setOptions] = useState<DockerRunOptions>(defaultOptions);
  const [error, setError] = useState('');

  const convertRunToOptions = useCallback(async (command: string): Promise<DockerRunOptions | null> => {
    setError('');
    const { options: opts, error: err } = await parseDockerRun(command);
    if (err) {
      setError(err);
      return null;
    }
    if (opts) {
      setOptions(opts);
    }
    return opts;
  }, []);

  const convertComposeToOptions = useCallback(async (yaml: string): Promise<DockerRunOptions | null> => {
    setError('');
    const { options: opts, error: err } = await parseCompose(yaml);
    if (err) {
      setError(err);
      return null;
    }
    if (opts) {
      setOptions(opts);
    }
    return opts;
  }, []);

  const getComposeConfig = useCallback(async (serviceName: string): Promise<string> => {
    return generateDockerCompose(options, serviceName);
  }, [options]);

  const getRunCommand = useCallback((): string => {
    return generateDockerRun(options);
  }, [options]);

  const getRunCommandFromCompose = useCallback(async (yaml: string): Promise<string> => {
    return generateDockerRunFromCompose(yaml);
  }, []);

  const updateOption = useCallback(<K extends keyof DockerRunOptions>(
    key: K, 
    value: DockerRunOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const addArrayItem = useCallback(<K extends keyof DockerRunOptions>(
    key: K, 
    item: any
  ) => {
    setOptions(prev => ({ 
      ...prev, 
      [key]: [...(prev[key] as any[]), item] 
    }));
  }, []);

  const removeArrayItem = useCallback(<K extends keyof DockerRunOptions>(
    key: K, 
    index: number
  ) => {
    setOptions(prev => ({ 
      ...prev, 
      [key]: (prev[key] as any[]).filter((_, i) => i !== index) 
    }));
  }, []);

  const updateArrayItem = useCallback(<K extends keyof DockerRunOptions>(
    key: K, 
    index: number, 
    value: any
  ) => {
    setOptions(prev => {
      const arr = [...(prev[key] as any[])];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  }, []);

  const resetOptions = useCallback(() => {
    setOptions(defaultOptions);
    setError('');
  }, []);

  return {
    options,
    error,
    setError,
    convertRunToOptions,
    convertComposeToOptions,
    getComposeConfig,
    getRunCommand,
    getRunCommandFromCompose,
    updateOption,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    resetOptions,
  };
}
