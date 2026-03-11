import { useEffect } from 'react';
import { siteConfig, getFullUrl, getToolSeo } from '../config/site';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  pathname?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
}

export function SEO({ 
  title, 
  description = siteConfig.description, 
  keywords = siteConfig.keywords,
  pathname = '',
  image = siteConfig.og.image,
  type = siteConfig.og.type,
  noindex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} - ${siteConfig.name}` : siteConfig.title;
  const url = getFullUrl(pathname);
  const imageUrl = image.startsWith('http') ? image : getFullUrl(image);

  useEffect(() => {
    // 更新标题
    document.title = fullTitle;

    // 更新基础 meta 标签
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    
    // Open Graph
    updateMeta('og:title', fullTitle);
    updateMeta('og:description', description);
    updateMeta('og:url', url);
    updateMeta('og:type', type);
    updateMeta('og:site_name', siteConfig.name);
    updateMeta('og:image', imageUrl);
    updateMeta('og:locale', siteConfig.lang);
    
    // Twitter Card
    updateMeta('twitter:card', siteConfig.twitter.card);
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', imageUrl);
    if (siteConfig.twitter.site) {
      updateMeta('twitter:site', siteConfig.twitter.site);
    }
    if (siteConfig.twitter.creator) {
      updateMeta('twitter:creator', siteConfig.twitter.creator);
    }
    
    // Robots
    if (noindex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      updateMeta('robots', 'index, follow');
    }
    
    // Canonical URL
    updateCanonical(url);

    // JSON-LD Structured Data
    updateStructuredData({
      title: fullTitle,
      description,
      url,
      image: imageUrl,
    });

  }, [fullTitle, description, keywords, url, imageUrl, type, noindex]);

  return null;
}

function updateMeta(name: string, content: string) {
  // 尝试通过 name 查找
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  
  // 尝试通过 property 查找 (Open Graph)
  if (!meta) {
    meta = document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement;
  }
  
  if (meta) {
    meta.content = content;
  } else {
    // 创建新 meta 标签
    meta = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      meta.setAttribute('property', name);
    } else {
      meta.name = name;
    }
    meta.content = content;
    document.head.appendChild(meta);
  }
}

function updateCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (link) {
    link.href = url;
  } else {
    link = document.createElement('link');
    link.rel = 'canonical';
    link.href = url;
    document.head.appendChild(link);
  }
}

function updateStructuredData(data: { title: string; description: string; url: string; image: string }) {
  // 移除旧的结构化数据
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // 创建新的结构化数据
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: data.title,
    description: data.description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    inLanguage: siteConfig.lang,
    url: data.url,
    image: data.image,
    author: {
      '@type': 'Organization',
      name: siteConfig.author,
    },
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

// 生成工具页面的 SEO 配置（向后兼容）
export function getToolSEO(toolId: string, toolName?: string) {
  const seo = getToolSeo(toolId);
  return {
    title: toolName || seo.title,
    description: seo.description,
    keywords: seo.keywords,
    pathname: `/tool/${toolId}`,
  };
}

// 默认导出 SEO 组件
export default SEO;
