import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import type { Property } from '../../property/entities/property.entity.js';
import { decimalTransformer } from '../../common/decimal.transformer.js';

export enum EscrowStatus {
  AWAITING_DELIVERY = 'AWAITING_DELIVERY',
  COMPLETE = 'COMPLETE',
  REFUNDED = 'REFUNDED',
}

@Entity('escrow_transactions')
export class EscrowTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  propertyId: string;

  /**
   * Datos de la propiedad para mostrar el historial (título, imagen). Sin clave foránea:
   * el historial se conserva aunque el vendedor elimine después una propiedad ya liquidada.
   */
  @ManyToOne('Property', { eager: true, nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'propertyId' })
  property?: Relation<Property> | null;

  @Column()
  buyerWallet: string;

  @Column()
  sellerWallet: string;

  @Column('decimal', { precision: 18, scale: 6, transformer: decimalTransformer })
  amountEth: string;

  @Column()
  contractAddress: string;

  /** Único: el mismo depósito no puede registrarse dos veces. */
  @Column({ unique: true })
  depositTxHash: string;

  @Column({ type: 'varchar', nullable: true })
  releaseTxHash?: string | null;

  @Column({ type: 'varchar', nullable: true })
  refundTxHash?: string | null;

  @Column({ type: 'simple-enum', enum: EscrowStatus, default: EscrowStatus.AWAITING_DELIVERY })
  status: EscrowStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
