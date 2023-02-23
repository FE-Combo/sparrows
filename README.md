# SPARROWS
- 麻雀虽小，五脏俱全；轻量级 KOA 前端服务
- 充当前端服务或前端网关服务，具备静态资源访问、sesion管理以及调用后端api的能力（调用后端api需要业务测根据加签规则自行封装中间件）。
## 特性
- 丰富的中间件能力，包含sesion管理（依赖redis）、链路追踪（依赖jaeger）、CSRF等
- 丰富的工具函数，包含内置apollo、密钥轮转、log4js等
- 支持自定义中间件
- 支持接入Sentry
- 事件异常处理机制

## build-in middlewares
- *context: 存储koa实例、koa.config.js 配置获取

- CSRF: 防止CSRF攻击，采用双重 cookie 方案
    - whitelist：白名单
    - key：需要被写入 headers 的 cookie，默认值为 csrf-token

- redis: session管理，包含redis初始化、get/save/remove逻辑
    - redisOptions：redis [配置](https://github.com/luin/ioredis/blob/v4/API.md#new-redisport-host-options)
    - sessionOptions：session、cookie等[配置](https://github.com/koajs/generic-session#options)
    - redlockSettings：TODO

- jaeger: 链路查询
    - endpoint：服务端点，客户端直接连接到 jaeger 收集器
    - serviceName：服务名称

- proxy: 代理，依赖 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware#readme)，入参也可以是一个数组`[{path:"path1", (...restOptions)}, {path:"path2", (...restOptions)}]`
    - path：路由匹配
    - (...restOptions)：[配置参考](https://github.com/chimurai/http-proxy-middleware#http-proxy-options)

- error：捕获应用中间件异常

- cors：跨域处理
    - origin：允许跨域的来源
    - credentials：是否在请求的携带cookie

- app: 提供应用健康监测/页面路由/api路由
    - baseRoute：应用前缀
    - apiMiddlewares：api路由中间件
    - pageMiddlewares：页面路由中间件

## build-in utils
- apollo: 官方Apollo配置中心
    - serverUrl：服务地址
    - appId：项目唯一标识
    - clusterName：集群名称，默认集群为 default
    - namespaceName[]：命名空间, 默认命名空间为 application

- 密钥轮转: 更安全的密钥机制
    - redisSecrets：密钥数组字符串
    - refreshSecrets：更新密钥数组字符串回调函数

## 压测
- 一般都采用ab，wrk，siege等工具
- ab -r -n 1000 -c 50 http://localhost:3000/ 

## 使用
- 安装：yarn add sparrows --save
- 启动：yarn sparrows（开发环境与线上环境启动命令相同，通过环境变量 NODE_ENV 区分）

## 部署
- 作为独立服务单独部署，但存在单点问题
- 与前端应用融合，不存在单点问题但消耗更多的机器资源

## koa.config.js配置说明（配置入口）
- middlewares: 中间件列表, 支持自定义中间件满足koa标准即可
- sentry: [sentry接入参数](https://docs.sentry.io/platforms/node/)
- errorOptions：处理 steam 和事件的异常，[配置参考](https://github.com/koajs/onerror#options)

## Attentions
- 框架本身只提供基础中间件与工具函数，具体api逻辑根据业务自定义。
- 开启sentry时，会重写`ctx.onerror`，如果对`ctx.onerror`有特殊要求可以重新覆盖，但需要重新添加sentry上报逻辑否则sentry将失效。
- 融合next部署请使用[sparrows-next](https://github.com/vocoWone/sparrows-next)。
- 页面路由不允许存在`/health`，`*/api/*`的格式，前者用于应用健康检测，后者是api路由专用。
- 配置 koa.config.js middlewares 时建议按照 `error`、`cors`、`app` 中间件排序，相关的中间件融合在app中间件中。
