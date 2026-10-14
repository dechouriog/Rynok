import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parseEther } from 'ethers';

import {
  EscrowStatus,
  EscrowTransaction,
} from './entities/escrow-transaction.entity.js';

import { RecordDepositDto } from './dto/record-deposit.dto.js';
import { DELIVERY_PERIOD_MS, EscrowChainVerifier } from './escrow-chain.verifier.js';

import {
  Property,
  PropertyStatus,
} from '../property/entities/property.entity.js';

function toWei(amountEth: string) {
  try {
    return parseEther(String(amountEth));
  } catch {
    throw new BadRequestException('Monto en ETH inválido');
  }
}

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(EscrowTransaction)
    private readonly repo: Repository<EscrowTransaction>,

    @InjectRepository(Property)
    private readonly properties: Repository<Property>,

    private readonly chain: EscrowChainVerifier,
  ) {}

  async recordDeposit(dto: RecordDepositDto, requesterWallet: string) {
    const property = await this.properties.findOneBy({ id: dto.propertyId });

    if (!property) {
      throw new NotFoundException('La propiedad no existe');
    }

    if (property.status !== PropertyStatus.AVAILABLE) {
      throw new ConflictException('La propiedad no está disponible para la venta');
    }

    // Comprador y vendedor salen del token y de la propiedad, nunca del cliente.
    const buyerWallet = requesterWallet.toLowerCase();
    const sellerWallet = property.owner.walletAddress.toLowerCase();

    if (buyerWallet === sellerWallet) {
      throw new BadRequestException('No puedes comprar tu propia propiedad');
    }

    const amountWei = toWei(dto.amountEth);
    if (amountWei !== toWei(property.priceEth)) {
      throw new BadRequestException('El monto depositado no coincide con el precio de la propiedad');
    }

    await this.chain.assertEvent(dto.depositTxHash, dto.contractAddress, 'Deposited', property.id, {
      buyer: buyerWallet,
      seller: sellerWallet,
      amount: amountWei,
    });

    const saved = await this.repo.save(
      this.repo.create({
        propertyId: property.id,
        buyerWallet,
        sellerWallet,
        amountEth: dto.amountEth,
        contractAddress: dto.contractAddress.toLowerCase(),
        depositTxHash: dto.depositTxHash,
        status: EscrowStatus.AWAITING_DELIVERY,
      }),
    );

    await this.properties.update(property.id, {
      status: PropertyStatus.IN_ESCROW,
    });

    return saved;
  }

  async findByProperty(propertyId: string) {
    return this.repo.findOne({
      where: { propertyId },
      order: { createdAt: 'DESC' },
    });
  }

  findForUser(wallet: string) {
    const normalized = wallet.toLowerCase();
    return this.repo.find({
      where: [
        { buyerWallet: normalized },
        { sellerWallet: normalized },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /** Devuelve el depósito pendiente más reciente de la propiedad. */
  private async findPending(propertyId: string) {
    const record = await this.findByProperty(propertyId);

    if (!record) {
      throw new NotFoundException(
        'No hay un depósito registrado para esta propiedad',
      );
    }

    if (record.status !== EscrowStatus.AWAITING_DELIVERY) {
      throw new ConflictException('El escrow de esta propiedad ya fue cerrado');
    }

    return record;
  }

  async confirmRelease(
    propertyId: string,
    requesterWallet: string,
    releaseTxHash: string,
  ) {
    const record = await this.findPending(propertyId);

    if (
      record.buyerWallet.toLowerCase() !==
      requesterWallet.toLowerCase()
    ) {
      throw new ForbiddenException(
        'Solo el comprador puede confirmar la liberación',
      );
    }

    await this.chain.assertEvent(releaseTxHash, record.contractAddress, 'Released', propertyId, {
      seller: record.sellerWallet,
    });

    record.status = EscrowStatus.COMPLETE;
    record.releaseTxHash = releaseTxHash;

    await this.properties.update(propertyId, {
      status: PropertyStatus.SOLD,
    });

    return this.repo.save(record);
  }

  async refund(
    propertyId: string,
    requesterWallet: string,
    refundTxHash: string,
  ) {
    const record = await this.findPending(propertyId);
    const requester = requesterWallet.toLowerCase();

    // El vendedor puede reembolsar siempre; el comprador solo cuando venció
    // el plazo de entrega (Escrow.claimRefund).
    const isSeller = record.sellerWallet.toLowerCase() === requester;
    const isBuyerAfterDeadline =
      record.buyerWallet.toLowerCase() === requester &&
      Date.now() >= new Date(record.createdAt).getTime() + DELIVERY_PERIOD_MS;

    if (!isSeller && !isBuyerAfterDeadline) {
      throw new ForbiddenException(
        'Solo el vendedor puede reembolsar, o el comprador cuando vence el plazo de entrega',
      );
    }

    await this.chain.assertEvent(refundTxHash, record.contractAddress, 'Refunded', propertyId, {
      seller: record.sellerWallet,
    });

    record.status = EscrowStatus.REFUNDED;
    record.refundTxHash = refundTxHash;

    await this.properties.update(propertyId, {
      status: PropertyStatus.AVAILABLE,
    });

    return this.repo.save(record);
  }
}
