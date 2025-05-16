const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
try {
  require('dotenv').config();
  console.log('dotenv 配置已加载');
} catch (error) {
  console.log('dotenv加载失败，使用默认环境变量');
}

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 全局环境变量和参数
const globalConfig = {
  serverVersion: '1.0.0',
  env: {
    VITE_SERVICE_BASE_URL: process.env.VITE_SERVICE_BASE_URL || `http://localhost:${PORT}`,
    VITE_OTHER_SERVICE_BASE_URL: process.env.VITE_OTHER_SERVICE_BASE_URL || '{}', // 确保是字符串形式的JSON
    VITE_SERVICE_SUCCESS_CODE: process.env.VITE_SERVICE_SUCCESS_CODE || '0000',
    VITE_SERVICE_LOGOUT_CODES: process.env.VITE_SERVICE_LOGOUT_CODES || '401,403,1001',
    VITE_SERVICE_MODAL_LOGOUT_CODES: process.env.VITE_SERVICE_MODAL_LOGOUT_CODES || '401',
    VITE_SERVICE_EXPIRED_TOKEN_CODES: process.env.VITE_SERVICE_EXPIRED_TOKEN_CODES || '1004'
  }
};
console.log('全局配置初始化:', JSON.stringify(globalConfig, null, 2));

// 1. URL修复和日志记录中间件 (最先执行)
app.use((req, res, next) => {
  console.log(`[Request Logger] 收到原始请求: ${req.method} ${req.originalUrl}`);
  if (req.url && req.url.includes(':1')) {
    const oldUrl = req.url;
    // 替换末尾的 :1 (在查询参数 ? 之前或字符串末尾)
    req.url = req.url.replace(/(:1)(?=\?|$)/, '');
    console.log(`[URL Fixer] URL已修复: 从 "${oldUrl}" 到 "${req.url}". 处理后的 req.path: "${req.path}"`);
  }
  next();
});

// 2. 标准中间件
app.use(cors());
app.use(express.json());

// JWT密钥 (保持不变)
const JWT_SECRET = process.env.AUTH_SECRET_KEY || 'soybean-admin-secret-key';

// 模拟用户数据 (保持不变)
const users = {
  'Soybean': { password: '123456', userId: '1', userName: 'Soybean', roles: ['super'], buttons: ['btn1', 'btn2', 'btn3'], },
  'Super': { password: '123456', userId: '2', userName: 'Super', roles: ['super'], buttons: ['btn1', 'btn2', 'btn3'], },
  'Admin': { password: '123456', userId: '3', userName: 'Admin', roles: ['admin'], buttons: ['btn1', 'btn2'], },
  'User': { password: '123456', userId: '4', userName: 'User', roles: ['user'], buttons: ['btn1'], }
};

// 3. API路由定义
// 根路由，提供API信息
app.get('/', (req, res) => {
  console.log('[Route Handler] GET /');
  res.json({
    name: 'Soybean Admin Mock API',
    version: globalConfig.serverVersion,
    status: 'running',
    globalEnvConfig: globalConfig.env,
    endpoints: [
      { path: '/auth/login', method: 'POST', description: '用户登录' },
      { path: '/auth/getUserInfo', method: 'GET', description: '获取用户信息' },
      { path: '/auth/refreshToken', method: 'POST', description: '刷新Token' },
      { path: '/route/getConstantRoutes', method: 'GET', description: '获取路由配置' },
      { path: '/api/config', method: 'GET', description: '获取前端所需的环境变量模拟值' }
    ],
    testAccounts: Object.keys(users).map(username => ({ username, password: users[username].password, role: users[username].roles[0] }))
  });
});

// 登录API (逻辑保持不变)
app.post('/auth/login', (req, res) => {
  console.log(`[Route Handler] POST /auth/login, Body:`, req.body);
  const { userName, password } = req.body;
  const user = users[userName];
  if (!user || user.password !== password) {
    return res.status(401).json({ code: '1001', msg: '用户名或密码错误', data: null });
  }
  const token = jwt.sign({ userId: user.userId, userName: user.userName, roles: user.roles }, JWT_SECRET, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ code: '0000', msg: '登录成功', data: { token, refreshToken } });
});

// 获取用户信息API (逻辑保持不变)
app.get('/auth/getUserInfo', (req, res) => {
  console.log(`[Route Handler] GET /auth/getUserInfo, Headers:`, req.headers);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ code: '1002', msg: '未授权，请先登录', data: null });
  }
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = Object.values(users).find(u => u.userId === decoded.userId);
    if (!user) {
      return res.status(404).json({ code: '1003', msg: '用户不存在', data: null });
    }
    return res.json({ code: '0000', msg: '获取用户信息成功', data: { userId: user.userId, userName: user.userName, roles: user.roles, buttons: user.buttons } });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ code: '1004', msg: 'Token已过期', data: null });
    }
    return res.status(401).json({ code: '1005', msg: 'Token无效', data: null });
  }
});

