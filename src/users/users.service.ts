import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, UpdateResult } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from 'src/auth/dto/login.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailerService: MailerService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<boolean> {
    try {
      const userInDb = await this.userRepository.findOneBy({
        email: createUserDto.email,
      });

      // Generate verification code and expiry date
      const verificationCode = this.generateVerificationCode();
      const verificationExpiry = this.generateVerificationExpiry();
      const salt = await bcrypt.genSalt();
      createUserDto.password = await bcrypt.hash(createUserDto.password, salt);

      if (userInDb && userInDb.verified === true) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      else if (userInDb && userInDb.verified === false) {
        await this.userRepository.createQueryBuilder()
          .update(User)
          .set({
            verificationCode: verificationCode,
            verificationExpiry: verificationExpiry,
            password: createUserDto.password
          }).where("id = :id", { id: userInDb.id }).execute();

        this.sentMailCode(createUserDto.email, createUserDto.name, verificationCode);
        return false;
      }

      const account = new User();
      account.email = createUserDto.email;
      account.password = createUserDto.password;
      account.role = createUserDto.role;
      account.verificationCode = verificationCode;
      account.verificationExpiry = verificationExpiry;
      await this.userRepository.save(account);

      delete account.password;

      this.sentMailCode(createUserDto.email, createUserDto.name, verificationCode);
      return true;
    }
    catch (error) {
      throw new HttpException(`Have a some error, please contact with admin to fix: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private generateVerificationCode(): string {
    // Generate a random 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateVerificationExpiry(): Date {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 15); // Add 15 minutes to current time
    return expiryDate;
  }

  private async sentMailCode(email: string, name: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Online Doctor Appointment',
      template: './verifyemail',
      context: {
        name: name,
        verificationCode: code,
      },
    });
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(loginDto: LoginDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ email: loginDto.email });
    if (!user) {
      throw new UnauthorizedException('Could not find account');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UpdateResult> {
    return await this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
