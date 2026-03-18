import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum CampaignStatus {
  DRAFT = 'draft', SCHEDULED = 'scheduled',
  RUNNING = 'running', COMPLETED = 'completed', FAILED = 'failed',
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  name: string;

  @Column('text')
  message: string;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ default: 0 })
  totalRecipients: number;

  @Column({ default: 0 })
  sent: number;

  @Column({ default: 0 })
  failed: number;

  @CreateDateColumn()
  createdAt: Date;
}