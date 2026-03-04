const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// 创建表单数据
const form = new FormData();
form.append('files', fs.createReadStream('package.json'), { filename: '测试文件.txt' });
form.append('machineType', '测试机型');
form.append('stations', '测试工位');

// 创建请求
const req = http.request('http://localhost:3005/api/agreements/upload', {
  method: 'POST',
  headers: form.getHeaders()
}, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('上传响应:', data);
    
    // 上传成功后获取列表
    http.get('http://localhost:3005/api/agreements', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('列表响应:', data);
      });
    });
  });
});

// 发送表单数据
form.pipe(req);

// 处理错误
req.on('error', (error) => {
  console.error('请求错误:', error);
});
