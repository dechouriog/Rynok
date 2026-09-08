import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Property } from '../../property/entities/property.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ nullable: true })
  displayName?: string;

  @OneToMany(() => Property, (property) => property.owner)
  properties: Property[];

  @CreateDateColumn()
  createdAt: Date;
}