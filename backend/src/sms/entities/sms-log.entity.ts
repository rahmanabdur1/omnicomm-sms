import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sms_logs')
export class SmsLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  to: string;

  @Column('text')
  message: string;

  @Column({ default: 'pending' })
  status: string; // pending | delivered | failed

  @Column({ nullable: true })
  provider: string; // api | gsm | none

  @CreateDateColumn()
  createdAt: Date;
}