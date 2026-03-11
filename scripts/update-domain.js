#!/usr/bin/env node
/**
 * 部署时更新域名
 * 用法： SITE_URL=https://your-domain.com node scripts/update-domain.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteUrl = process.env.SITE_URL || '';

if (!siteUrl) {
  console.log('⚠️  未设置 SITE_URL 环境变量，使用相对路径');
  process.exit(0);
}

const distDir = path.join(__dirname, '../dist');

// 确保 dist 目录存在
if (!fs.existsSync(distDir)) {
  console.error('❌ dist 目录不存在，请先运行 npm run build');
  process.exit(1);
}

// 更新 sitemap.xml
const sitemapPath = path.join(distDir, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, 'utf-8');
  // 将相对路径替换为绝对 URL
  sitemap = sitemap.replace(/<loc>\//g, `<loc>${siteUrl}/`);
  fs.writeFileSync(sitemapPath, sitemap);
  console.log('✅ 已更新 sitemap.xml');
}

// 更新 robots.txt
const robotsPath = path.join(distDir, 'robots.txt');
if (fs.existsSync(robotsPath)) {
  let robots = fs.readFileSync(robotsPath, 'utf-8');
  robots = robots.replace(
    /Sitemap: .*/,
    `Sitemap: ${siteUrl}/sitemap.xml`
  );
  fs.writeFileSync(robotsPath, robots);
  console.log('✅ 已更新 robots.txt');
}

// 更新所有工具页面的 canonical URL
const toolDir = path.join(distDir, 'tool');
if (fs.existsSync(toolDir)) {
  const tools = fs.readdirSync(toolDir);
  tools.forEach(toolId => {
    const indexPath = path.join(toolDir, toolId, 'index.html');
    if (fs.existsSync(indexPath)) {
      let html = fs.readFileSync(indexPath, 'utf-8');
      // 替换 canonical URL
      html = html.replace(
        /<link rel="canonical" href=".*?"\/>/,
        `<link rel="canonical" href="${siteUrl}/tool/${toolId}"/>`
      );
      // 替换 og:url
      html = html.replace(
        /<meta property="og:url" content=".*?"\/>/,
        `<meta property="og:url" content="${siteUrl}/tool/${toolId}"/>`
      );
      fs.writeFileSync(indexPath, html);
    }
  });
  console.log(`✅ 已更新 ${tools.length} 个工具页面的 URL`);
}

console.log(`\n🎉 域名已更新为: ${siteUrl}`);
