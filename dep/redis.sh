#!/bin/bash

name="local-redis"

exist=`docker ps -f name=${name} -q`

if [ ! "${exist}" ]; then
  # 移除容器
    echo " docker rm -f ${name} || ture "
    docker rm -f ${name} || ture

    # 启动容器
    echo "docker run -d -p 6379:6379 --name ${name} redis redis-server "
    docker run -d -p 6379:6379 --name ${name} redis redis-server 

    # 移除为none的镜像
    echo "docker rmi images"
    docker images|grep none|awk '{print $3}'|xargs docker rmi

    echo ${name} successfully
else
    echo "${name}" already started
fi