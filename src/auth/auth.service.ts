import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger(AuthService.name);

    onModuleInit() {
        this.$connect();
        this.logger.log('Connected to MongoDB');
    }

    async register( registerDto : RegisterDto ) {
        const { email, password, name } = registerDto;
        try {
            let user = await this.user.findUnique({
                where: { email }
            });

            if( user ) {
                throw new RpcException({
                    status: 400,
                    message:  'User already exists'
                });
            }

            user = await this.user.create({ 
                data: {
                    email, 
                    password: bcrypt.hashSync( password, 10 ),
                    name
                } 
            });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token: 'JWT'
            }

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }

}
