// proxy-server.js - 本地代理服务器解决阿里百炼 API CORS 问题
// 使用方法: node proxy-server.js

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;
const TARGET_HOST = 'dashscope.aliyuncs.com';

// 创建代理服务器
const server = http.createServer((req, res) => {
  // 添加 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 只处理 /api/* 路径
  if (!req.url.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
    return;
  }

  // 构建目标路径
  // /api/chat/completions -> /compatible-mode/v1/chat/completions
  const apiPath = req.url.replace('/api/chat/completions', '/compatible-mode/v1/chat/completions');

  // 读取请求体
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    // 从请求头获取 Authorization
    const authHeader = req.headers['authorization'] || '';

    // 构建转发请求选项
    const options = {
      hostname: TARGET_HOST,
      port: 443,
      path: apiPath,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    // 发起 HTTPS 请求到阿里百炼
    const proxyReq = https.request(options, (proxyRes) => {
      // 检查是否为流式响应
      const isStream = body && JSON.parse(body).stream;

      if (isStream) {
        // 流式响应 - 直接转发 chunk
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        proxyRes.pipe(res);
      } else {
        // 非流式响应 - 收集完整响应后返回
        let responseData = '';
        proxyRes.on('data', chunk => {
          responseData += chunk;
        });
        proxyRes.on('end', () => {
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': 'application/json'
          });
          res.end(responseData);
        });
      }
    });

    // 错误处理
    proxyReq.on('error', (error) => {
      console.error('Proxy Error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy Error: ' + error.message }));
    });

    // 发送请求体
    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`代理服务器已启动: http://localhost:${PORT}`);
  console.log(`API 代理路径: /api/chat/completions -> https://${TARGET_HOST}/compatible-mode/v1/chat/completions`);
  console.log('按 Ctrl+C 停止服务器');
});