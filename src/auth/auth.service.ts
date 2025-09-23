import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginDto, RegisterDto } from './dto'; 
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger(AuthService.name);

    constructor(
     private jwtService: JwtService
    ) {
      super();
    }

    onModuleInit() {
        this.$connect();
        this.logger.log('Connected to MongoDB');
    }

    private async signJWT( payload: JwtPayload ) {
        return this.jwtService.sign(payload);
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

            const token = await this.signJWT({ id: user.id, email, name: user.name });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            }

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }

    async login( loginDto : LoginDto ) {
        const { email, password } = loginDto;
        try {
            let user = await this.user.findUnique({
                where: { email }
            });

            if( !user ) {
                throw new RpcException({
                    status: 401,
                    message:  'this credentials are not valid'
                });
            }
           
            const isPwdValid = bcrypt.compareSync( password, user.password );

            if( !isPwdValid ) {
                throw new RpcException({
                    status: 401,
                    message:  'this credentials are not valid'
                });
            }

            const token = await this.signJWT({ id: user.id, email, name: user.name });
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            }

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }

    async refresh( token: string ) {
        try {
            const user = this.jwtService.verify<JwtPayload>( token, {
                secret: envs.jwtSecret
            });
            
            const newToken = await this.signJWT({ id: user.id, email: user.email, name: user.name });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token: newToken
            }   

        } catch (error) {
            throw new RpcException({
                status: 401,
                message:  'Token is not valid'
            });
        }                  
         
    }

}
