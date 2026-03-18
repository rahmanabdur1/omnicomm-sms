import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sms_providers')
export class SmsProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // twilio | nexmo | infobip | custom

  @Column()
  apiKey: string;

  @Column({ nullable: true })
  apiSecret: string;

  @Column({ nullable: true })
  fromNumber: string;

  @Column({ default: 1 })
  priority: number; // 1 = highest

  @Column({ default: true })
  isActive: boolean;
}