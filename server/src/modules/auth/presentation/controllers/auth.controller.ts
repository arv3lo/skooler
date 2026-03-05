import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { Public } from '@common/decorators/public.decorator';
import type { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';
import { AuthService } from '@modules/auth/application/services/auth.service';

import { LoginDto } from '../dto/login.dto';
import { SelectTenantDto } from '../dto/select-tenant.dto';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Exchange external provider token for tenant memberships',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.externalToken);
  }

  @Public()
  @Post('select-tenant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Select a tenant and get a scoped access token' })
  async selectTenant(
    @Body() dto: SelectTenantDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.selectTenant(
      dto.externalToken,
      dto.tenantId,
    );

    this.setRefreshCookie(res, result.accessToken);

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using the refresh cookie' })
  async refresh(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;

    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No refresh token' });
      return;
    }

    const result = await this.authService.refresh(refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke refresh token and clear cookie' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE);
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}
