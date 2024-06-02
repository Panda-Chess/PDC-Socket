FROM node:20

ARG GITHUB_TOKEN

ENV PORT="3000"

WORKDIR /app

COPY . .

RUN echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > .npmrc
RUN echo "@panda-chess:registry=https://npm.pkg.github.com" >> .npmrc

RUN yarn install

RUN yarn build

RUN npm i -g nodemon

EXPOSE $PORT

CMD [ "yarn", "prod" ]