import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('call_logs')
export class CallLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ nullable: true })
  duration: number; // seconds

  @Column()
  status: string; // answered | missed | failed

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({ nullable: true })
  ivrPath: string; // which IVR options were pressed

  @CreateDateColumn()
  startedAt: Date;
}