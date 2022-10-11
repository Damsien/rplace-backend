import { Injectable, UnauthorizedException } from '@nestjs/common';
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
import { DataSource, Repository } from 'typeorm';
import { Pixel, pixel_schema } from 'src/pixel/entity/pixel.entity';
import { Game, game_schema } from 'src/game/entity/game.entity';
import { logger } from 'src/main';
import { UserGateway } from './user.gateway';

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
        private readonly userGateway: UserGateway
    ) {}

    async createUser(user: UserPayload) {
        if (await this.userRepo.count({where: {userId: `${user.pscope}.${user.username}`}}) == 0) {
            const userEntity = new UserEntity();
            userEntity.userId = `${user.pscope}.${user.username}`;
            userEntity.pscope = user.pscope;
            userEntity.username = user.username;
    
            await this.userRepo.insert(userEntity);
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


    private async setUserGrade(points: number, userRedis: User, game: Game) {
        const userEntity = await this.userRepo.findOneBy({userId: userRedis.entityId});
        
        switch (points) {
            case Number(game.getStepsPoints()[0]):
                userRedis.stickedPixelAvailable = 5;
                userEntity.stickedPixelAvailable = 5;
                this.userGateway.sendUserEvent({stickedPixels: userRedis.stickedPixelAvailable});
                break;
            case Number(game.getStepsPoints()[1]):
                userRedis.bombAvailable = 1;
                userRedis.bombAvailable = 1;
                this.userGateway.sendUserEvent({bombs: userRedis.bombAvailable});
                break;
            case Number(game.getStepsPoints()[2]):
                userRedis.isUserGold = true;
                userEntity.isUserGold = true;
                // Update info in already placed pixels by the user in the redis db
                this.pixelRepo = client.fetchRepository(pixel_schema);
                const pixels = await this.pixelRepo.search().where('user').eq(userRedis.entityId).return.all();
                for (let pixel of pixels) {
                    pixel.isUserGold = true;
                    await this.pixelRepo.save(pixel);
                }
                break;
            case Number(game.getStepsPoints()[3]):
                userRedis.stickedPixelAvailable += 5;
                userEntity.stickedPixelAvailable += 5;
                this.userGateway.sendUserEvent({stickedPixels: userRedis.stickedPixelAvailable});
                break;
        }

        await this.userRepo.save(userEntity);
        await client.fetchRepository(user_schema).save(userRedis);
    }


    async checkPoints(user: User) {
        const game = await client.fetchRepository(game_schema)
            .search().where('name').eq('Game').return.first();

        user.pixelsPlaced++;
        await client.fetchRepository(user_schema).save(user);

        for (let points of game.getStepsPoints()) {
            if (Number(points) == user.pixelsPlaced) {
                await this.setUserGrade(Number(points), user, game);
            }
        }
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
        return (stickedPixelAvailable > 0 && pixel.isSticked) || !oldPixel.isSticked;
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

    private doUserHaveRightColor(colors: Array<string>, color: string): boolean {
        return colors.includes(color);
    }



    async checkUser(username: string, password: string, pscope: string): Promise<UserPayload> {
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
