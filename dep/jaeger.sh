#!/bin/bash

name="local-jaeger"

exist=`docker ps -f name=${name} -q`

if [ ! "${exist}" ]; then
    # 移除容器
    echo "docker rm -f ${name} || ture"
    docker rm -f ${name} || ture

    # 启动容器
    echo "docker run -d -p 16686:16686 -p 14268:14268 --name ${name} jaegertracing/all-in-one:latest"
    docker run -d -p 16686:16686 -p 14268:14268 --name ${name} jaegertracing/all-in-one:latest

    # 移除为none的镜像
    echo "docker rmi images"
    docker images|grep none|awk '{print $3}'|xargs docker rmi

    echo ${name} successfully
else
    echo "${name}" already started
fi