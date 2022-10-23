import signature from 'cookie-signature';
import * as uuid from 'uuid';
import {withDemo} from "./api-middleware-demo";

const apiOptions = {
    redisSecrets: '0011111111222222223333333344444444,01qqqqqqqqwwwwwwwweeeeeeeerrrrrrrr,02zzzzzzzzxxxxxxxxccccccccvvvvvvvv, 0300000100qqqqdqqqeeeseeeeyfyyyyyy',
    cookieSecret:"afeijflwekjflkjfifffjdfjkmdd",
    whitelist: ["/api/v1.0/demo/login"],
    saveSessionApi: ["/api/v1.0/demo/login"],
    removeSessionApi: ["/api/v1.0/demo/logout"],
}

const csrfOptions = {
    whitelist:["/api/v1.0/community/steward/device/count/get"]
}

const redisOptions = {
    connectTimeout: 20000,
    lazyConnect: true,
    port: 6379,
    host: "localhost",
};

const sessionOptions = {
    prefix:"s:koanext::",
    key: "sid",// The client stores the corresponding cookie
    // rolling: true, // always reset the cookie and sessions
    ttl:24 * 60 * 60 * 1000, // redis survival time
    // full options: https://github.com/pillarjs/cookies#cookiesset-name--value---options--
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, //one day in ms
        overwrite: true,
        signed: false
    },
    sessionIdStore: {
        get: function() {
            // 获取 sessionId，seesionId在框架内会自动加上 prefix
            // 如果希望每次请求都重新生成id，则返回undefined
            return undefined;
        },
        set: function(sid, session) {
            // 设置 cookie 以及 redis
            // 可在此操作中清除原先的redis缓存
            const cookieKey = this.cookies.get(sessionOptions.key, {});
            if(cookieKey) {
                this.sessionStore.destroy(signature.sign(cookieKey, apiOptions.cookieSecret))
            }
            
            // Avoid error: Cannot set headers after they are sent to the client
            if (!this.res.headersSent) {
                this.cookies.set(sessionOptions.key, signature.unsign(sid.replace(/^s:koanext::$/, ""), apiOptions.cookieSecret), session.cookie)
            }
        },
        reset: function() {
            // 若 session 为空时会触发, 可用来生成最新的seesionId，seesionId在框架内会自动加上 prefix
            const cookieId = uuid.v4();
            this.sessionId = signature.sign(cookieId, apiOptions.cookieSecret);
            this.cookies.set(sessionOptions.key, null, { expires: new Date(0) })
        }
    }
}

const jaegerOptions = {
    endpoint: "http://localhost:14268/api/traces",
    serviceName: "next"
}

// const proxyOptions = {
//     path: /\/api\/.*/,
//     proxyTimeout: 10000,
//     timeout: 10000,
//     target: "https://baidu.com",
//     changeOrigin: true,
// }


const sentryOptions = {
    dsn: "http://25243c4be3da4c19a1d66c778dfb20ea@localhost:9000/6", 
    tracesSampleRate: 1.0 
}

module.exports = withDemo({apiOptions, csrfOptions, redisOptions, sessionOptions, jaegerOptions, sentryOptions})