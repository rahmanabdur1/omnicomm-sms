import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SmsLog } from '../sms/entities/sms-log.entity';
import { Plan } from '../subscriptions/entities/plan.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(SmsLog) private smsLogRepo: Repository<SmsLog>,
    @InjectRepository(Plan) private planRepo: Repository<Plan>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalTenants, activeSubs, totalPayments] = await Promise.all([
      this.userRepo.count(),
      this.tenantRepo.count(),
      this.subRepo.count({ where: { status: 'active' as any } }),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.status = :s', { s: 'succeeded' })
        .getRawOne(),
    ]);

    const smsStats = await this.smsLogRepo
      .createQueryBuilder('s')
      .select('s.status, COUNT(*) as count')
      .groupBy('s.status')
      .getRawMany();

    return { totalUsers, totalTenants, activeSubs, revenue: totalPayments?.total ?? 0, smsStats };
  }

  async getAllTenants(page = 1, limit = 20) {
    return this.tenantRepo.findAndCount({
      relations: ['users'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async getAllUsers(page = 1, limit = 20) {
    return this.userRepo.findAndCount({
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async getRevenueAnalytics() {
    return this.paymentRepo
      .createQueryBuilder('p')
      .select("DATE_TRUNC('month', p.paidAt)", 'month')
      .addSelect('SUM(p.amount)', 'revenue')
      .addSelect('COUNT(*)', 'transactions')
      .where('p.status = :s', { s: 'succeeded' })
      .groupBy("DATE_TRUNC('month', p.paidAt)")
      .orderBy('month', 'ASC')
      .getRawMany();
  }

  async managePlan(planId: string, data: Partial<Plan>) {
    return this.planRepo.update(planId, data);
  }

  async createPlan(data: Partial<Plan>) {
    return this.planRepo.save(this.planRepo.create(data));
  }

  async toggleUserStatus(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    await this.userRepo.update(userId, { isActive: !user.isActive });
    return { isActive: !user.isActive };
  }
}