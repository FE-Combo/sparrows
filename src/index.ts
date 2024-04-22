/// <reference path="./type.d.ts" />

import Koa from "koa";
import context from "./interior/context";
import portfinder from "portfinder";
import onerror from "koa-onerror";
import chalk from "chalk";

const dev = process.env.NODE_ENV !== "production";

export async function getConfig() {
  const configPath = process.cwd() + "/koa.config.js";
  try {
    const config = require(configPath);
    return config;
  } catch (error) {
    console.error("Fetch Config Error: ", error);
    return {};
  }
}

const basePort = 3000;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : basePort; // e.g: PORT=3000 yarn dev
portfinder.basePort = port;

async function start() {
  const config = (await getConfig()) || {};

  const server = new Koa();

  // TODO: 集成 koa-error，去除 error 中间件
  
  // 处理 steam 和事件的异常
  onerror(server, config?.errorOptions);

  server.use(context(server, { ...config, port, dev }));

  portfinder.getPort(function (error, nextPort) {
    if (error) {
      console.error(error);
      return;
    }
    if (port !== nextPort) {
      console.info(
        `${chalk.yellow(
          "warn"
        )}  - Port ${port} is in use, trying ${nextPort} instead.`
      );
    }
    process.env.PORT = nextPort.toString();
    server.listen(nextPort, () =>
      console.info(
        `${chalk.green(
          "ready"
        )} - started server on 0.0.0.0:${nextPort}, url: http://localhost:${nextPort}`
      )
    );
  });
}

start();
