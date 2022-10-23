import {Next,ParameterizedContext, DefaultState} from "koa";
import {match} from "path-to-regexp";
import {saveSession, RedisCTX} from "../src/middlewares/redis";
import {CsrfCTX} from "../src/middlewares/csrf"
import {JaegerCTX, createSubSpan} from "../src/middlewares/jaeger"
import {ProxyCTX} from "../src/middlewares/proxy";
import signature from 'cookie-signature';
import {FORMAT_HTTP_HEADERS} from 'opentracing';
import Crypto from "../src/utils/crypto";

// demo：简单的api中间件

export interface Options {
    redisSecrets: string;
    cookieSecret: string;
    whitelist?: string[];
    saveSessionApi?: string[];
    removeSessionApi?: string[]
}

export interface ApiCTX extends RedisCTX, CsrfCTX, JaegerCTX, ProxyCTX {
    api: Options
}

export const middleware = (options?: Options) => async (ctx: ParameterizedContext<DefaultState, ApiCTX>, next: Next) => {
    createExistMiddlewaresLogs(ctx);
    const span = createSubSpan("api", ctx)
    ctx.jaeger.jaeger.inject(span, FORMAT_HTTP_HEADERS, ctx.req.headers);

    if(options) {
        ctx.api = options;
        if(/\/api\/.*/.test(ctx.path)) {
            span.setTag("api", true)
            const {whitelist=[], saveSessionApi=[], removeSessionApi=[]} = options || {}
            span.setTag("path", ctx.path)
            span.setTag("options", JSON.stringify(options))
            const matchWhitelistUrl = whitelist?.length > 0 ? match(whitelist, { decode: decodeURIComponent }) : undefined;
            const matchSaveSessionUrl = saveSessionApi?.length > 0 ? match(saveSessionApi, { decode: decodeURIComponent }) : undefined;
            const matchremoveSessionUrl = removeSessionApi?.length> 0 ? match(removeSessionApi, { decode: decodeURIComponent }) : undefined;
            const crypto = new Crypto({secrets: options.redisSecrets});

            if(matchWhitelistUrl && matchWhitelistUrl(ctx.path)) {
                if(matchSaveSessionUrl && matchSaveSessionUrl(ctx.path)) {
                    span.setTag("info", "save session");
                    ctx.body = {info: "save session"}
                    await saveSession(crypto.encrypt(JSON.stringify({test: "test2"})), ctx);
                } else {
                    span.setTag("info", "unauth normal");
                    ctx.body = {info: "unauth normal"}
                }
            } else {
                if(matchremoveSessionUrl && matchremoveSessionUrl(ctx.path)) {
                    span.setTag("info", "remove session");
                    ctx.body = {info: "remove session"}
                    await removeSession(ctx);
                } else {
                    const session = await getSession(ctx);
                    if(session) {
                        const result = await crypto.decrypt(session, true)
                        if(result) {
                            console.info(JSON.parse(result))
                        }
                    }
                    span.setTag("info", "auth normal");
                    ctx.body = {info: "auth normal"};
                } 
            }
        } else {
            span.setTag("route", true)
        }     
    }
    await next()
    span.finish();
}

function createExistMiddlewaresLogs(ctx: ParameterizedContext<DefaultState, ApiCTX>) {
    if(ctx.jaeger) {
        if(ctx.csrf) {
            const {whitelist, key} = ctx.csrf
            const span = createSubSpan("csrf", ctx)
            span.setTag("whitelist",whitelist)
            span.setTag("key",key)
            span.finish();
        }
        if(ctx.redis) {
            const {redisOptions, sessionOptions} = ctx.redis
            const span = createSubSpan("redis", ctx);
            span.setTag("host", redisOptions.host)
            span.setTag("port", redisOptions.port)
            span.setTag("sessionOptions",sessionOptions)
            span.finish(); 
        }
        if(ctx.proxy) {
            const {options} = ctx.proxy
            const span = createSubSpan("proxy", ctx);
            span.setTag("options", options)
            span.finish(); 
        }
    }
}


async function getSession(ctx: ParameterizedContext<DefaultState, ApiCTX>) {
    const redis = ctx.redis;
    const {cookieSecret} = ctx.api
    const sidKey: string = redis.sessionOptions.key || "sid";
    const sid = ctx.cookies.get(sidKey) || "";
    const redisKey = signature.sign(sid, cookieSecret) || "";
    const session = await redis.redis.get(redis?.sessionOptions?.prefix + redisKey);
    const sessionJSON = session && JSON.parse(session) || {};
    return sessionJSON?.payload||"";
}

export const removeSession = async (ctx: ParameterizedContext<DefaultState, RedisCTX>)=> {
    try {
        const redis = ctx.redis;
        const {cookieSecret} = ctx.api
        const sidKey: string = redis.sessionOptions.key || 'sid';
        const key = ctx.cookies.get(sidKey);
        if(key) {
            const redisKey = signature.sign(key, cookieSecret) || "";
            ctx.session = null;
            await redis.redis.del(redis?.sessionOptions?.prefix + redisKey)
            ctx.cookies.set(sidKey, null, { expires: new Date(0) })
        }
    } catch (error) {
        console.error(error)   
    }
}