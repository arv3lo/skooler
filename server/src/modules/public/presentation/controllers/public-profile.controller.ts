import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums/role.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import type { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';
import { PublicProfileService } from '@modules/public/application/services/public-profile.service';

import { UpdateSchoolProfileDto } from '../dto/school-profile.dto';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '../dto/announcement.dto';

@ApiTags('public / school-profile')
@Controller('schools')
export class PublicProfileController {
  constructor(private readonly publicProfileService: PublicProfileService) {}

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get public school profile and announcements' })
  getProfile(@Param('slug') slug: string) {
    return this.publicProfileService.getProfile(slug);
  }

  @Patch('profile')
  @UseGuards(RolesGuard)
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: "Update this school's public profile" })
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSchoolProfileDto,
  ) {
    return this.publicProfileService.updateProfile(req.tenantId!, dto);
  }

  // ── Announcements ────────────────────────────────────────────

  @Public()
  @Get(':slug/announcements')
  @ApiOperation({ summary: 'List public announcements for a school' })
  listPublicAnnouncements(@Param('slug') slug: string) {
    return this.publicProfileService
      .getProfile(slug)
      .then((school) =>
        this.publicProfileService.findAnnouncements(school.id, true),
      );
  }

  @Get('announcements/all')
  @UseGuards(RolesGuard)
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List all announcements (admin, incl. drafts)' })
  listAllAnnouncements(@Req() req: AuthenticatedRequest) {
    return this.publicProfileService.findAnnouncements(req.tenantId!, false);
  }

  @Post('announcements')
  @UseGuards(RolesGuard)
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create an announcement' })
  createAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.publicProfileService.createAnnouncement(req.tenantId!, dto);
  }

  @Patch('announcements/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update an announcement' })
  updateAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.publicProfileService.updateAnnouncement(
      req.tenantId!,
      id,
      dto,
    );
  }

  @Delete('announcements/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft-delete an announcement' })
  removeAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.publicProfileService.removeAnnouncement(req.tenantId!, id);
  }
}
