import {ParameterizedContext, DefaultState, Next, DefaultContext} from "koa";
import Redis from "ioredis";
import redisStore from "koa-redis";
import RedLock, {Settings} from "redlock";
import session, {SessionStore, SessionOptions} from "koa-generic-session";

export interface RedisCTX extends DefaultContext {
    redis: KoaRedis
}

export interface KoaRedis extends Options {
    redis: Redis.Redis,
    redlock: RedLock,
}

export interface Options {
    redisOptions: Redis.RedisOptions
    sessionOptions: SessionOptions
    redlockSettings?: Settings
}

let redis: Redis.Redis | null = null;

let redlock: RedLock | null = null;

export const middleware = (options: Options) => async ( ctx: ParameterizedContext<DefaultState, RedisCTX>, next: Next) => {
    const {redisOptions, sessionOptions, redlockSettings} = options;
    if(!redis) {
        redis = new Redis(redisOptions);
    }
    if(!redlock) {
        redlock = new RedLock([redis], redlockSettings || {})
    }

    ctx.redis = { redis,redlock, redisOptions, sessionOptions, redlockSettings }
    await session({
        store: redisStore((redisOptions || {}) as redisStore.RedisOptions) as unknown as SessionStore,
    ...sessionOptions
    })(ctx, next);
}

// 该方法会自动在浏览器上种下cookie，返回的sessionId就是对应浏览器的cookie值。但是当前链路不会立即生效需要发送到客户端后才能生效，所以ctx.cookies.get(sid)拿不到最新值，若在同一链路上更新cookie需要手动将sid存储到ctx上或往下透传
export const saveSession = async (value: any, ctx: ParameterizedContext<DefaultState, RedisCTX>, key: string = "payload") => {
    try {    
        ctx.session![key] = value;
        if(ctx?.saveSession) await ctx.saveSession();
        return ctx.sessionId;
    } catch (error) {
        console.error(error);
    }
}

export const removeSession = async (ctx: ParameterizedContext<DefaultState, RedisCTX>)=> {
    try {
        const redis = ctx.redis;
        const sidKey: string = redis.sessionOptions.key || 'sid';
        const key = ctx.cookies.get(sidKey);
        if(key) {
            ctx.session = null;
            await redis.redis.del(key)
            ctx.cookies.set(sidKey, null, { expires: new Date(0) })
        }
    } catch (error) {
        console.error(error)   
    }
}