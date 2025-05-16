# Soybean Admin Mock API 部署指南

本文档提供了如何设置和部署Mock API服务以支持Soybean Admin前端应用的详细说明。

## 目录结构

```
mock-server/
  |- index.js          # 主服务器文件
  |- package.json      # 项目依赖
  |- README.md         # 基本说明
  |- SETUP.md          # 本文档
```

## 部署步骤

### 1. 安装依赖

首先，进入mock-server目录，安装必要的依赖：

```bash
cd mock-server
npm install
# 或者
pnpm install
```

### 2. 启动服务器

启动Mock API服务器：

```bash
npm start
# 或者
pnpm start
```

服务器将默认运行在3000端口。可以通过环境变量`PORT`修改端口号。

### 3. 配置前端应用

确保Soybean Admin前端应用配置正确的API基础URL。这通常在环境变量文件中设置（如`.env`，`.env.production`等）。

示例配置：

```
# 后端服务的基础地址
VITE_SERVICE_BASE_URL=http://localhost:3000
# 成功请求的状态码
VITE_SERVICE_SUCCESS_CODE=0000
```

### 4. 环境变量配置

如果您需要自定义API服务的某些行为，可以设置以下环境变量：

- `PORT`：服务器端口号，默认为3000
- `AUTH_SECRET_KEY`：JWT认证密钥，默认为'soybean-admin-secret-key'

### 5. 测试连接

API服务启动后，可以使用以下命令测试连接：

```bash
# 测试登录API
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"userName":"Soybean","password":"123456"}'

# 获取用户信息(需要先登录获取token)
curl -X GET http://localhost:3000/auth/getUserInfo -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 获取路由配置
curl -X GET http://localhost:3000/route/getConstantRoutes
```

## 平台部署注意事项

如果您使用的是特定的部署平台，需要注意以下几点：

1. 确保NodeJS版本>=14
2. 配置正确的环境变量
3. 确保服务有权限监听配置的端口
4. 在functioncat.yaml中，已经预配置了mockapi服务

## 前端连接配置

前端应用连接到Mock API服务需要以下配置：

1. 设置正确的API基础URL（`VITE_SERVICE_BASE_URL`）
2. 适当的成功状态码（`VITE_SERVICE_SUCCESS_CODE`='0000'）
3. 适当的登出返回码（`VITE_SERVICE_LOGOUT_CODES`='401,403,1001'）
4. 适当的token过期返回码（`VITE_SERVICE_EXPIRED_TOKEN_CODES`='2001,2002,2003'）

## 常见问题

### 1. 服务无法启动

检查：
- 端口是否被占用
- 依赖是否安装完整
- NodeJS版本是否兼容

### 2. 前端无法连接到API

检查：
- API服务是否正常运行
- 前端配置的API基础URL是否正确
- 网络/防火墙是否允许连接

### 3. 登录失败

检查：
- 用户名密码是否正确
- 请求格式是否符合API要求
- 服务器日志是否有错误信息 