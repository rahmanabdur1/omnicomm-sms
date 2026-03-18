import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CallLog } from './entities/call-log.entity';
import { IvrConfig } from './entities/ivr-config.entity';
import * as net from 'net';

@Injectable()
export class TelephonyService {
  private readonly logger = new Logger(TelephonyService.name);

  constructor(
    @InjectRepository(CallLog) private callLogRepo: Repository<CallLog>,
    @InjectRepository(IvrConfig) private ivrRepo: Repository<IvrConfig>,
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Asterisk AMI (Manager Interface) command sender
  private async sendAmiCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = net.createConnection(
        { host: this.config.get('ASTERISK_HOST', 'localhost'), port: 5038 },
        () => {
          const auth =
            `Action: Login\r\nUsername: ${this.config.get('ASTERISK_AMI_USER')}\r\nSecret: ${this.config.get('ASTERISK_AMI_SECRET')}\r\n\r\n` +
            command + '\r\n\r\n' +
            'Action: Logoff\r\n\r\n';
          client.write(auth);
        },
      );
      client.on('data', () => { client.destroy(); resolve(); });
      client.on('error', reject);
    });
  }

  async originateCall(from: string, to: string, tenantId: string) {
    const command =
      `Action: Originate\r\nChannel: SIP/${to}\r\nContext: omnicomm\r\nExten: ${from}\r\nPriority: 1\r\nCallerID: ${from}\r\nTimeout: 30000`;

    await this.sendAmiCommand(command);

    const log = this.callLogRepo.create({ tenantId, from, to, status: 'initiated' });
    await this.callLogRepo.save(log);

    this.eventEmitter.emit('CALL_STARTED', { from, to, tenantId, logId: log.id });
    return { logId: log.id, status: 'initiated' };
  }

  async handleCallEnded(callData: { logId: string; duration: number; status: string; recordingUrl?: string }) {
    await this.callLogRepo.update(callData.logId, {
      duration: callData.duration,
      status: callData.status,
      recordingUrl: callData.recordingUrl,
    });
    this.eventEmitter.emit('CALL_ENDED', callData);
  }

  async getCallLogs(tenantId: string, page = 1, limit = 20) {
    return this.callLogRepo.findAndCount({
      where: { tenantId },
      order: { startedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async createIvrConfig(tenantId: string, data: Partial<IvrConfig>) {
    const ivr = this.ivrRepo.create({ ...data, tenantId });
    return this.ivrRepo.save(ivr);
  }

  async getIvrConfigs(tenantId: string) {
    return this.ivrRepo.find({ where: { tenantId } });
  }
}