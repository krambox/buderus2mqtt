# from https://codefresh.io/blog/node_docker_multistage/

#
# ---- Base Node ----
FROM  mhart/alpine-node:8 AS base
# install node
RUN apk add --no-cache  tini
#RUN apk add --no-cache  tini
# set working directory
WORKDIR /root/app
# Set tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]
# copy project file
COPY package.json .
COPY package-lock.json .
 
#
# ---- Dependencies ----
FROM base AS dependencies
RUN apk add --no-cache  python build-base  libmcrypt-dev
# install node packages
RUN npm set progress=false && npm config set depth 0
RUN npm install --only=production 
# copy production node_modules aside
RUN cp -R node_modules prod_node_modules
# install ALL node_modules, including 'devDependencies'
RUN npm install

#
# ---- Release ----
FROM mhart/alpine-node:8
WORKDIR /root/app
# copy production node_modules
COPY --from=dependencies /root/app/prod_node_modules ./node_modules
# copy app sources
COPY package.json .
COPY config.js .
COPY km200mqtt.js .
VOLUME ["/data"]
CMD ./km200mqtt.js 