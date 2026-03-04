#!/usr/bin/env node
/**
 * docs-watch.js - 监控 docs 目录并自动优化文档
 *
 * 使用方法: node docs-watch.js
 * 需要先安装: npm install chokidar
 */

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const DOCS_DIR = path.join(__dirname, 'docs');

// 简单的优化检查
function optimizeDoc(filePath) {
  console.log(`[优化] 检查文件: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  let issues = [];
  let fixed = false;

  // 1. 检查多余的空行
  if (content.includes('\n\n\n')) {
    content = content.replace(/\n{3,}/g, '\n\n');
    issues.push('已修复: 多余空行');
    fixed = true;
  }

  // 2. 检查行尾空格
  if (content.includes('  \n') || content.includes('\t\n')) {
    content = content.replace(/[\t ]+\n/g, '\n');
    issues.push('已修复: 行尾多余空格');
    fixed = true;
  }

  // 3. 检查中文标点
  const chinesePunctuation = {
    ',': '，',
    '.': '。',
    ':': '：',
    ';': '；',
    '!': '！',
    '?': '？',
    '(': '（',
    ')': '）'
  };

  // 4. 检查链接格式
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    if (!match[2].startsWith('http') && !match[2].startsWith('#') && !match[2].endsWith('.md')) {
      issues.push(`警告: 链接 "${match[2]}" 可能无效`);
    }
  }

  // 5. 检查标题层级
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].length);
  }
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i-1] + 1) {
      issues.push(`警告: 标题层级跳变 (h${headings[i-1]} -> h${headings[i]})`);
    }
  }

  if (fixed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ 已自动修复`);
  }

  if (issues.length > 0) {
    console.log(`  📋 问题: ${issues.join(', ')}`);
  } else {
    console.log(`  ✅ 无问题`);
  }

  return { issues, fixed };
}

// 主程序
console.log(`📂 开始监控 docs 目录: ${DOCS_DIR}`);
console.log('按 Ctrl+C 停止\n');

const watcher = chokidar.watch(path.join(DOCS_DIR, '**/*.md'), {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: false
});

watcher
  .on('add', file => optimizeDoc(file))
  .on('change', file => optimizeDoc(file))
  .on('error', error => console.error('错误:', error));

console.log('✨ 监控中...');
