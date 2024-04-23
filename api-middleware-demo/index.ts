import { middleware as apiMiddleware, Options as ApiOpitons } from "./api";
import { middleware as csrfMiddleware } from "../src/middlewares/csrf";
import { middleware as jaegerMiddleware } from "../src/middlewares/jaeger";
import {
  middleware as redisMiddleware,
  KoaRedis,
} from "../src/middlewares/redis";
import { middleware as appMiddleware } from "../src/middlewares/app";
import { middleware as corsMiddleware } from "../src/middlewares/cors";
import {
  middleware as proxyMiddleware,
  Options as ProxyOptons,
} from "../src/middlewares/proxy";
import historyApiFallback from "koa-history-api-fallback";
import bodyparser from "koa-bodyparser";
import koaStatic from "koa-static";
import Koa from "koa";

interface OnErrorOptions {
  accepts?: ()=> boolean;
  all?:(error:Error,ctx: Koa.Context)=>void;
  text?:(error:Error,ctx: Koa.Context)=> void;
  json?:(error:Error,ctx: Koa.Context)=>void;
  html?:(error:Error,ctx: Koa.Context)=>void;
  redirect?:string;
}

interface JaegerOptions {
  endpoint: string;
  serviceName: string;
}

interface CsrfOptions {
  whitelist: string[];
}

interface ApiConfig {
  jaegerOptions: JaegerOptions;
  csrfOptions: CsrfOptions;
  redisOptions: KoaRedis["redisOptions"];
  sessionOptions: KoaRedis["sessionOptions"];
  apiOptions?: ApiOpitons;
  proxyOptions?: ProxyOptons;
  // eslint-disable-next-line
  [other: string]: any;
}

export const withDemo = (config: ApiConfig) => {
  const {
    jaegerOptions,
    csrfOptions,
    redisOptions,
    sessionOptions,
    apiOptions,
    proxyOptions,
    ...restConfig
  } = config;

  const appMiddlewareOptions = {
    apiMiddlewares: [
      proxyMiddleware(proxyOptions),
      bodyparser(),
      jaegerMiddleware(jaegerOptions),
      csrfMiddleware(csrfOptions),
      redisMiddleware({ redisOptions, sessionOptions }),
      apiMiddleware(apiOptions),
    ],
    pageMiddlewares: [
      historyApiFallback(),
      koaStatic("./demo"),
      koaStatic("./demo/public"),
    ],
  };

  const appMiddlewares = [
    corsMiddleware(),
    appMiddleware(appMiddlewareOptions),
  ];
  return {
    onErrorOptions: {
      all(error, ctx) {
          console.error("onerror: ", ctx.path, error)
          ctx.body = error.message               
      }
  } as OnErrorOptions,
  koaErrorOptions: {
      accepts: ["json"],
  },
    middlewares: appMiddlewares,
    
    ...restConfig,
  };
};
