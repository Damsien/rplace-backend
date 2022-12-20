FROM node:current-alpine3.16

ENV HTTP_PROXY=http://dino.ecocenter.fr:2831 \
    HTTPS_PROXY=http://dino.ecocenter.fr:2831 \
    NO_PROXY=.ftgroup,.intraorange,.ecocenter.fr
    
WORKDIR /usr/src/app

COPY package*.json ./

COPY . .
RUN rm -rf ./nodes_modules
RUN rm -rf ./dist

RUN npm config set https-proxy http://dino.ecocenter.fr:2831
RUN npm install yarn --legacy-peer-deps
RUN yarn install
RUN yarn run build

EXPOSE 3000

CMD ["yarn", "run", "start:prod"]