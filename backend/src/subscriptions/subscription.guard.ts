import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.user?.tenantId;
    const hasQuota = await this.subscriptionsService.checkSmsQuota(tenantId);
    if (!hasQuota) throw new ForbiddenException('SMS quota exceeded. Please upgrade your plan.');
    return true;
  }
}