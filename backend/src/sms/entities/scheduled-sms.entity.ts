import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum ScheduledSmsStatus { PENDING = 'pending', DISPATCHED = 'dispatched', CANCELLED = 'cancelled' }

@Entity('scheduled_sms')
export class ScheduledSms {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column() to: string;
  @Column('text') message: string;
  @Column() sendAt: Date;
  @Column({ type: 'enum', enum: ScheduledSmsStatus, default: ScheduledSmsStatus.PENDING })
  status: ScheduledSmsStatus;
  @CreateDateColumn() createdAt: Date;
}