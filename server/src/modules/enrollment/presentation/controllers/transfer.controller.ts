import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@common/decorators/roles.decorator';
import { RequireSubscription } from '@common/decorators/subscription.decorator';
import { Role } from '@common/enums/role.enum';
import { SubscriptionTier } from '@common/enums/subscription-tier.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import { SubscriptionGuard } from '@common/guards/subscription.guard';
import type { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';
import { TransferService } from '@modules/enrollment/application/services/transfer.service';

import { InitiateTransferDto } from '../dto/transfer.dto';

@ApiTags('enrollment / transfers')
@Controller('transfers')
@UseGuards(RolesGuard, SubscriptionGuard)
@Roles(Role.SCHOOL_ADMIN)
@RequireSubscription(SubscriptionTier.PRO)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a student transfer request (PRO+)' })
  initiate(
    @Req() req: AuthenticatedRequest,
    @Body() dto: InitiateTransferDto,
  ) {
    return this.transferService.initiate(req.tenantId!, dto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'List pending incoming transfer requests' })
  findPending(@Req() req: AuthenticatedRequest) {
    return this.transferService.findPending(req.tenantId!);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a transfer request' })
  approve(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.transferService.approve(req.tenantId!, id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a transfer request' })
  reject(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.transferService.reject(req.tenantId!, id);
  }
}
