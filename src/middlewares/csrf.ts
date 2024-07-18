import { ParameterizedContext, DefaultState, DefaultContext, Next } from "koa";
import CSRF from "csrf";
import Cookies from "cookies";

const CsrfToken = new CSRF();

interface Options {
  whitelist?: string[];
  cookieKey?: string;
  cookieOptions?: Cookies.SetOption
}

export interface CsrfCTX extends DefaultContext {
  csrf: {
    CsrfToken: CSRF;
    whitelist: string[];
    cookieKey: string;
    cookieOptions?: Cookies.SetOption
  };
}

export const middleware =
  (options?: Options) =>
  async (ctx: ParameterizedContext<DefaultState, CsrfCTX>, next: Next) => {
    const { whitelist = [], cookieKey = "csrf-token", cookieOptions } = options || {};
    ctx.csrf = {
      CsrfToken,
      whitelist,
      cookieKey,
      cookieOptions
    };
    await next();
  };
