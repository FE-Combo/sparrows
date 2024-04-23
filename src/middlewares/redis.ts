import { ParameterizedContext, DefaultState, Next, DefaultContext } from "koa";
import Redis from "ioredis";
import redisStore from "koa-redis";
import RedLock, { Settings } from "redlock";
import session, { SessionStore, SessionOptions } from "koa-generic-session";

export interface RedisCTX extends DefaultContext {
  redis: KoaRedis;
}

export interface KoaRedis extends Options, Omit<Partial<ClusterOptions>, "sessionOptions"> {
  redis: Redis.Redis | Redis.Cluster;
  redlock: RedLock;
}

export interface Options {
  redisOptions?: Redis.RedisOptions;
  sessionOptions: SessionOptions;
  redlockSettings?: Settings;
}

export interface ClusterOptions {
  clusterNodes: Redis.ClusterNode[];
  clusterOptions?: Redis.ClusterOptions
  sessionOptions: SessionOptions;
  redlockSettings?: Settings;
}

let redis: Redis.Redis | null = null;

let clusterRedis: Redis.Cluster | null = null;

let redlock: RedLock | null = null;

export const middleware =
  (options: Options) =>
  async (ctx: ParameterizedContext<DefaultState, RedisCTX>, next: Next) => {
    const { redisOptions, sessionOptions, redlockSettings } = options;
    if (!redis) {
      redis = new Redis(redisOptions);

      redis.once('connect', () => {
        console.info('Successfully connected to the Redis server.');
      });
      
      redis.once('error', (err) => {
        console.error('Error connecting to Redis:', err);
      });
    }
    if (!redlock) {
      redlock = new RedLock([redis], redlockSettings || {});
    }

    ctx.redis = {
      redis,
      redlock,
      redisOptions,
      sessionOptions,
      redlockSettings,
    };
    await session({
      store: redisStore({client: redis}) as unknown as SessionStore,
      ...sessionOptions,
    })(ctx, next);
  };

  // 集群版
  export const clusterMiddleware =
  (options: ClusterOptions) =>
  async (ctx: ParameterizedContext<DefaultState, RedisCTX>, next: Next) => {
    const { clusterNodes, clusterOptions, redlockSettings, sessionOptions } = options;
    if (!clusterRedis) {
      clusterRedis = new Redis.Cluster(clusterNodes, clusterOptions);

      clusterRedis.once('connect', () => {
        console.info('Successfully connected to the Cluster Redis server.');
      });
      
      clusterRedis.once('error', (err) => {
        console.error('Error connecting to Cluster Redis:', err);
      });
    }
    if (!redlock) {
      redlock = new RedLock([clusterRedis], redlockSettings || {});
    }

    ctx.redis = {
      redis: clusterRedis,
      redlock,
      clusterNodes,
      clusterOptions,
      sessionOptions,
      redlockSettings,
    };
    await session({
      store: redisStore({
        client: clusterRedis
      }) as unknown as SessionStore,
      ...sessionOptions,
    })(ctx, next);
  };

// 该方法会返回请求头 set-cookie（在浏览器种下cookie），返回的sessionId就是对应浏览器的cookie值。但是当前链路不会立即生效需要发送到客户端后才能生效，所以ctx.cookies.get(sid)拿不到最新值，若在同一链路上更新cookie需要手动将sid存储到ctx上或往下透传。该方案虽然解决了服务端问题但是客户端同时发起多个并发请求时（Promise all）会导致部分接口使用旧的 cookie，所以需要在业务测加入锁的逻辑
export const saveSession = async (
  // eslint-disable-next-line
  value: any,
  ctx: ParameterizedContext<DefaultState, RedisCTX>,
  key: string = "payload"
) => {
  try {
    ctx.session![key] = value;
    if (ctx?.saveSession) await ctx.saveSession();
    return ctx.sessionId;
  } catch (error) {
    console.error("Save Session Error: ", error);
  }
};

// sid 与 redis-key 一致，若存在映射关系需要重新封装
export const removeSession = async (
  ctx: ParameterizedContext<DefaultState, RedisCTX>
) => {
  try {
    const redis = ctx.redis;
    const sidKey: string = redis.sessionOptions.key || "sid";
    const key = ctx.cookies.get(sidKey);
    if (key) {
      ctx.session = null;
      await redis.redis.del(key);
      ctx.cookies.set(sidKey, null, { expires: new Date(0) });
    }
  } catch (error) {
    console.error("Remove Session Error: ", error);
  }
};

// sid 与 redis-key 一致，若存在映射关系需要重新封装
export async function getSession(
  ctx: ParameterizedContext<DefaultState, RedisCTX>
) {
  const redis = ctx.redis;
  const sidKey: string = redis.sessionOptions.key || "sid";
  const sid = ctx.cookies.get(sidKey) || "";
  const session = await redis.redis.get(sid);
  const sessionJSON = (session && JSON.parse(session)) || {};
  return sessionJSON?.payload || "";
}
