import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

  @Column()
  buyerWallet: string;

  @Column()
  sellerWallet: string;

  @Column('decimal', { precision: 18, scale: 6 })
  amountEth: string;

  @Column()
  contractAddress: string;

  @Column()
  depositTxHash: string;

  @Column({ nullable: true })
  releaseTxHash?: string;

  @Column({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.AWAITING_DELIVERY })
  status: EscrowStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}