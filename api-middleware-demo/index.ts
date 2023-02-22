import { middleware as apiMiddleware, Options as ApiOpitons } from "./api";
import { middleware as csrfMiddleware } from "../src/middlewares/csrf";
import { middleware as jaegerMiddleware } from "../src/middlewares/jaeger";
import { middleware as redisMiddleware, KoaRedis } from "../src/middlewares/redis";
import { middleware as appMiddleware } from "../src/middlewares/app";
import { middleware as corsMiddleware } from "../src/middlewares/cors";
import { middleware as proxyMiddleware, Options as ProxyOptons} from "../src/middlewares/proxy";
import { middleware as errorMiddleware } from "../src/middlewares/error"
import historyApiFallback from 'koa-history-api-fallback';
import bodyparser from "koa-bodyparser";
import koaStatic from 'koa-static';

interface JaegerOptions {
    endpoint: string;
    serviceName: string;
}

interface CsrfOptions {
    whitelist: string[];
}

interface ApiConfig {
    jaegerOptions: JaegerOptions
    csrfOptions: CsrfOptions
    redisOptions: KoaRedis["redisOptions"]
    sessionOptions: KoaRedis["sessionOptions"]
    apiOptions?: ApiOpitons
    proxyOptions?: ProxyOptons
    [other: string]: any
}

export const withDemo = (config: ApiConfig)=> {
    const {jaegerOptions, csrfOptions, redisOptions, sessionOptions, apiOptions, proxyOptions, ...restConfig} = config;

    const appMiddlewareOptions = {
        apiMiddlewares: [proxyMiddleware(proxyOptions), bodyparser(), jaegerMiddleware(jaegerOptions), csrfMiddleware(csrfOptions), redisMiddleware({redisOptions, sessionOptions}), apiMiddleware(apiOptions)],
        pageMiddlewares: [historyApiFallback(), koaStatic("./demo"),  koaStatic("./demo/public")]
    }

    const appMiddlewares = [errorMiddleware(), corsMiddleware(), appMiddleware(appMiddlewareOptions)]
    return {
        middlewares: appMiddlewares,
        ...restConfig
    }
}

