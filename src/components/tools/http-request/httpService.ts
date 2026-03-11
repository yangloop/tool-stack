import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

export interface HttpRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string | null;
  timeout?: number;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

// 创建 axios 实例
const axiosInstance = axios.create({
  timeout: 30000,
  validateStatus: () => true, // 允许任何状态码
});

// 当前取消令牌
let currentCancelToken: CancelTokenSource | null = null;

/**
 * 发送 HTTP 请求
 */
export async function sendHttpRequest(options: HttpRequestOptions): Promise<HttpResponse> {
  const startTime = performance.now();
  
  // 取消之前的请求
  if (currentCancelToken) {
    currentCancelToken.cancel('New request started');
  }
  currentCancelToken = axios.CancelToken.source();
  
  const config: AxiosRequestConfig = {
    method: options.method.toLowerCase() as any,
    url: options.url,
    headers: options.headers || {},
    cancelToken: currentCancelToken.token,
    timeout: options.timeout || 30000,
    withCredentials: false,
    transformResponse: [(data) => data],
    responseType: 'text',
  };
  
  // 添加请求体
  if (options.body && options.method !== 'GET' && options.method !== 'HEAD') {
    config.data = options.body;
  }
  
  try {
    const response: AxiosResponse<string> = await axiosInstance(config);
    const endTime = performance.now();
    
    // 转换响应头
    const responseHeaders: Record<string, string> = {};
    Object.entries(response.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        responseHeaders[key] = value;
      } else if (Array.isArray(value)) {
        responseHeaders[key] = value.join(', ');
      }
    });
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: response.data || '',
      time: Math.round(endTime - startTime),
      size: new Blob([response.data || '']).size,
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      throw new Error('请求已取消');
    }
    throw error;
  } finally {
    currentCancelToken = null;
  }
}

/**
 * 取消当前请求
 */
export function cancelCurrentRequest(): void {
  if (currentCancelToken) {
    currentCancelToken.cancel('用户取消');
    currentCancelToken = null;
  }
}

export default {
  sendHttpRequest,
  cancelCurrentRequest,
};
