import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import type { Property } from '../../property/entities/property.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ nullable: true })
  displayName?: string;

  @OneToMany('Property', 'owner')
  properties: Relation<Property>[];

  @CreateDateColumn()
  createdAt: Date;
}
