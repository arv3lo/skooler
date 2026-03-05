import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums/role.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import type { JwtPayload } from '@common/interfaces/jwt-payload.interface';
import { UserService } from '@modules/user/application/services/user.service';

import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from '../dto/membership.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.userService.findMe(user.sub);
  }

  @Get('me/memberships')
  @ApiOperation({ summary: "Get current user's tenant memberships" })
  getMyMemberships(@CurrentUser() user: JwtPayload) {
    return this.userService.findMemberships(user.sub);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post('memberships')
  @UseGuards(RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Add user to a tenant' })
  createMembership(@Body() dto: CreateMembershipDto) {
    return this.userService.createMembership(dto);
  }

  @Patch('memberships/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: "Update a membership's role" })
  updateMembership(@Param('id') id: string, @Body() dto: UpdateMembershipDto) {
    return this.userService.updateMembership(id, dto);
  }

  @Delete('memberships/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Remove user from a tenant' })
  removeMembership(@Param('id') id: string) {
    return this.userService.removeMembership(id);
  }
}
