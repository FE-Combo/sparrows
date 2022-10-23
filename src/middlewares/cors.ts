
import {ParameterizedContext, DefaultState, DefaultContext, Next} from "koa";

export interface CORS extends DefaultContext{}

export const middleware = () => async ( ctx: ParameterizedContext<DefaultState, CORS>, next: Next) => {
    // 跨域支持
    // 不能使用 ctx.res.setHeader 否则会导致 Error: Cannot set headers after they are sent to the client
    // 为了系统安装考虑开启Credentials后需要给origin添加白名单，建议重新写一个中间件覆盖当前逻辑
    // 使用@koa/cors代替
    ctx.set('access-control-allow-origin', '*');
    ctx.set('Access-Control-Allow-Credentials', "true");
    await next();
}
