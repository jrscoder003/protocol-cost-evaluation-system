const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const MACHINE_LIBRARY_DIR = path.join(DATA_DIR, 'machine-libraries');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const data = raw ? JSON.parse(raw) : {};
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sanitizeMachineType(value) {
  const machineType = String(value || '').trim();
  const safeName = machineType.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_').slice(0, 80);
  return { machineType, safeName };
}

function machineLibraryFilePath(machineType) {
  const { safeName } = sanitizeMachineType(machineType);
  if (!safeName) {
    return '';
  }
  ensureDirSync(MACHINE_LIBRARY_DIR);
  return path.join(MACHINE_LIBRARY_DIR, `${safeName}.json`);
}

function defaultMachineLibrary(machineType) {
  return {
    machineType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      agreementLibrary: [],
      reportLibrary: [],
      costLibrary: [],
      parts: [],
      productTypes: [],
      focusRules: [],
      infoDocs: [],
      refDocs: []
    }
  };
}

function readMachineLibrary(machineType) {
  const filePath = machineLibraryFilePath(machineType);
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeMachineLibrary(machineType, payload) {
  const filePath = machineLibraryFilePath(machineType);
  if (!filePath) {
    throw new Error('机型不能为空');
  }

  const now = new Date().toISOString();
  const existing = readMachineLibrary(machineType);
  const nextData = payload && payload.data ? payload.data : (payload || {});
  const next = {
    machineType,
    createdAt: existing && existing.createdAt ? existing.createdAt : now,
    updatedAt: now,
    data: {
      agreementLibrary: Array.isArray(nextData.agreementLibrary) ? nextData.agreementLibrary : [],
      reportLibrary: Array.isArray(nextData.reportLibrary) ? nextData.reportLibrary : [],
      costLibrary: Array.isArray(nextData.costLibrary) ? nextData.costLibrary : [],
      parts: Array.isArray(nextData.parts) ? nextData.parts : [],
      productTypes: Array.isArray(nextData.productTypes) ? nextData.productTypes : [],
      focusRules: Array.isArray(nextData.focusRules) ? nextData.focusRules : [],
      infoDocs: Array.isArray(nextData.infoDocs) ? nextData.infoDocs : [],
      refDocs: Array.isArray(nextData.refDocs) ? nextData.refDocs : []
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

function serveStatic(req, res) {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const requestPath = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
  const safePath = path.normalize(requestPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { message: 'Forbidden' });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === 'ENOENT') {
        sendJson(res, 404, { message: 'Not Found' });
        return;
      }
      sendJson(res, 500, { message: 'Internal Server Error' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && reqUrl.pathname === '/api/machine-libraries') {
    try {
      ensureDirSync(MACHINE_LIBRARY_DIR);
      const files = fs.readdirSync(MACHINE_LIBRARY_DIR).filter((item) => item.endsWith('.json'));
      const items = files.map((file) => {
        const filePath = path.join(MACHINE_LIBRARY_DIR, file);
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          machineType: parsed.machineType || path.basename(file, '.json'),
          updatedAt: parsed.updatedAt || '',
          createdAt: parsed.createdAt || ''
        };
      });
      sendJson(res, 200, { items });
      return;
    } catch (error) {
      sendJson(res, 500, { message: `读取机型库失败：${error.message}` });
      return;
    }
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/machine-libraries/load') {
    const machineType = reqUrl.searchParams.get('machineType') || '';
    if (!machineType.trim()) {
      sendJson(res, 400, { message: 'machineType 不能为空' });
      return;
    }

    try {
      const record = readMachineLibrary(machineType);
      if (!record) {
        sendJson(res, 404, { message: '机型库不存在' });
        return;
      }
      sendJson(res, 200, record);
      return;
    } catch (error) {
      sendJson(res, 500, { message: `读取失败：${error.message}` });
      return;
    }
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/machine-libraries/create') {
    parseJsonBody(req).then((body) => {
      const { machineType } = sanitizeMachineType(body.machineType);
      if (!machineType) {
        sendJson(res, 400, { message: 'machineType 不能为空' });
        return;
      }

      const filePath = machineLibraryFilePath(machineType);
      if (!filePath) {
        sendJson(res, 400, { message: '无效机型名称' });
        return;
      }

      if (fs.existsSync(filePath)) {
        const existing = readMachineLibrary(machineType);
        sendJson(res, 200, { message: '机型库已存在', library: existing });
        return;
      }

      const library = defaultMachineLibrary(machineType);
      fs.writeFileSync(filePath, JSON.stringify(library, null, 2), 'utf8');
      sendJson(res, 201, { message: '机型库创建成功', library });
    }).catch((error) => {
      sendJson(res, 400, { message: error.message });
    });
    return;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/machine-libraries/save') {
    parseJsonBody(req).then((body) => {
      const { machineType } = sanitizeMachineType(body.machineType);
      if (!machineType) {
        sendJson(res, 400, { message: 'machineType 不能为空' });
        return;
      }
      const library = writeMachineLibrary(machineType, body.data || body);
      sendJson(res, 200, { message: '机型库保存成功', library });
    }).catch((error) => {
      sendJson(res, 400, { message: error.message });
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/parse/reserved') {
    sendJson(res, 501, {
      message: '该接口为预留扩展点：可接入 OCR、PDF/DOC 专业解析引擎。'
    });
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { message: 'Method Not Allowed' });
});

server.listen(PORT, () => {
  console.log(`协议评估系统已启动: http://localhost:${PORT}`);
});
