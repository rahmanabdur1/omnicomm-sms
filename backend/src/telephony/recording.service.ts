import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallLog } from './entities/call-log.entity';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);
  private readonly recordingsDir: string;

  constructor(
    private config: ConfigService,
    @InjectRepository(CallLog) private callLogRepo: Repository<CallLog>,
  ) {
    this.recordingsDir = config.get('RECORDINGS_DIR', '/var/spool/asterisk/monitor');
  }

  // Asterisk calls this webhook when recording is ready
  async handleRecordingReady(callId: string, filename: string) {
    const filePath = path.join(this.recordingsDir, filename);

    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Recording file not found: ${filePath}`);
      return;
    }

    // In production: upload to S3 / DigitalOcean Spaces
    const publicUrl = await this.uploadToStorage(filePath, filename);

    await this.callLogRepo.update({ id: callId }, { recordingUrl: publicUrl });
    this.logger.log(`Recording saved: ${publicUrl}`);

    // Clean up local file after upload
    fs.unlinkSync(filePath);
  }

  private async uploadToStorage(filePath: string, filename: string): Promise<string> {
    // Example: upload to S3-compatible storage
    const fileStream = fs.createReadStream(filePath);
    const storageUrl = this.config.get('STORAGE_BASE_URL');

    // In production use @aws-sdk/client-s3 or similar
    // Returning a mock URL for structure clarity
    return `${storageUrl}/recordings/${filename}`;
  }

  async getRecordingUrl(callLogId: string, tenantId: string): Promise<string> {
    const log = await this.callLogRepo.findOne({ where: { id: callLogId, tenantId } });
    if (!log || !log.recordingUrl) throw new NotFoundException('Recording not found');
    return log.recordingUrl;
  }

  async listRecordings(tenantId: string, page = 1, limit = 20) {
    return this.callLogRepo.find({
      where: { tenantId },
      select: ['id', 'from', 'to', 'duration', 'recordingUrl', 'startedAt'],
      order: { startedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}