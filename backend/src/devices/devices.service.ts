import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Device, DeviceStatus } from './entities/device.entity';

const execAsync = promisify(exec);

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(@InjectRepository(Device) private deviceRepo: Repository<Device>) {}

  async getDevices(tenantId: string) {
    return this.deviceRepo.find({ where: { tenantId } });
  }

  async registerDevice(tenantId: string, data: Partial<Device>) {
    return this.deviceRepo.save(this.deviceRepo.create({ ...data, tenantId }));
  }

  async sendViaDevice(device: Device, to: string, message: string): Promise<boolean> {
    try {
      await execAsync(
        `gammu --config /etc/gammu-${device.id}.conf sendsms TEXT ${to} -text "${message}"`,
      );
      await this.deviceRepo.update(device.id, {
        sentCount: () => 'sentCount + 1',
        lastSeenAt: new Date(),
        status: DeviceStatus.ONLINE,
      });
      return true;
    } catch (err) {
      await this.deviceRepo.update(device.id, {
        failCount: () => 'failCount + 1',
        status: DeviceStatus.ERROR,
      });
      this.logger.error(`Device ${device.name} error: ${err.message}`);
      return false;
    }
  }

  // Health-check all devices every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async healthCheck() {
    const devices = await this.deviceRepo.find();
    for (const device of devices) {
      try {
        await execAsync(`gammu --config /etc/gammu-${device.id}.conf identify`);
        await this.deviceRepo.update(device.id, {
          status: DeviceStatus.ONLINE,
          lastSeenAt: new Date(),
        });
      } catch {
        await this.deviceRepo.update(device.id, { status: DeviceStatus.OFFLINE });
      }
    }
  }
}