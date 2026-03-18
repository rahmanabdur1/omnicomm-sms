import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsService } from './sms.service';
import { OtpLog } from './entities/otp-log.entity';

@Injectable()
export class OtpService {
  constructor(
    private smsService: SmsService,
    @InjectRepository(OtpLog) private otpRepo: Repository<OtpLog>,
  ) {}

  private generateCode(length = 6): string {
    return Math.floor(Math.random() * 10 ** length)
      .toString()
      .padStart(length, '0');
  }

  async sendOtp(phone: string, tenantId: string): Promise<{ message: string }> {
    const code = this.generateCode(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Invalidate previous OTPs for same phone
    await this.otpRepo.update({ phone, tenantId, verified: false }, { verified: true });

    await this.otpRepo.save(this.otpRepo.create({ phone, tenantId, code, expiresAt }));

    await this.smsService.sendSms(phone, `Your OTP is: ${code}. Valid for 5 minutes.`, tenantId);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, code: string, tenantId: string): Promise<{ valid: boolean }> {
    const otp = await this.otpRepo.findOne({
      where: { phone, code, tenantId, verified: false },
    });

    if (!otp || otp.expiresAt < new Date()) {
      return { valid: false };
    }

    await this.otpRepo.update(otp.id, { verified: true });
    return { valid: true };
  }
}