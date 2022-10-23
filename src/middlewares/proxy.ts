
import {ParameterizedContext,DefaultState, DefaultContext, Next} from "koa";
import { createProxyMiddleware, Options as ProxyOptions } from 'http-proxy-middleware'
import c2k from 'koa-connect'
import {match} from "path-to-regexp";
import {IncomingMessage, ServerResponse} from "http"

// proxy必须在bodyparser之前执行

export interface Options extends ProxyOptions {
    path: string | RegExp | (string | RegExp)[],
}

type ConnectMiddleware = (req: IncomingMessage, res: ServerResponse, callback: (...args: unknown[]) => void) => void

export interface ProxyCTX  extends DefaultContext{
    proxy: {
        options?: Options
    }
}

export const middleware = (options?: Options | Options[]) => async ( ctx: ParameterizedContext<DefaultState, ProxyCTX>, next: Next) => {
    if(options instanceof Array) {
        for(const _ of options ) {
            const {path, ...restOptions} = _
            if( match(path, { decode: decodeURIComponent })(ctx.path) ) {
                return await c2k(createProxyMiddleware(restOptions || {}) as ConnectMiddleware)(ctx, next);
            }
        }
    } else if(options instanceof Object) {
        const {path, ...restOptions} = options
        if( match(path, { decode: decodeURIComponent })(ctx.path) ) {
            return await c2k(createProxyMiddleware(restOptions || {}) as ConnectMiddleware)(ctx, next)
        }
    }
    await next();
}
