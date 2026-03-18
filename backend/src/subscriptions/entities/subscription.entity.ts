import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Plan } from './plan.entity';

export enum BillingCycle { MONTHLY = 'monthly', YEARLY = 'yearly' }
export enum SubStatus { ACTIVE = 'active', EXPIRED = 'expired', CANCELLED = 'cancelled' }

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Plan)
  plan: Plan;

  @Column()
  planId: string;

  @Column({ type: 'enum', enum: BillingCycle })
  billingCycle: BillingCycle;

  @Column({ type: 'enum', enum: SubStatus, default: SubStatus.ACTIVE })
  status: SubStatus;

  @Column()
  smsUsed: number;

  @Column()
  callMinutesUsed: number;

  @Column()
  currentPeriodStart: Date;

  @Column()
  currentPeriodEnd: Date;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @CreateDateColumn()
  createdAt: Date;
}