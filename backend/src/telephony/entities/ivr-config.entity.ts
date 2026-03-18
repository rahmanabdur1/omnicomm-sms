import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ivr_configs')
export class IvrConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  name: string;

  @Column('jsonb')
  menuOptions: {
    key: string;
    label: string;
    action: string; // transfer | playback | submenu
    target?: string;
  }[];

  @Column({ default: true })
  isActive: boolean;
}