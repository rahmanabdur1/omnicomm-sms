import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Free | Basic | Pro | Enterprise

  @Column('decimal')
  monthlyPrice: number;

  @Column('decimal')
  yearlyPrice: number;

  @Column()
  smsQuota: number; // SMS per month

  @Column()
  callMinutesQuota: number;

  @Column('jsonb', { nullable: true })
  features: Record<string, boolean>; // { bulkSms: true, ivr: false, ... }

  @Column({ default: true })
  isActive: boolean;
}