import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscrowStatus, EscrowTransaction } from './entities/escrow-transaction.entity.js';
import { RecordDepositDto } from './dto/record-deposit.dto.js';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(EscrowTransaction) private readonly repo: Repository<EscrowTransaction>,
  ) {}

  recordDeposit(dto: RecordDepositDto) {
    const record = this.repo.create({ ...dto, status: EscrowStatus.AWAITING_DELIVERY });
    return this.repo.save(record);
  }

  async findByProperty(propertyId: string) {
    return this.repo.findOne({ where: { propertyId }, order: { createdAt: 'DESC' } });
  }

  async confirmRelease(propertyId: string, requesterWallet: string, releaseTxHash: string) {
    const record = await this.repo.findOne({ where: { propertyId } });
    if (!record) throw new NotFoundException('No hay un depósito registrado para esta propiedad');
    if (record.buyerWallet.toLowerCase() !== requesterWallet.toLowerCase()) {
      throw new ForbiddenException('Solo el comprador puede confirmar la liberación');
    }
    record.status = EscrowStatus.COMPLETE;
    record.releaseTxHash = releaseTxHash;
    return this.repo.save(record);
  }
}