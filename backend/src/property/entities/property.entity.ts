import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import type { Relation } from 'typeorm';
import type { User } from '../../user/entities/user.entity.js';
import { decimalTransformer } from '../../common/decimal.transformer.js';

export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  IN_ESCROW = 'IN_ESCROW',
  SOLD = 'SOLD',
}

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  location: string;

  /** Se devuelve normalizado ("1.500000" → "1.5"). */
  @Column('decimal', { precision: 18, scale: 6, transformer: decimalTransformer })
  priceEth: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl?: string | null;

  @ManyToOne('User', 'properties', { eager: true })
  owner: Relation<User>;

  @Column({
    type: 'simple-enum',
    enum: PropertyStatus,
    default: PropertyStatus.AVAILABLE,
  })
  status: PropertyStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
