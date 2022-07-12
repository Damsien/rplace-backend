import { Injectable } from '@nestjs/common';
import { User } from './type/user.type';

@Injectable()
export class UserService {

    private readonly users: User[] = [
        {
            username: 'ddassieu',
            pscope: 'inp',
            password: 'pass'
        }
    ];

    findOne(username: string): User | undefined {
        return this.users[0];
    }

}
