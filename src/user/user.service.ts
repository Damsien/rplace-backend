import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Browser } from 'puppeteer';
import { InjectBrowser } from 'nest-puppeteer';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { logger } from 'src/main';
import { AxiosError } from 'axios';

@Injectable()
export class UserService {
    private static LOGIN_URL="https://authc.univ-toulouse.fr/login";

    constructor(@InjectBrowser() private readonly browser: Browser, private readonly axios: HttpService) {}

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
