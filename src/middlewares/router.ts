
import {ParameterizedContext, DefaultState,  DefaultContext, Next} from "koa";
import koaStatic from 'koa-static';

// 作为微应用，子应用的baseRoute前缀必须与框架路由前缀保持一致
// e.g: Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
const baseRoute = process.env.BASE_ROUTE

// 当前组件需要在所有插件之前执行，跨域配置除外
export const middleware = () => async ( ctx: ParameterizedContext<DefaultState, DefaultContext>, next: Next) => {
    if(ctx.path===`${ctx.state.baseRoute || baseRoute || ""}/health` && ctx.method==="GET") {
        // 健康监测
        const { res } = ctx
        res.writeHead(200, { 'Content-type': 'text/html' })
        res.end("ok")
        ctx.respond = false
    } else if(/^\/api\/.*/.test(ctx.path)) {
        // 调用云端 api
        await next();
    } else {
        // 页面路由
    }
}
