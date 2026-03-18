import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('members')
  getMembers(@Req() req) {
    return this.tenantsService.getTeamMembers(req.user.tenantId);
  }

  @Post('invite')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  invite(@Req() req, @Body() body: { name: string; email: string; role: UserRole }) {
    return this.tenantsService.inviteTeamMember(req.user.tenantId, req.user.role, body);
  }

  @Patch('members/:id/role')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateRole(@Req() req, @Param('id') id: string, @Body('role') role: UserRole) {
    return this.tenantsService.updateMemberRole(req.user.tenantId, id, role);
  }

  @Delete('members/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  remove(@Req() req, @Param('id') id: string) {
    return this.tenantsService.removeMember(req.user.tenantId, id);
  }
}