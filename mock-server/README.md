# Soybean Admin Mock API 服务

这是一个为Soybean Admin提供的Mock API服务，用于模拟后端API，支持登录、获取用户信息和路由等功能。

## 安装和运行

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

或者使用pnpm:

```bash
# 安装依赖
pnpm install

# 启动服务器
pnpm start
```

服务器默认运行在3000端口，可以通过设置环境变量`PORT`来修改端口号。

## 环境变量

- `PORT`: 服务器端口号，默认为3000
- `AUTH_SECRET_KEY`: JWT密钥，默认为'soybean-admin-secret-key'

## API端点

### 1. 登录

- **URL**: `/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "userName": "用户名",
    "password": "密码"
  }
  ```
- **响应**:
  ```json
  {
    "code": "0000",
    "msg": "登录成功",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 2. 获取用户信息

- **URL**: `/auth/getUserInfo`
- **方法**: `GET`
- **请求头**: 需要包含`Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "code": "0000",
    "msg": "获取用户信息成功",
    "data": {
      "userId": "1",
      "userName": "Soybean",
      "roles": ["super"],
      "buttons": ["btn1", "btn2", "btn3"]
    }
  }
  ```

### 3. 刷新Token

- **URL**: `/auth/refreshToken`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **响应**:
  ```json
  {
    "code": "0000",
    "msg": "刷新Token成功",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 4. 获取路由配置

- **URL**: `/route/getConstantRoutes`
- **方法**: `GET`
- **响应**: 返回预定义的路由配置

## 测试账户

服务中预设了以下测试账户，所有账户的密码均为 `123456`:

1. **Soybean** - 超级管理员
2. **Super** - 超级管理员
3. **Admin** - 管理员
4. **User** - 普通用户 