// 刷新Token API (逻辑保持不变)
app.post('/auth/refreshToken', (req, res) => {
  console.log(`[Route Handler] POST /auth/refreshToken, Body:`, req.body);
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ code: '1006', msg: '缺少refreshToken', data: null });
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = Object.values(users).find(u => u.userId === decoded.userId);
    if (!user) {
      return res.status(404).json({ code: '1003', msg: '用户不存在', data: null });
    }
    const newToken = jwt.sign({ userId: user.userId, userName: user.userName, roles: user.roles }, JWT_SECRET, { expiresIn: '24h' });
    const newRefreshToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ code: '0000', msg: '刷新Token成功', data: { token: newToken, refreshToken: newRefreshToken } });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ code: '1007', msg: 'refreshToken已过期', data: null });
    }
    return res.status(401).json({ code: '1008', msg: 'refreshToken无效', data: null });
  }
});

// 路由API (逻辑保持不变)
app.get('/route/getConstantRoutes', (req, res) => {
  console.log(`[Route Handler] GET /route/getConstantRoutes`);
  return res.json({
    code: '0000', msg: '获取路由成功', data: [
      { name: 'dashboard', path: '/dashboard', component: 'basic', children: [ { name: 'dashboard_analysis', path: '/dashboard/analysis', component: 'self', meta: { title: '分析页', requiresAuth: true, icon: 'icon-park-outline:analysis' } }, { name: 'dashboard_workbench', path: '/dashboard/workbench', component: 'self', meta: { title: '工作台', requiresAuth: true, icon: 'icon-park-outline:workbench' } } ], meta: { title: '仪表盘', icon: 'mdi:monitor-dashboard', order: 1 } },
      { name: 'document', path: '/document', component: 'basic', children: [ { name: 'document_vue', path: '/document/vue', component: 'self', meta: { title: 'Vue文档', requiresAuth: true, icon: 'logos:vue' } }, { name: 'document_vite', path: '/document/vite', component: 'self', meta: { title: 'Vite文档', requiresAuth: true, icon: 'logos:vitejs' } } ], meta: { title: '文档', icon: 'mdi:file-document-multiple-outline', order: 2 } }
    ]
  });
});

// 自定义错误接口 (逻辑保持不变)
app.get('/auth/error', (req, res) => {
  console.log(`[Route Handler] GET /auth/error, Query:`, req.query);
  const { code, msg } = req.query;
  res.status(400).json({ code: code || '9999', msg: msg || '自定义错误', data: null });
});

// 环境变量接口 (移除 /api/config:1, 因为 :1 应由URL Fixer处理)
app.get('/api/config', (req, res) => {
  console.log(`[Route Handler] GET /api/config`);
  res.json({ code: '0000', msg: '获取配置成功', data: globalConfig.env });
});

// 4. 404处理中间件 (在所有路由之后)
app.use((req, res, next) => {
  console.log(`[404 Handler] 未匹配到路由: ${req.method} ${req.originalUrl} (处理后的 path: ${req.path})`);
  res.status(404).json({
    code: '404',
    msg: `请求的资源未找到: ${req.method} ${req.originalUrl}`,
    data: null
  });
});

// 5. 全局错误处理中间件 (最后)
app.use((err, req, res, next) => {
  console.error('[Global Error Handler] API错误:', err.stack || err);
  res.status(err.status || 500).json({
    code: err.code || '9999',
    msg: err.message || '服务器内部错误',
    data: null
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
===================================================
  Mock API服务器启动成功 (v${globalConfig.serverVersion})
===================================================
  访问地址: http://localhost:${PORT}/
  运行端口: ${PORT}
  JWT 密钥: ${JWT_SECRET === 'soybean-admin-secret-key' ? '默认值 (soybean-admin-secret-key)' : '环境变量已设置'}
  测试账号: Soybean/Super/Admin/User (密码均为123456)
===================================================
  前端环境变量配置示例 (.env.development 或 .env.production):
  VITE_SERVICE_BASE_URL=http://localhost:${PORT}
  VITE_OTHER_SERVICE_BASE_URL='{}' (注意: 必须是JSON字符串, 例如 '{}' 或 '{"key":"value"}')
  VITE_SERVICE_SUCCESS_CODE=0000
  VITE_SERVICE_LOGOUT_CODES=401,403,1001
  VITE_SERVICE_EXPIRED_TOKEN_CODES=1004
===================================================
`);
}); 
