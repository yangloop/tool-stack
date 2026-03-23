import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

export interface HttpRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string | null;
  timeout?: number;
  signal?: AbortSignal; // 支持传入外部取消信号
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

// 当前活动的 AbortController
let currentController: AbortController | null = null;

/**
 * 发送 HTTP 请求
 * @param options 请求选项
 * @returns Promise<HttpResponse>
 */
export async function sendHttpRequest(
  options: HttpRequestOptions,
): Promise<HttpResponse> {
  const startTime = performance.now();

  // 取消之前的请求
  if (currentController) {
    currentController.abort("New request started");
  }

  // 创建新的 AbortController
  currentController = new AbortController();

  // 如果传入了外部 signal，需要合并两个 signal
  let signal = currentController.signal;
  if (options.signal) {
    // 使用外部的 AbortSignal
    signal = options.signal;
  }

  const config: AxiosRequestConfig = {
    method: options.method.toLowerCase() as any,
    url: options.url,
    headers: options.headers || {},
    signal: signal,
    timeout: options.timeout || 30000,
    withCredentials: false,
    transformResponse: [(data) => data],
    responseType: "text",
  };

  // 添加请求体
  if (options.body && options.method !== "GET" && options.method !== "HEAD") {
    config.data = options.body;
  }

  try {
    const response: AxiosResponse<string> = await axios(config);
    const endTime = performance.now();

    // 转换响应头
    const responseHeaders: Record<string, string> = {};
    Object.entries(response.headers).forEach(([key, value]) => {
      if (typeof value === "string") {
        responseHeaders[key] = value;
      } else if (Array.isArray(value)) {
        responseHeaders[key] = value.join(", ");
      }
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: response.data || "",
      time: Math.round(endTime - startTime),
      size: new Blob([response.data || ""]).size,
    };
  } catch (error) {
    if (
      axios.isCancel(error) ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw new Error("请求已取消");
    }
    throw error;
  } finally {
    // 只有使用内部 controller 时才清理
    if (!options.signal && currentController) {
      currentController = null;
    }
  }
}

/**
 * 取消当前请求
 */
export function cancelCurrentRequest(): void {
  if (currentController) {
    currentController.abort("用户取消");
    currentController = null;
  }
}

export default {
  sendHttpRequest,
  cancelCurrentRequest,
};
