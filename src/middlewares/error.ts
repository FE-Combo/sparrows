import { ParameterizedContext, DefaultState, DefaultContext, Next } from "koa";

// ref: https://github.com/koajs/koa/blob/master/docs/error-handling.md
// 自定义 error 中间件，根据 error.message 解析错误信息
// 错误捕获也可以替换为 koa-error 或 koa-onerror（koaErrorOptions/onErrorOptions）
export const middleware =
  () =>
  async (
    ctx: ParameterizedContext<DefaultState, DefaultContext>,
    next: Next
  ) => {
    try {
      await next();
      // eslint-disable-next-line
    } catch (error: any) {
      console.error("Error Middleware: ", error);
      try {
        const { status, statusCode, body } = JSON.parse(error.message);
        ctx.status =statusCode || status || error.statusCode || error.status || 500;
        ctx.body = body;
      } catch (_error) {
        ctx.status = error.statusCode || error.status || 500;
        ctx.body = {
          message: error.message,
        };
      }
    }
  };
