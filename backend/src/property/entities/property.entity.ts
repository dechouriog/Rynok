import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

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

  @ManyToOne(() => User, (user) => user.properties, { eager: true })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;
}