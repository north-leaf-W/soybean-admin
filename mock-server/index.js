const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv加载失败，使用默认环境变量');
}

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 全局环境变量和参数
const globalConfig = {
  // 服务信息
  serverVersion: '1.0.0',
  // 环境变量默认值
  env: {
    VITE_SERVICE_BASE_URL: process.env.VITE_SERVICE_BASE_URL || `http://localhost:${PORT}`,
    VITE_OTHER_SERVICE_BASE_URL: process.env.VITE_OTHER_SERVICE_BASE_URL || '{}',
    VITE_SERVICE_SUCCESS_CODE: process.env.VITE_SERVICE_SUCCESS_CODE || '0000',
    VITE_SERVICE_LOGOUT_CODES: process.env.VITE_SERVICE_LOGOUT_CODES || '401,403,1001',
    VITE_SERVICE_MODAL_LOGOUT_CODES: process.env.VITE_SERVICE_MODAL_LOGOUT_CODES || '401',
    VITE_SERVICE_EXPIRED_TOKEN_CODES: process.env.VITE_SERVICE_EXPIRED_TOKEN_CODES || '1004'
  }
};

// URL修复中间件（移到最前面确保优先处理）
app.use((req, res, next) => {
  try {
    if (req.url.includes(':1')) {
      req.url = req.url.replace(':1', '');
      console.log(`已修复URL: ${req.url}`);
    }
    console.log(`收到请求: ${req.method} ${req.url}`);
    next();
  } catch (error) {
    console.error('URL处理错误:', error);
    next();
  }
});

// 配置中间件
app.use(cors());
app.use(express.json());

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('API错误:', err);
  res.status(500).json({
    code: '9999',
    msg: '服务器内部错误',
    data: null
  });
});

// JWT密钥
const JWT_SECRET = process.env.AUTH_SECRET_KEY || 'soybean-admin-secret-key';

// 模拟用户数据
const users = {
  'Soybean': {
    password: '123456',
    userId: '1',
    userName: 'Soybean',
    roles: ['super'],
    buttons: ['btn1', 'btn2', 'btn3'],
  },
  'Super': {
    password: '123456',
    userId: '2',
    userName: 'Super',
    roles: ['super'],
    buttons: ['btn1', 'btn2', 'btn3'],
  },
  'Admin': {
    password: '123456',
    userId: '3',
    userName: 'Admin',
    roles: ['admin'],
    buttons: ['btn1', 'btn2'],
  },
  'User': {
    password: '123456',
    userId: '4',
    userName: 'User',
    roles: ['user'],
    buttons: ['btn1'],
  }
};

// 根路由，提供API信息
app.get('/', (req, res) => {
  res.json({
    name: 'Soybean Admin Mock API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      { path: '/auth/login', method: 'POST', description: '用户登录' },
      { path: '/auth/getUserInfo', method: 'GET', description: '获取用户信息' },
      { path: '/auth/refreshToken', method: 'POST', description: '刷新Token' },
      { path: '/route/getConstantRoutes', method: 'GET', description: '获取路由配置' }
    ],
    testAccounts: [
      { username: 'Soybean', password: '123456', role: 'super' },
      { username: 'Super', password: '123456', role: 'super' },
      { username: 'Admin', password: '123456', role: 'admin' },
      { username: 'User', password: '123456', role: 'user' }
    ]
  });
});

// 路由定义
// 登录API
app.post('/auth/login', (req, res) => {
  const { userName, password } = req.body;
  
  // 验证用户
  const user = users[userName];
  if (!user || user.password !== password) {
    return res.status(401).json({
      code: '1001',
      msg: '用户名或密码错误',
      data: null
    });
  }

  // 生成token
  const token = jwt.sign(
    { 
      userId: user.userId,
      userName: user.userName,
      roles: user.roles
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // 生成refreshToken
  const refreshToken = jwt.sign(
    { userId: user.userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 返回成功响应
  return res.json({
    code: '0000',
    msg: '登录成功',
    data: {
      token,
      refreshToken
    }
  });
});

// 获取用户信息API
app.get('/auth/getUserInfo', (req, res) => {
  // 从请求头获取token
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      code: '1002',
      msg: '未授权，请先登录',
      data: null
    });
  }

  // 验证token
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 根据解码后的信息查找用户
    const user = Object.values(users).find(u => u.userId === decoded.userId);
    if (!user) {
      return res.status(404).json({
        code: '1003',
        msg: '用户不存在',
        data: null
      });
    }

    // 返回用户信息
    return res.json({
      code: '0000',
      msg: '获取用户信息成功',
      data: {
        userId: user.userId,
        userName: user.userName,
        roles: user.roles,
        buttons: user.buttons
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: '1004',
        msg: 'Token已过期',
        data: null
      });
    }
    
    return res.status(401).json({
      code: '1005',
      msg: 'Token无效',
      data: null
    });
  }
});

// 刷新Token API
app.post('/auth/refreshToken', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      code: '1006',
      msg: '缺少refreshToken',
      data: null
    });
  }

  try {
    // 验证refreshToken
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const userId = decoded.userId;
    
    // 查找用户
    const user = Object.values(users).find(u => u.userId === userId);
    if (!user) {
      return res.status(404).json({
        code: '1003',
        msg: '用户不存在',
        data: null
      });
    }

    // 生成新token
    const newToken = jwt.sign(
      { 
        userId: user.userId,
        userName: user.userName,
        roles: user.roles
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 生成新refreshToken
    const newRefreshToken = jwt.sign(
      { userId: user.userId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      code: '0000',
      msg: '刷新Token成功',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: '1007',
        msg: 'refreshToken已过期',
        data: null
      });
    }
    
    return res.status(401).json({
      code: '1008',
      msg: 'refreshToken无效',
      data: null
    });
  }
});

