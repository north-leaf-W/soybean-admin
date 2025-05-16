const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 配置中间件
app.use(cors());
app.use(express.json());

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

// 启动服务器
app.listen(PORT, () => {
  console.log(`Mock API服务器运行在端口 ${PORT}`);
  console.log(`访问API: http://localhost:${PORT}/`);
}); 