import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum DeviceStatus { ONLINE = 'online', OFFLINE = 'offline', ERROR = 'error' }

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column() name: string;
  @Column() port: string;        // e.g. /dev/ttyUSB0
  @Column({ nullable: true }) simNumber: string;
  @Column({ nullable: true }) operator: string;
  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status: DeviceStatus;
  @Column({ default: 0 }) sentCount: number;
  @Column({ default: 0 }) failCount: number;
  @Column({ nullable: true }) lastSeenAt: Date;
  @CreateDateColumn() createdAt: Date;
}