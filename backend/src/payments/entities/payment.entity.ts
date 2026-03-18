import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column('decimal')
  amount: number;

  @Column()
  currency: string;

  @Column()
  status: string; // succeeded | failed | pending

  @Column()
  provider: string; // stripe | bkash | sslcommerz

  @Column({ nullable: true })
  providerPaymentId: string;

  @Column({ nullable: true })
  subscriptionId: string;

  @CreateDateColumn()
  paidAt: Date;
}