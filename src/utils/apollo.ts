
/// <reference path="./appolo.d.ts" />
import apollo from "node-apollo";

interface Options {
    serverUrl: string; // 服务地址
    appId: string; // 项目id
    clusterName: string; // 集群，默认集群为 default
    namespaceName: string[]; // 命名空间, 默认命名空间为 application
}

export async function get(options : Options) {
  const config = {
    configServerUrl: options.serverUrl, 
    appId: options.appId,
    clusterName: options.clusterName || "default",
    namespaceName: options.namespaceName || ["application"]
  }
  const data = await apollo.remoteConfigServiceFromCache(config);
  return data || {}
}