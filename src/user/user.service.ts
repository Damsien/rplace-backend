import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
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
import { Group as GroupRedis } from './entity/group.entity';
import { GroupEntity } from './entity/group-sql.entity';
import { group_schema } from './entity/group.entity';

@Injectable()
export class UserService {
    private static LOGIN_URL="https://authc.univ-toulouse.fr/login";

    private repo: RedisRepo<User>;
    private pixelRepo: RedisRepo<Pixel>;

    constructor(
        private dataSource: DataSource,
        private readonly axios: HttpService,
        @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
        @InjectRepository(PixelHistoryEntity) private pixelHistoRepo: Repository<PixelHistoryEntity>,
        @InjectRepository(GroupEntity) private groupRepo: Repository<GroupEntity>,
        private readonly userGateway: UserGateway
    ) {}

    async getGroups() {
        let groups: Group[] = [];
        let groupsEntity: GroupEntity[] = await this.groupRepo.find();
        for (let group of groupsEntity) {
            groups.push({name: group.name, alternatives: null});
        }
        return groups;
    }

    async linkGroup(user: UserPayload, name: Group) {
        let groupName;
        try {
            // groupName = (await this.dataSource.manager.createQueryBuilder(GroupEntity, 'group')
            //     .where('INSTR(LOWER(group.alternatives), :name) > 0', {name: name})
            //     .getOne()).name;
            groupName = (await this.groupRepo.findOneBy({name: name.name})).name;
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

        const groupRepo = client.fetchRepository(group_schema);
        await groupRepo.createIndex();
        const groupRedis = await groupRepo.fetch(group.name);
        groupRedis.name = group.name;
        groupRedis.pixelsPlaced = 0;
        groupRepo.save(groupRedis);
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

    async getGroupRedis(group: string): Promise<GroupRedis> {
        const repo = client.fetchRepository(group_schema);
        return await repo.fetch(group);
    }

    async getUserRank(user: User): Promise<number> {
        return client.fetchRepository(user_schema).search()
            .where('pixelsPlaced').greaterThanOrEqualTo(user.pixelsPlaced).count();
    }

    async getGroupRank(group: GroupRedis): Promise<number> {
        return client.fetchRepository(group_schema).search()
            .where('pixelsPlaced').greaterThanOrEqualTo(group.pixelsPlaced).count();
    }

    async getUserFavColor(userId: string): Promise<any[]> {
        const colors = await this.pixelHistoRepo.manager.createQueryBuilder(PixelHistoryEntity, 'pixel')
            .select(['pixel.color']).addSelect('COUNT(pixel.color)', 'count')
            .leftJoin('pixel.userId', 'user')
            .where('pixel.userId = :userId', {userId: userId})
            .groupBy('pixel.color')
            .getRawMany();
            // [{'pixel_color': 'green', 'count': '3'}, {'pixel_color': 'red', 'count': '6'}]

        // let fav;
        // let count = 0;
        // for (let color of colors) {
        //     if (Number(color['count']) >= count) {
        //         count = color['count'];
        //         fav = color['pixel_color'];
        //     }
        // }

        colors.sort(function(a, b) {
            return b['count'] - a['count'];
        });

        return colors;
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

        const groupRepo = client.fetchRepository(group_schema);
        if (user.group) {
            const group = await groupRepo.search().where('name').eq(user.group).return.first();
            group.pixelsPlaced++;
            await groupRepo.save(group);
        }
    }


    doUserIsRight(
        options: UserRightOptions
    ): boolean {
        return this.doUserHaveRightColor(options.colors, options.pixel.color) &&
            this.doUserHaveRightPlacement(options.pixel, options.game) &&
            this.doUserHaveRightTime(options.date, options.lastPlacedPixelDate, options.offset) &&
            // this.doMapIsReady(options.game) &&
            this.doIsSticked(options.pixel, options.oldPixel, options.stickedPixelAvailable);
    }

    private doIsSticked(pixel: PlaceSinglePixel, oldPixel: Pixel, stickedPixelAvailable: number) {
        return (stickedPixelAvailable > 0 && pixel.isSticked) || (!oldPixel.isSticked && !pixel.isSticked);
    }

    // private doMapIsReady(game) {
    //     return game.isMapReady;
    // }

    private doUserHaveRightPlacement(pixel: PlaceSinglePixel, game: GameSpec): boolean {
        return (pixel.coord_x > 0 && pixel.coord_x <= game.width) && (pixel.coord_y > 0 && pixel.coord_y <= game.width);
    }

    private doUserHaveRightTime(
        date: Date,
        lastPixelDate: Date,
        offset: number
    ): boolean {
        logger.debug(offset*1000)
        logger.debug(date.getTime())
        logger.debug(lastPixelDate.getTime())
        logger.debug(lastPixelDate.getTime() + offset * 1000)
        return lastPixelDate.getTime() + offset * 1000 <= date.getTime();
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
        const [token, lt, cas_session, lb] = await this.scrap();

        try {
            const res = await this.axios.axiosRef.post(
                UserService.LOGIN_URL
                // +'?utf8=%E2%9C%93&authenticity_token='+token
                // +'&lt='+lt
                // +'&pscope='+pscope
                // +'&service=https://scout.univ-toulouse.fr/sw?type=L%26state=7%26startpage=%2Fflatx%2F&username='+username
                // +'&password='+password
            ,{
                utf8: '✓',
                authenticity_token: token,
                lt: lt,
                pscope: pscope,
                username: username,
                password: password,
                button: '' 
            },
            {
                headers: {
                    'Referer': UserService.LOGIN_URL,
                    'Origin': 'https://authc.univ-toulouse.fr',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
                    'Host': 'authc.univ-toulouse.fr',
                    // 'Content-Length': '246',
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/json',
                    'Cookie': `comue_cas_session=${cas_session}; lb=${lb}; etab=${pscope}`,
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Ch-Ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': 'Windows',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-User': '?1'
                }
            });

            // 303 -> redirection mais log accepté par l'"API" équivalent 200
            if(res.status != 200) {
                throw new UnauthorizedException();
            }
        } catch(err) {
            console.log(err)
            throw new UnauthorizedException();
        }

        return {
            username: username,
            pscope: pscope
        };
    }

    private async scrap() {

        const res = await this.axios.axiosRef.get(UserService.LOGIN_URL);
        const html = res.data.toString();
        
        const token = html.split('name="authenticity_token" value="')[1].split('"')[0];
        const lt = html.split('id="lt" value="')[1].split('"')[0];
        const cas_session = res.headers['set-cookie'][0].split('cas_session=')[1].split(';')[0];
        const lb = res.headers['set-cookie'][1].split('lb=')[1].split(';')[0];

        return [token, lt, cas_session, lb];
    }

}