// 路由API
app.get('/route/getConstantRoutes', (req, res) => {
  // 返回固定路由配置
  return res.json({
    code: '0000',
    msg: '获取路由成功',
    data: [
      {
        name: 'dashboard',
        path: '/dashboard',
        component: 'basic',
        children: [
          {
            name: 'dashboard_analysis',
            path: '/dashboard/analysis',
            component: 'self',
            meta: {
              title: '分析页',
              requiresAuth: true,
              icon: 'icon-park-outline:analysis'
            }
          },
          {
            name: 'dashboard_workbench',
            path: '/dashboard/workbench',
            component: 'self',
            meta: {
              title: '工作台',
              requiresAuth: true,
              icon: 'icon-park-outline:workbench'
            }
          }
        ],
        meta: {
          title: '仪表盘',
          icon: 'mdi:monitor-dashboard',
          order: 1
        }
      },
      {
        name: 'document',
        path: '/document',
        component: 'basic',
        children: [
          {
            name: 'document_vue',
            path: '/document/vue',
            component: 'self',
            meta: {
              title: 'Vue文档',
              requiresAuth: true,
              icon: 'logos:vue'
            }
          },
          {
            name: 'document_vite',
            path: '/document/vite',
            component: 'self',
            meta: {
              title: 'Vite文档',
              requiresAuth: true,
              icon: 'logos:vitejs'
            }
          }
        ],
        meta: {
          title: '文档',
          icon: 'mdi:file-document-multiple-outline',
          order: 2
        }
      }
    ]
  });
});

// 自定义错误接口
app.get('/auth/error', (req, res) => {
  const { code, msg } = req.query;
  res.status(400).json({
    code: code || '9999',
    msg: msg || '自定义错误',
    data: null
  });
});

// 环境变量接口
app.get('/api/config', (req, res) => {
  res.json({
    code: '0000',
    msg: '获取配置成功',
    data: globalConfig.env
  });
});

// 环境变量接口（带冒号的版本，兼容特殊请求）
app.get('/api/config:1', (req, res) => {
  res.json({
    code: '0000',
    msg: '获取配置成功',
    data: globalConfig.env
  });
});

// 通配符路由处理 - 处理末尾带冒号数字的API请求
app.all('*', (req, res, next) => {
  try {
    const urlPath = req.path;
    // 检查是否为末尾带数字的格式，如 /auth/login:1
    const colonNumberPattern = /^(\/[a-zA-Z0-9\/\-_]+):[0-9]+$/;
    const match = urlPath.match(colonNumberPattern);
    
    if (match) {
      // 找到原始路径并重新路由请求
      const originalPath = match[1];
      console.log(`检测到特殊URL格式: ${urlPath} -> ${originalPath}`);
      
      // 根据原始路径判断转发到哪个API
      if (originalPath === '/auth/login') {
        // 转发到登录API
        return app._router.handle({ ...req, url: '/auth/login', path: '/auth/login' }, res, next);
      } 
      else if (originalPath === '/auth/getUserInfo') {
        // 转发到获取用户信息API
        return app._router.handle({ ...req, url: '/auth/getUserInfo', path: '/auth/getUserInfo' }, res, next);
      }
      else if (originalPath === '/route/getConstantRoutes') {
        // 转发到获取路由API
        return app._router.handle({ ...req, url: '/route/getConstantRoutes', path: '/route/getConstantRoutes' }, res, next);
      }
      else if (originalPath === '/auth/refreshToken') {
        // 转发到刷新Token API
        return app._router.handle({ ...req, url: '/auth/refreshToken', path: '/auth/refreshToken' }, res, next);
      }
      
      // 如果没有匹配的特定API，通用处理
      req.url = originalPath + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
      return app._router.handle(req, res, next);
    }
    
    // 如果不匹配特殊格式，返回404
    res.status(404).json({
      code: '404',
      msg: '请求的资源不存在',
      data: null
    });
  } catch (error) {
    console.error('通配符路由处理错误:', error);
    res.status(500).json({
      code: '9999',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
===================================================
  Mock API服务器启动成功
===================================================
  访问地址: http://localhost:${PORT}/
  测试账号: Soybean/Super/Admin/User (密码均为123456)
===================================================
  
  前端环境变量配置示例(.env.development 或 .env.production):
  
  # 后端服务的基础地址
  VITE_SERVICE_BASE_URL=http://localhost:${PORT}
  
  # 其他服务的基础地址（必须是有效的JSON5格式）
  VITE_OTHER_SERVICE_BASE_URL={}
  
  # 成功请求的状态码
  VITE_SERVICE_SUCCESS_CODE=0000
  
  # 登出状态码
  VITE_SERVICE_LOGOUT_CODES=401,403,1001
  
  # Token过期状态码
  VITE_SERVICE_EXPIRED_TOKEN_CODES=1004
  
  # 是否启用HTTP代理(本地开发时可设为Y)
  VITE_HTTP_PROXY=N
  
  # 是否启用Mock(使用本服务时设为N)
  VITE_ENABLE_MOCK=N
  
===================================================
`)
}); 