// Vercel环境变量注入插件脚本
// 这个脚本会在构建时执行，用于将环境变量注入到env-config.js中

const fs = require('fs');
const path = require('path');

// 读取环境变量
const envVars = {
  LEANCLOUD_APP_ID: process.env.LEANCLOUD_APP_ID || 'owY1lPG745pBfChzDzqUkmaa-gzGzoHsz',
  LEANCLOUD_APP_KEY: process.env.LEANCLOUD_APP_KEY || '1defZ4BC6AmnTKqrW1hHfwOs',
  LEANCLOUD_SERVER_URL: process.env.LEANCLOUD_SERVER_URL || 'https://owy1lpg7.lc-cn-n1-shared.com',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'sbgun123',
  HELP_CONTACT: process.env.HELP_CONTACT || 'CJAI0000'
};

console.log('环境变量状态:');
Object.keys(envVars).forEach(key => {
  console.log(`${key}: ${process.env[key] ? '已设置' : '使用默认值'}`);
});

// 生成配置文件内容
const configContent = `// 环境变量配置 - 由构建脚本自动生成
window.ENV = {
  // LeanCloud配置
  LEANCLOUD_APP_ID: '${envVars.LEANCLOUD_APP_ID}',
  LEANCLOUD_APP_KEY: '${envVars.LEANCLOUD_APP_KEY}',
  LEANCLOUD_SERVER_URL: '${envVars.LEANCLOUD_SERVER_URL}',
  
  // 管理员账号信息
  ADMIN_USERNAME: '${envVars.ADMIN_USERNAME}',
  ADMIN_PASSWORD: '${envVars.ADMIN_PASSWORD}',
  
  // 联系信息
  HELP_CONTACT: '${envVars.HELP_CONTACT}'
};`;

// 将配置写入文件
fs.writeFileSync(path.join(__dirname, 'env-config.js'), configContent);
console.log('环境变量已成功注入到env-config.js'); 