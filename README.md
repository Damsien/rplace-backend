# r/place Backend

## The main project

We have 3 main parts :
* The [frontend](https://git.inpt.fr/dassied/rplace-frontend) - Application displayed on the user's screen
* The [backend](https://git.inpt.fr/dassied/rplace-backend) - Application and database managing data and handling requests
* The [infrastructure](https://git.inpt.fr/dassied/rplace-infra) - The support to maintain the application with high availability and to maintain a consistent load

## Backend server side for the r/place project

Tech stack :
* Back - [NestJS](https://nestjs.com/): to manage data and handle requests
* Database - [Redis](https://redis.io/) for the temporary database and [MariaDB](https://mariadb.org/) : for the persistent database

## Server

### Prerequisites

#### NestJS
- yarn installed
- nodeJS installed (>=16.10.0, use nvm to manage node versions)
#### Database
- docker installed

### Run server

Run Redis-stack database first in a terminal.
Redis-stack implements RedisJSON and RediSearch that's modules we use.
```bash
# run redis database
$ docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```
Got to `localhost:8001` to manage data with Redis Insight.

Then run MariaDB database
```bash
# run mariadb database
docker run -d --name mariadb --env MARIADB_ROOT_PASSWORD=password -p 3306:3306 mariadb:10.7.4-focal
docker exec -it mariadb /bin/bash
mysql -u root --password=password
CREATE DATABASE rplace;
USE rplace;
```

Finally, run NestJS server (you need to be placed in this folder).
```bash
# development
yarn run start:dev
```
Make call on api with `localhost:3000`.

## Data structure

### Redis structure

![rplace data structure redis side](rplace-backend-redis-global.png)

The game is an entity usable in the code.

![rplace game data redis side](rplace-backend-redis-game.png)

### MariaDb structure

![rplace game data mariadb side](rplace-backend-mariadb.png)

### Global structure (redis and mariadb)

![rplace data structure global](rplace-backend-redis-mariadb.png)