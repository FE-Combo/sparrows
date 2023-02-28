import Koa, {
  ParameterizedContext,
  Next,
  DefaultContext,
  DefaultState,
} from "koa";
import compose from "koa-compose";
import "@sentry/tracing";
import * as NodeSentry from "@sentry/node";

export async function getConfig() {
  const configPath = process.cwd() + "/koa.config.js";
  const config = require(configPath);
  return config;
}

export interface CTXState {
  koa: Koa<DefaultState, DefaultContext>;
  // eslint-disable-next-line
  config: Record<string, any>;
}

const context =
  // eslint-disable-next-line

    (koa: Koa<DefaultState, DefaultContext>, config: Record<string, any>) =>
    async (ctx: ParameterizedContext<CTXState, DefaultContext>, next: Next) => {
      ctx.res.statusCode = 200;
      ctx.state = { koa, config };

      if (typeof config?.sentryOptions?.dsn === "string") {
        NodeSentry.init(config.sentryOptions);
        ctx.onerror = (error: Error) => {
          if (error) {
            NodeSentry.withScope(function (scope) {
              scope.addEventProcessor(function (event) {
                return NodeSentry.Handlers.parseRequest(event, ctx.request);
              });
              NodeSentry.captureException(error);
            });
            console.error(error);
          }
        };
      }

      if (config?.middlewares instanceof Array) {
        await compose(config?.middlewares)(ctx, next);
      } else {
        await next();
      }
    };

export default context;
