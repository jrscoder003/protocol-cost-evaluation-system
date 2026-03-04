#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取当前的CHANGELOG.md文件
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
const changelogContent = fs.readFileSync(changelogPath, 'utf8');

// 解析命令行参数
const args = process.argv.slice(2);
const version = args[0] || '1.0.0';
const date = new Date().toISOString().split('T')[0];
const changes = args.slice(1).join(' ');

// 生成新的更新记录
const newEntry = `## v${version} (${date})

### 更新内容
- ${changes}

### 修改文件
- ${process.cwd().split(path.sep).pop()}

`;

// 将新的更新记录添加到文件开头
const updatedContent = newEntry + changelogContent;

// 写入更新后的内容
fs.writeFileSync(changelogPath, updatedContent);

console.log('CHANGELOG.md 已更新');
