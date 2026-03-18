import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  async inviteTeamMember(
    tenantId: string,
    inviterRole: UserRole,
    data: { name: string; email: string; role: UserRole },
  ) {
    if (inviterRole !== UserRole.ADMIN && inviterRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only admins can invite team members');
    }

    const tempPassword = Math.random().toString(36).slice(-10);
    const hashed = await bcrypt.hash(tempPassword, 12);

    const user = this.userRepo.create({
      name: data.name,
      email: data.email,
      password: hashed,
      tenantId,
      role: data.role,
    });
    await this.userRepo.save(user);

    // In production: send invite email with tempPassword
    return { message: 'Team member invited', tempPassword };
  }

  async getTeamMembers(tenantId: string) {
    return this.userRepo.find({
      where: { tenantId },
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
    });
  }

  async updateMemberRole(tenantId: string, userId: string, role: UserRole) {
    const user = await this.userRepo.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.update(userId, { role });
    return { message: 'Role updated' };
  }

  async removeMember(tenantId: string, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.update(userId, { isActive: false });
    return { message: 'Member removed' };
  }

  async getTenantSettings(tenantId: string) {
    return this.tenantRepo.findOne({ where: { id: tenantId } });
  }
}