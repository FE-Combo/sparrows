
import {ParameterizedContext, DefaultState, DefaultContext, Next} from "koa";
import CSRF from "csrf";
const CsrfToken = new CSRF();

interface Options {
    whitelist?: string[];
    key?:string
}

export interface CsrfCTX  extends DefaultContext{
    csrf: {
        CsrfToken:CSRF,
        whitelist:string[];
        key: string;
    }
}

export const middleware = (options?: Options) => async ( ctx: ParameterizedContext<DefaultState, CsrfCTX>, next: Next) => {
    const {whitelist=[], key="csrf-token"} = options || {}
    ctx.csrf = {
        CsrfToken,
        whitelist,
        key,
    }
    await next();
}
