
import {ParameterizedContext, DefaultState, DefaultContext, Next} from "koa";

export interface CORS extends DefaultContext{}

interface Options {
    origin?: string;
    credentials?: string
}

export const middleware = (opitons?: Options) => async ( ctx: ParameterizedContext<DefaultState, CORS>, next: Next) => {
    // 跨域支持
    // 不能使用 ctx.res.setHeader 否则会导致 Error: Cannot set headers after they are sent to the client
    // 出于系统安装考虑开启 Credentials 时需要给 origin 添加白名单，建议重新写一个中间件覆盖当前逻辑
    // 配置 access-control-allow-origin:* 且 Access-Control-Allow-Credentials:true 时容易受到 CSRF 攻击
    // TODO: 使用 @koa/cors 代替
    const {origin, credentials} = opitons || {}
    ctx.set('access-control-allow-origin', origin || '*');
    if(credentials) {
        ctx.set('Access-Control-Allow-Credentials', credentials);
    }
    await next();
}
