
import {ParameterizedContext, DefaultState, DefaultContext, Next} from "koa";

// ref: https://github.com/koajs/koa/blob/master/docs/error-handling.md
// TODO: 替换成 https://github.com/koajs/error
export const middleware = () => async ( ctx: ParameterizedContext<DefaultState, DefaultContext>, next: Next) => {
  try {
    await next();
  } catch (error: any) {
      // will only respond with JSON
      try {
        const {status, statusCode, body} = JSON.parse(error.message);
        ctx.status = statusCode || status || 500;
        ctx.body = body;
      } catch (error:any) {
        ctx.status = error.statusCode || error.status || 500;
        ctx.body = {
          message: error.message
        };
      }

  }
}
