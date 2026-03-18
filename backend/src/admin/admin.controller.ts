import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getStats() { return this.adminService.getDashboardStats(); }

  @Get('tenants')
  getTenants(@Query('page') page: number, @Query('limit') limit: number) {
    return this.adminService.getAllTenants(page, limit);
  }

  @Get('users')
  getUsers(@Query('page') page: number, @Query('limit') limit: number) {
    return this.adminService.getAllUsers(page, limit);
  }

  @Patch('users/:id/toggle')
  toggleUser(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Get('revenue')
  getRevenue() { return this.adminService.getRevenueAnalytics(); }

  @Post('plans')
  createPlan(@Body() body) { return this.adminService.createPlan(body); }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() body) {
    return this.adminService.managePlan(id, body);
  }
}