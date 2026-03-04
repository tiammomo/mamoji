/**
 * 配置同步脚本
 * 将 mamoji.config.json 同步到 .env.local
 *
 * 用法: node tools/sync-config.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'mamoji.config.json');
const ENV_PATH = path.join(__dirname, '..', 'frontend', '.env.local');

function syncConfig() {
  // 读取统一配置文件
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

  // 构建环境变量内容
  const envLines = [
    '# 由 tools/sync-config.js 自动生成，请勿手动修改',
    '# 如需修改请编辑 mamoji.config.json 后运行: node tools/sync-config.js',
    '',
    `# 项目配置 (来自 ${path.basename(CONFIG_PATH)})`,
    `NEXT_PUBLIC_PROJECT_NAME=${config.project}`,
    `NEXT_PUBLIC_VERSION=${config.version}`,
    '',
    '# 端口配置',
    `NEXT_PUBLIC_FRONTEND_PORT=${config.ports.frontend}`,
    `NEXT_PUBLIC_BACKEND_PORT=${config.ports.backend}`,
    '',
    '# API 配置',
    `NEXT_PUBLIC_API_BASE=${config.api.baseUrl}`,
    `NEXT_PUBLIC_API_CORS=${config.api.cors}`,
    '',
    '# 测试账号',
    `NEXT_PUBLIC_TEST_EMAIL=${config.testAccount.email}`,
    `NEXT_PUBLIC_TEST_NICKNAME=${config.testAccount.nickname}`,
    '',
    '# JWT 配置',
    `NEXT_PUBLIC_JWT_EXPIRATION=${config.jwt.expiration}`,
    '',
    '# Next.js 配置',
    'NEXT_TURBOPACK=false',
  ];

  const envContent = envLines.join('\n') + '\n';

  // 写入 .env.local
  fs.writeFileSync(ENV_PATH, envContent, 'utf-8');

  console.log(`✅ 配置已同步到: ${ENV_PATH}`);
  console.log('');
  console.log('生成的环境变量:');
  envLines.slice(2).forEach(line => {
    if (line && !line.startsWith('#')) {
      console.log(`  ${line}`);
    }
  });
}

syncConfig();
