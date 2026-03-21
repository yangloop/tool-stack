import { loader } from '@monaco-editor/react';

let configured = false;

export function ensureMonacoLoaderConfigured() {
  if (configured) {
    return;
  }

  // 使用站点本地静态资源，不依赖 jsdelivr CDN。
  loader.config({
    paths: {
      vs: '/monaco/vs',
    },
  });
  configured = true;
}
