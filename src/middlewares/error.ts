import { ParameterizedContext, DefaultState, DefaultContext, Next } from "koa";

// ref: https://github.com/koajs/koa/blob/master/docs/error-handling.md
// TODO: 去掉当前中间件，替换成 https://github.com/koajs/error

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
      // will only respond with JSON
      try {
        console.error("Error Middleware: ", error);
        const { status, statusCode, body } = JSON.parse(error.message);
        ctx.status = statusCode || status || 500;
        ctx.body = body;
        // eslint-disable-next-line
      } catch (error: any) {
        ctx.status = error.statusCode || error.status || 500;
        ctx.body = {
          message: error.message,
        };
      }
    }
  };
