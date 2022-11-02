import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Browser } from 'puppeteer';
import { InjectBrowser } from 'nest-puppeteer';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { UserEntity } from './entity/user-sql.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { PlaceSinglePixel } from 'src/pixel/dto/place-single-pixel.dto';
import { GameSpec } from 'src/game/type/game-spec.type';
import { UserRightOptions } from './dto/UserRightOptions.dto';
import { User, user_schema } from './entity/user.entity';
import { client } from 'src/app.service';
import { Repository as RedisRepo } from 'redis-om';
import { DataSource, Not, Repository } from 'typeorm';
import { Pixel, pixel_schema } from 'src/pixel/entity/pixel.entity';
import { Game, game_schema } from 'src/game/entity/game.entity';
import { logger } from 'src/main';
import { UserGateway } from './user.gateway';
import { Step, StepType } from 'src/game/type/step.type';
import { Socket } from 'socket.io';
import * as bcrypt from 'bcrypt';
import { UserComplete } from 'src/auth/type/usercomplete.type';
import { Group } from './dto/Group.dto';
import { GroupEntity } from './entity/group-sql.entity';

@Injectable()
export class UserService {
    private static LOGIN_URL="https://authc.univ-toulouse.fr/login";

    private repo: RedisRepo<User>;
    private pixelRepo: RedisRepo<Pixel>;

    constructor(
        @InjectBrowser() private readonly browser: Browser,
        private dataSource: DataSource,
        private readonly axios: HttpService,
        @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
        @InjectRepository(PixelHistoryEntity) private pixelHistoRepo: Repository<PixelHistoryEntity>,
        @InjectRepository(GroupEntity) private groupRepo: Repository<GroupEntity>,
        private readonly userGateway: UserGateway
    ) {}

    async linkGroup(user: UserPayload, name: Group) {
        let groupName;
        try {
            groupName = (await this.dataSource.manager.createQueryBuilder(GroupEntity, 'group')
                .where('group.alternatives LIKE :name', {name: name})
                .getOne()).name;
        } catch (err) {
            throw new NotFoundException();
        }

        await this.userRepo.update({userId: `${user.pscope}.${user.username}`}, {group: groupName});
        const redisRepo = client.fetchRepository(user_schema);
        const userRedis = await redisRepo.fetch(`${user.pscope}.${user.username}`);
        userRedis.group = groupName;
        await redisRepo.save(userRedis);
        return groupName;
    }

    async createGroup(group: Group) {
        const groupEntity = new GroupEntity();
        groupEntity.name = group.name;
        let alternatives = [];
        for (let alternative of group.alternatives) {
            alternatives.push(alternative.toLowerCase());
        }
        groupEntity.alternatives = alternatives;
        try {
            await this.groupRepo.insert(groupEntity);
        } catch (err) {
            throw new ConflictException();
        }
    }

    async createUserIfNotExists(user: UserComplete) {
        if (await this.userRepo.count({where: {userId: `${user.pscope}.${user.username}`}}) == 0) {
            const userEntity = new UserEntity();
            userEntity.userId = `${user.pscope}.${user.username}`;
            userEntity.pscope = user.pscope;
            userEntity.username = user.username;
            if (process.env.LOCAL_PSCOPE.includes(user.pscope)) {
                userEntity.password = user.password;
            }
    
            try {
                await this.userRepo.insert(userEntity);
            } catch (err) {
                throw new ConflictException();
            }
        }
    }

    async getUserById(id: string): Promise<UserEntity> {
        return await this.userRepo.findOneBy({userId: id});
    }

    async getUserRedis(id: string): Promise<User> {
        this.repo = client.fetchRepository(user_schema);
        return await this.repo.fetch(id);
    }

    async getUserRank(user: User): Promise<number> {
        return client.fetchRepository(user_schema).search()
            .where('pixelsPlaced').greaterThanOrEqualTo(user.pixelsPlaced).count();
    }

    async getUserFavColor(userId: string): Promise<string> {
        const colors = await this.pixelHistoRepo.manager.createQueryBuilder(PixelHistoryEntity, 'pixel')
            .select(['pixel.color']).addSelect('COUNT(pixel.color)', 'count')
            .leftJoin('pixel.userId', 'user')
            .where('pixel.userId = :userId', {userId: userId})
            .groupBy('pixel.color')
            .getRawMany();
            // [{'color': 'green', 'count', '3'}, {'color': 'red', 'count', '6'}]

        let fav;
        let count = 0;
        for (let color of colors) {
            if (Number(color['count']) >= count) {
                count = color['count'];
                fav = color['pixel_color'];
            }
        }

        return fav;
    }


    async getAssociatedColor(name: string, userId: string) {
        this.repo = client.fetchRepository(user_schema);
        const user: User = await this.repo.fetch(userId);
        return user.getHexFromName(name);
    }


