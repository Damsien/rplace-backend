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
import { Repository } from 'typeorm';
import { Pixel } from 'src/pixel/entity/pixel.entity';
import { Grade } from 'src/user/type/grade.enum';

@Injectable()
export class UserService {
    private static LOGIN_URL="https://authc.univ-toulouse.fr/login";

    private repo: RedisRepo<User>;

    constructor(
        @InjectBrowser() private readonly browser: Browser,
        private readonly axios: HttpService,
        @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
        @InjectRepository(PixelHistoryEntity) private pixelHistoRepo: Repository<PixelHistoryEntity>
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
            .where('pixel.userId = :userId', {userId: userId}).getRawMany();
            // [{'color': 'green', 'count', '3'}, {'color': 'red', 'count', '6'}]
        
        let fav;
        let count = 0;
        for (let color of colors) {
            if (Number(color['count']) >= count) {
                count = color['count'];
                fav = color['color'];
            }
        }
        return fav;
    }


    private async setUserGrade(points: number, userRedis: User) {
        const userEntity = await this.userRepo.findOneBy({userId: userRedis.entityId});
        
        switch (points) {
            case Grade.STEP_ONE:
                userRedis.stickedPixelAvailable = 5;
                userEntity.stickedPixelAvailable = 5;
                break;
            case Grade.STEP_TWO:
                userRedis.bombAvailable = 1;
                userRedis.bombAvailable = 1;
                break;
            case Grade.STEP_THREE:
                userRedis.isUserGold = true;
                userEntity.isUserGold = true;
                break;
            case Grade.STEP_FOUR:
                userRedis.stickedPixelAvailable += 5;
                userEntity.stickedPixelAvailable += 5;
                break;
        }

        userRedis.pixelsPlaced++;
        await this.userRepo.save(userRedis);
        await client.fetchRepository(user_schema).save(userRedis);
    }


    async checkPoints(user: User) {
        for (let [step, points] of Object.entries(Grade)) {
            if (Number(points) <= user.pixelsPlaced+1) {
                if (Number(points) > user.pixelsPlaced) {
                    await this.setUserGrade(Number(points), user);
                }
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
