import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.users({});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.users({ where: { id } });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser({ where: { id }, data: updateUserDto });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.deleteUser({ id });
  }
}
