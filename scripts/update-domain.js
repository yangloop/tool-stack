#!/usr/bin/env node
/**
 * 部署后更新域名
 * 用于在构建后注入实际部署的域名
 * 
 * 用法: 
 *   SITE_URL=https://your-domain.com node scripts/update-domain.js
 *   或
 *   npm run update-domain
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取站点 URL（支持多种环境变量名）
const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || '').replace(/\/$/, '');

if (!siteUrl) {
  console.log('⚠️  未设置 SITE_URL 或 VITE_SITE_URL 环境变量');
  console.log('   使用方式: SITE_URL=https://example.com npm run update-domain');
  process.exit(0);
}

console.log(`🚀 开始更新域名为: ${siteUrl}`);

const distDir = path.join(__dirname, '../dist');

// 确保 dist 目录存在
if (!fs.existsSync(distDir)) {
  console.error('❌ dist 目录不存在，请先运行 npm run build');
  process.exit(1);
}

let updateCount = 0;

// 更新 sitemap.xml
const sitemapPath = path.join(distDir, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, 'utf-8');
  
  // 将相对路径替换为绝对 URL
  const originalSitemap = sitemap;
  sitemap = sitemap.replace(/<loc>\//g, `<loc>${siteUrl}/`);
  
  if (sitemap !== originalSitemap) {
    fs.writeFileSync(sitemapPath, sitemap);
    console.log('✅ 已更新 sitemap.xml');
    updateCount++;
  } else {
    console.log('⏭️  sitemap.xml 无需更新');
  }
} else {
  console.log('⚠️  sitemap.xml 不存在');
}

// 更新 robots.txt
const robotsPath = path.join(distDir, 'robots.txt');
if (fs.existsSync(robotsPath)) {
  let robots = fs.readFileSync(robotsPath, 'utf-8');
  
  const originalRobots = robots;
  robots = robots.replace(
    /Sitemap: .*/,
    `Sitemap: ${siteUrl}/sitemap.xml`
  );
  
  if (robots !== originalRobots) {
    fs.writeFileSync(robotsPath, robots);
    console.log('✅ 已更新 robots.txt');
    updateCount++;
  } else {
    console.log('⏭️  robots.txt 无需更新');
  }
} else {
  console.log('⚠️  robots.txt 不存在');
}

// 更新所有工具页面的 URL
const toolDir = path.join(distDir, 'tool');
if (fs.existsSync(toolDir)) {
  const tools = fs.readdirSync(toolDir);
  let toolUpdateCount = 0;
  
  tools.forEach(toolId => {
    const indexPath = path.join(toolDir, toolId, 'index.html');
    if (fs.existsSync(indexPath)) {
      let html = fs.readFileSync(indexPath, 'utf-8');
      const originalHtml = html;
      
      // 替换各种 URL
      const toolUrl = `${siteUrl}/tool/${toolId}`;
      const imageUrl = `${siteUrl}/logo.svg`;
      
      // Canonical URL
      html = html.replace(
        /<link rel="canonical" href="[^"]*"\/>/,
        `<link rel="canonical" href="${toolUrl}"/>`
      );
      
      // Open Graph URL
      html = html.replace(
        /<meta property="og:url" content="[^"]*"\/>/,
        `<meta property="og:url" content="${toolUrl}"/>`
      );
      
      // Open Graph Image
      html = html.replace(
        /<meta property="og:image" content="[^"]*"\/>/,
        `<meta property="og:image" content="${imageUrl}"/>`
      );
      
      // Twitter Image
      html = html.replace(
        /<meta property="twitter:image" content="[^"]*"\/>/,
        `<meta property="twitter:image" content="${imageUrl}"/>`
      );
      
      // JSON-LD URL
      html = html.replace(
        /"url": "[^"]*"/,
        `"url": "${toolUrl}"`
      );
      
      // JSON-LD Image
      html = html.replace(
        /"image": "[^"]*"/,
        `"image": "${imageUrl}"`
      );
      
      if (html !== originalHtml) {
        fs.writeFileSync(indexPath, html);
        toolUpdateCount++;
      }
    }
  });
  
  if (toolUpdateCount > 0) {
    console.log(`✅ 已更新 ${toolUpdateCount} 个工具页面的 URL`);
    updateCount++;
  } else {
    console.log('⏭️  工具页面无需更新');
  }
} else {
  console.log('⚠️  tool 目录不存在');
}

// 输出总结
console.log('\n' + '='.repeat(50));
if (updateCount > 0) {
  console.log(`✅ 域名更新完成: ${siteUrl}`);
} else {
  console.log('⏭️  没有文件需要更新');
}
console.log('='.repeat(50));
