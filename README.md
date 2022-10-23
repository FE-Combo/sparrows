# SPARROWS
- 麻雀虽小，五脏俱全；轻量级KOA前端服务

## 特性
- 前端应用服务，支持网关逻辑
- 支持接入reids、csrf、sentry、jaeger
- 内置apollo、密钥轮转、log4js等工具库
- 异常统一处理机制

## build-in middlewares
- *context: 存储koa实例、config配置
- csrf: 防止csrf攻击
- redis: sesion管理，redis初始化、save/remove逻辑
- jaeger: jaeger链路查询
- proxy: 代理
- router: 提供应用健康监测/应用路由/api路由

## build-in utils
- apollo: 官方Apollo配置中心
- 密钥轮转: 更安全的密钥机制
- log4js: 日志生成工具

## 压测
- 一般都采用ab，wrk，siege等工具
- ab -r -n 1000 -c 50 http://localhost:3000/ 

## 使用
- 安装：yarn add sparrows --save
- 开发环境启动：yarn sparrows
- 启动：yarn sparrows（开发环境与线上环境启动命令相同，通过环境变量 NODE_ENV 区分）

## Attentions
- 框架本身只提供基础中间件与工具函数，具体api逻辑根据业务自定义
- 开启sentry时，会重写`ctx.onerror`，如果对`ctx.onerror`有特殊要求可以重新覆盖，但需要重新添加sentry上报逻辑否则sentry将失效。
- 如果作为独立服务部署请使用[sparrows](https://github.com/vocoWone/sparrows)
- 页面路由不允许存在`*/api/*`的格式，此格式专用于云端接口

## Q&A
- Q: 如何搭建api前端网关？
- A: 一个简单的api网关必须具备sesion管理（已提供）以及调用后端api的能力。如何调用后端api需要业务方自行封装api中间件。

## koa.config.js配置说明
- middlewares: 中间件列表, 支持自定义中间件满足koa标准即可
- sentry: [sentry接入参数](https://docs.sentry.io/platforms/node/)