import { Body, Controller, Get, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminUsersService } from './admin-users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminPasswordResetService } from './admin-password-reset.service';
import { EmailService } from '../common/services/email.service';
import { TenantAuthService } from './tenant-auth.service';
import { TenantsService } from '../tenants/tenants.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminUsersService: AdminUsersService,
    private readonly resetService: AdminPasswordResetService,
    private readonly emailService: EmailService,
    private readonly tenantAuthService: TenantAuthService,
    private readonly tenantsService: TenantsService
  ) {}

  @Post('token')
  issueToken(
    @Body() body: { clientId: string; clientSecret: string },
    @Res({ passthrough: true }) response: Response
  ) {
    const issued = this.authService.issueToken(body.clientId, body.clientSecret);
    this.adminUsersService.getOrCreate(body.clientId, body.clientSecret).catch(() => undefined);
    const secure = process.env.AUTH_COOKIE_SECURE === 'true';
    const sameSite = (process.env.AUTH_COOKIE_SAMESITE || 'lax') as
      | 'lax'
      | 'strict'
      | 'none';

    response.cookie('pm_auth_token', issued.accessToken, {
      httpOnly: true,
      sameSite,
      secure,
      maxAge: issued.expiresIn * 1000,
      path: '/'
    });
    response.cookie('pm_auth_user', body.clientId, {
      httpOnly: false,
      sameSite,
      secure,
      maxAge: issued.expiresIn * 1000,
      path: '/'
    });

    return issued;
  }

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res({ passthrough: true }) response: Response
  ) {
    let user: any | null = null;
    let tenant: any | null = null;
    try {
      user = await this.adminUsersService.validateCredentials(body.username, body.password);
    } catch (error) {
      const bootstrapUser = process.env.AUTH_ADMIN_CLIENT_ID || '';
      const bootstrapPass = process.env.AUTH_ADMIN_CLIENT_SECRET || '';
      if (body.username === bootstrapUser && body.password === bootstrapPass) {
        user = await this.adminUsersService.getOrCreate(bootstrapUser, bootstrapPass);
      } else {
        tenant = await this.tenantAuthService.validateCredentials(body.username, body.password);
      }
    }
    if (!tenant && !user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const issued = tenant
      ? this.authService.issueTenantToken(tenant.id, tenant.authUsername || tenant.id)
      : this.authService.issueAdminToken(user.username, user.role);
    const secure = process.env.AUTH_COOKIE_SECURE === 'true';
    const sameSite = (process.env.AUTH_COOKIE_SAMESITE || 'lax') as
      | 'lax'
      | 'strict'
      | 'none';

    response.cookie('pm_auth_token', issued.accessToken, {
      httpOnly: true,
      sameSite,
      secure,
      maxAge: issued.expiresIn * 1000,
      path: '/'
    });
    response.cookie('pm_auth_user', tenant ? tenant.authUsername || tenant.id : user.username, {
      httpOnly: false,
      sameSite,
      secure,
      maxAge: issued.expiresIn * 1000,
      path: '/'
    });

    return {
      accessToken: issued.accessToken,
      expiresIn: issued.expiresIn,
      mustChangePassword: tenant ? tenant.authMustChangePassword : user.mustChangePassword
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { identifier: string }) {
    const ttl = Number(process.env.ADMIN_RESET_TOKEN_TTL_MINUTES || 30);
    const result = await this.resetService.createReset(body.identifier, ttl);
    if (result) {
      const frontendUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${result.token}`;
      await this.emailService.sendPasswordReset(result.user.email!, resetUrl);
    }
    return { ok: true };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    const userId = await this.resetService.consumeReset(body.token);
    await this.adminUsersService.setPasswordById(userId, body.password);
    return { ok: true };
  }

  @Get('session')
  @UseGuards(AuthGuard)
  async getSession(@Req() request: Request & { auth?: any }) {
    const auth = request.auth;
    const username = auth?.sub || null;
    if (!username) {
      return { user: null, role: null };
    }
    if (auth?.role === 'tenant' && auth?.tenantId) {
      const tenant = await this.tenantsService.getById(auth.tenantId);
      return {
        user: tenant?.authUsername || username,
        role: 'tenant',
        name: tenant?.name || null,
        email: tenant?.billingEmail || null,
        tenantId: auth.tenantId,
        status: tenant?.status || 'active',
        mustChangePassword: tenant?.authMustChangePassword ?? false
      };
    }
    const profile = await this.adminUsersService.getOrCreate(username);
    return {
      user: profile.username,
      role: profile.role,
      name: profile.name,
      email: profile.email,
      status: profile.status,
      mustChangePassword: profile.mustChangePassword
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() request: Request & { auth?: any }) {
    const auth = request.auth;
    const username = auth?.sub;
    if (auth?.role === 'tenant' && auth?.tenantId) {
      const tenant = await this.tenantsService.getById(auth.tenantId);
      return {
        id: tenant?.id,
        username: tenant?.authUsername || username,
        name: tenant?.name,
        email: tenant?.billingEmail,
        role: 'tenant',
        status: tenant?.status,
        mustChangePassword: tenant?.authMustChangePassword,
        createdAt: tenant?.createdAt,
        updatedAt: tenant?.updatedAt
      };
    }
    const profile = await this.adminUsersService.getOrCreate(username);
    return {
      id: profile.id,
      username: profile.username,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      mustChangePassword: profile.mustChangePassword,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @Req() request: Request & { auth?: any },
    @Body() dto: UpdateProfileDto
  ) {
    const auth = request.auth;
    if (auth?.role === 'tenant' && auth?.tenantId) {
      if (dto.name || dto.email) {
        await this.tenantsService.updateSelf(auth.tenantId, {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.email ? { billingEmail: dto.email } : {})
        });
      }
      if (dto.password) {
        await this.tenantAuthService.setPassword(auth.tenantId, dto.password, false);
      }
      return this.getProfile(request);
    }
    const username = auth?.sub;
    return this.adminUsersService.updateProfile(username, dto);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    const secure = process.env.AUTH_COOKIE_SECURE === 'true';
    const sameSite = (process.env.AUTH_COOKIE_SAMESITE || 'lax') as
      | 'lax'
      | 'strict'
      | 'none';
    response.cookie('pm_auth_token', '', {
      httpOnly: true,
      sameSite,
      secure,
      maxAge: 0,
      path: '/'
    });
    response.cookie('pm_auth_user', '', {
      httpOnly: false,
      sameSite,
      secure,
      maxAge: 0,
      path: '/'
    });
    response.cookie('pm_auth_name', '', {
      httpOnly: false,
      sameSite,
      secure,
      maxAge: 0,
      path: '/'
    });
    return { ok: true };
  }
}
