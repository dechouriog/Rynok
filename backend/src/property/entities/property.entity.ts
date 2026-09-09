import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import type { User } from '../../user/entities/user.entity.js';

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

  @Column('decimal', { precision: 18, scale: 6 })
  priceEth: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @ManyToOne('User', 'properties', { eager: true })
  owner: Relation<User>;

  @CreateDateColumn()
  createdAt: Date;
}