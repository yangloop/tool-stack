// RSA 密钥生成 Web Worker
// 在后台线程执行密钥生成，避免阻塞主线程 UI

import { JSEncrypt } from 'jsencrypt';

interface GenerateKeyMessage {
  type: 'generate';
  keySize: number;
  id: string;
}

interface GenerateKeyResult {
  type: 'result';
  id: string;
  publicKey: string;
  privateKey: string;
  error?: string;
}

interface GenerateKeyProgress {
  type: 'progress';
  id: string;
  progress: number;
}

self.onmessage = (event: MessageEvent<GenerateKeyMessage>) => {
  const { type, keySize, id } = event.data;

  if (type !== 'generate') return;

  try {
    // 发送开始生成信号
    self.postMessage({ type: 'progress', id, progress: 0 } as GenerateKeyProgress);

    // 生成密钥对
    const encrypt = new JSEncrypt({ default_key_size: String(keySize) as any });
    
    // 模拟进度更新（JSEncrypt 没有原生进度回调）
    const progressInterval = setInterval(() => {
      self.postMessage({ type: 'progress', id, progress: 50 } as GenerateKeyProgress);
    }, 100);

    const publicKey = encrypt.getPublicKey();
    const privateKey = encrypt.getPrivateKey();

    clearInterval(progressInterval);

    // 发送完成信号
    self.postMessage({
      type: 'result',
      id,
      publicKey,
      privateKey,
    } as GenerateKeyResult);

  } catch (error) {
    self.postMessage({
      type: 'result',
      id,
      publicKey: '',
      privateKey: '',
      error: error instanceof Error ? error.message : '生成失败',
    } as GenerateKeyResult);
  }
};

export {};
