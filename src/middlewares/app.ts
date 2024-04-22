import {
  ParameterizedContext,
  DefaultState,
  DefaultContext,
  Next,
  Middleware,
} from "koa";
import compose from "koa-compose";

// 作为微应用，子应用的baseRoute前缀必须与框架路由前缀保持一致
// e.g: Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
const baseRoute = process.env.BASE_ROUTE;

export interface Options {
  baseRoute?: string;
  // eslint-disable-next-line
  apiMiddlewares?: Middleware<any, any>[];
  // eslint-disable-next-line
  innerApiMiddlewares?: Middleware<any, any>[];
  // eslint-disable-next-line
  pageMiddlewares?: Middleware<any, any>[];
}

// 当前插件用于【api路由】与【页面路由】分流
export const middleware =
  (options?: Options) =>
  async (
    ctx: ParameterizedContext<DefaultState, DefaultContext>,
    next: Next
  ) => {
    const {
      baseRoute: optionBaseRoute,
      apiMiddlewares = [],
      pageMiddlewares = [],
      innerApiMiddlewares = []
    } = options || {};
    const nextBaseRoute = optionBaseRoute || baseRoute;
    
    if (
      ctx.path === `${nextBaseRoute}/health` &&
      ctx.method === "GET"
    ) {
      // 健康监测
      const { res } = ctx;
      res.writeHead(200, { "Content-type": "text/html" });
      res.end("ok");
      ctx.respond = false;
    } else if (new RegExp(`^${nextBaseRoute}\/api\/.*`).test(ctx.path)) {
      // api路由
      await compose(apiMiddlewares)(ctx, next);
    } else if (new RegExp(`^${nextBaseRoute}\/\_api\/.*`).test(ctx.path)) {
      // 内置api路由
      await compose(innerApiMiddlewares)(ctx, next);
    } else {
      // 页面路由与静态资源文件
      await compose(pageMiddlewares)(ctx, next);
    }
  };
