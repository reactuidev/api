import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from 'src/utils/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private mailerService: MailerService,
    private jwtService: JwtService,
  ) {}

  async login(data: LoginUserDto) {
    const user = await this.userService.user({ where: { email: data.email } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }

    const isPasswordMatching = await bcrypt.compare(
      data.password,
      user.password,
    );
    if (!isPasswordMatching) {
      throw new HttpException('Invalid password', HttpStatus.BAD_REQUEST);
    }

    if (user.confirmedAt === null) {
      throw new HttpException(
        'Email verification pending',
        HttpStatus.BAD_REQUEST,
      );
    }

    const token = this.jwtService.sign(user);

    return { ...user, token };
  }

  async register(data: RegisterUserDto) {
    const userExists = await this.userService.user({
      where: { email: data.email },
    });

    if (userExists) {
      throw new HttpException(
        'User already registered',
        HttpStatus.BAD_REQUEST,
      );
    }

    data.username = slugify(`${data.name}-${nanoid(5)}`, {
      trim: true,
      lower: true,
      strict: true,
    });
    data.password = await bcrypt.hash(data.password, 12);
    data.confirmationToken = nanoid(32);

    const user = await this.userService.createUser(data);

    await this.mailerService
      .sendMail({
        to: user.email,
        from: 'no-reply@reactui.dev',
        subject: 'React UI Account Confirmation',
        template: 'welcome',
        context: {
          name: user.name,
          token: user.confirmationToken,
        },
      })
      .catch((err) => console.log(err));

    return user;
  }

  async verifyEmail(confirmationToken: string) {
    const user = await this.prisma.user.findFirst({
      where: { confirmationToken },
    });
    if (!user) {
      throw new HttpException(
        'Token expired or invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.userService.updateUser({
      where: { email: user.email },
      data: { confirmedAt: new Date(Date.now()) },
    });
  }
}