    private async setUserGrade(points: number, userRedis: User, userEntity: UserEntity, game: Game, sockClient: Socket) {

        const step: Step = game.getStepFromPoints(points);
        let value;

        switch (step.type) {

            case StepType.STICKED_PIXEL: {
                value = step.value['stickedPixels'];
                userRedis.stickedPixelAvailable = value;
                userEntity.stickedPixelAvailable = value;
                this.userGateway.sendUserEvent({stickedPixels: userRedis.stickedPixelAvailable}, sockClient);
            } break;

            case StepType.BOMB: {
                value = step.value['bombs'];
                userRedis.bombAvailable = value;
                userRedis.bombAvailable = value;
                this.userGateway.sendUserEvent({bombs: userRedis.bombAvailable}, sockClient);
            } break;

            case StepType.GOLD_NAME: {
                value = step.value['isUserGold'];
                userRedis.isUserGold = value;
                userEntity.isUserGold = value;
                // Update info in already placed pixels by the user in the redis db
                this.pixelRepo = client.fetchRepository(pixel_schema);
                const pixels = await this.pixelRepo.search().where('user').eq(userRedis.entityId).return.all();
                for (let pixel of pixels) {
                    pixel.isUserGold = value;
                    await this.pixelRepo.save(pixel);
                }
            } break;

            case StepType.TIMER: {
                value = step.value['timer'];
                userRedis.timer = value;
                this.userGateway.sendUserEvent({timer: userRedis.timer}, sockClient);
            } break;

            case StepType.COLOR: {
                value = step.value['colors'];
                try {
                    userRedis.addColors(value);
                } catch(err) {
                    userRedis.setColors(value);
                }
                this.userGateway.sendUserEvent({colors: userRedis.getColors()}, sockClient);
            } break;

        }

        await this.userRepo.save(userEntity);
    }


    async checkPoints(user: User, sockClient: Socket) {
        const game = await client.fetchRepository(game_schema)
            .search().where('name').eq('Game').return.first();

        user.pixelsPlaced++;
        const userEntity = await this.userRepo.findOneBy({userId: user.entityId});
        for (let points of game.getStepsPoints()) {
            if (points == user.pixelsPlaced) {
                await this.setUserGrade(points, user, userEntity, game, sockClient);
            }
        }
        await client.fetchRepository(user_schema).save(user);
    }


    doUserIsRight(
        options: UserRightOptions
    ): boolean {
        return this.doUserHaveRightColor(options.colors, options.pixel.color) &&
            this.doUserHaveRightPlacement(options.pixel, options.game) &&
            this.doUserHaveRightTime(options.date, options.lastPlacedPixelDate, options.offset) &&
            this.doMapIsReady(options.game) &&
            this.doIsSticked(options.pixel, options.oldPixel, options.stickedPixelAvailable);
    }

    private doIsSticked(pixel: PlaceSinglePixel, oldPixel: Pixel, stickedPixelAvailable: number) {
        return (stickedPixelAvailable > 0 && pixel.isSticked) || (!oldPixel.isSticked && !pixel.isSticked);
    }

    private doMapIsReady(game) {
        return game.isMapReady;
    }

    private doUserHaveRightPlacement(pixel: PlaceSinglePixel, game: GameSpec): boolean {
        return (pixel.coord_x > 0 && pixel.coord_x <= game.width) && (pixel.coord_y > 0 && pixel.coord_y <= game.width);
    }

    private doUserHaveRightTime(
        date: Date,
        lastPixelDate: Date,
        offset: number
    ): boolean {
        return date.getTime() - lastPixelDate.getTime() >= offset *1000;
    }

    private doUserHaveRightColor(colors: Array<String>, color: string): boolean {
        return colors.includes(color);
    }


    async checkUser(username: string, password: string, pscope: string): Promise<UserPayload> {

        if (process.env.LOCAL_PSCOPE.includes(pscope)) {
            return await this.localCAS(username, password, pscope);
        } else {
            return await this.toulouseCAS(username, password, pscope);
        }

    }


    private async localCAS(username: string, password: string, pscope: string): Promise<UserPayload> {
        const user = await this.userRepo.findOneBy({userId: `${pscope}.${username}`});
        try {
            if (bcrypt.compareSync(password, user.password)) {
                return {
                    username: user.username,
                    pscope: user.pscope
                };
            } else {
                throw new UnauthorizedException();
            }
        } catch (err) {
            throw new UnauthorizedException();
        }
    }


    private async toulouseCAS(username: string, password: string, pscope: string): Promise<UserPayload> {
        const [token, lt] = await this.scrap();

        try {
            const res = await this.axios.axiosRef.post(
                'https://authc.univ-toulouse.fr/login'
                +'?utf8=%E2%9C%93&authenticity_token='+token
                +'&lt='+lt
                +'&pscope='+pscope
                +'&service=https://scout.univ-toulouse.fr/sw?type=L%26state=7%26startpage=%2Fflatx%2F&username='+username
                +'&password='+password
                , null,
            {
                headers: {
                    'Referer': 'https://authc.univ-toulouse.fr/login',
                    'Origin': 'https://authc.univ-toulouse.fr',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
                    'Host': 'authc.univ-toulouse.fr',
                    'Content-Length': '0',
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive'
                },
                // params: {
                //     utf8: '%E2%9C%93',
                //     authenticity_token: token,
                //     lt: lt,
                //     pscope: pscope,
                //     service: 'https://scout.univ-toulouse.fr/sw?type=L%26state=7%26startpage=%2Fflatx%2F',
                //     username: username,
                //     password: password
                // }
            });

            // 303 -> redirection mais log accepté par l'"API" équivalent 200
            if(res.status != 200) {
                throw new UnauthorizedException();
            }
        } catch(err) {
            throw new UnauthorizedException();
        }

        return {
            username: username,
            pscope: pscope
        };
    }

    private async scrap() {

        const page = await this.browser.newPage();
        await page.goto(UserService.LOGIN_URL);

        const [tokenEl] = await page.$x('//*[@id="login-form"]/input[2]');
        const tokenObj = await tokenEl.getProperty('value');

        const [ltEl] = await page.$x('//*[@id="lt"]');
        const ltObj = await ltEl.getProperty('value');

        const token = await tokenObj.jsonValue();
        const lt = await ltObj.jsonValue();

        // this.browser.close();

        return [token, lt];
    }

}
