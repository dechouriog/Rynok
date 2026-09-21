import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { EscrowService } from './escrow.service.js';
import { EscrowTransaction } from './entities/escrow-transaction.entity.js';
import { Property } from '../property/entities/property.entity.js';

const mockRepo = () => ({
  create: vi.fn(),
  save: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
});

describe('EscrowService', () => {
  let service: EscrowService;
  let escrowRepo: ReturnType<typeof mockRepo>;
  let propertyRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EscrowService,
        {
          provide: getRepositoryToken(EscrowTransaction),
          useFactory: mockRepo,
        },
        {
          provide: getRepositoryToken(Property),
          useFactory: mockRepo,
        },
      ],
    }).compile();

    service = module.get(EscrowService);
    escrowRepo = module.get(
      getRepositoryToken(EscrowTransaction),
    );
    propertyRepo = module.get(
      getRepositoryToken(Property),
    );
  });

  it('registra un depósito y marca la propiedad como IN_ESCROW', async () => {
    const dto = {
      propertyId: 'prop-1',
      buyerWallet: '0xabc',
      sellerWallet: '0xdef',
      amountEth: '2',
      contractAddress: '0x123',
      depositTxHash: '0xhash',
    };

    escrowRepo.create.mockReturnValue(dto);
    escrowRepo.save.mockResolvedValue({
      id: '1',
      ...dto,
    });

    await service.recordDeposit(dto as any);

    expect(propertyRepo.update).toHaveBeenCalledWith(
      'prop-1',
      { status: 'IN_ESCROW' },
    );
  });

  it('rechaza confirmar si el solicitante no es el comprador', async () => {
    escrowRepo.findOne.mockResolvedValue({
      buyerWallet: '0xabc',
    });

    await expect(
      service.confirmRelease(
        'prop-1',
        '0xotra',
        '0xhash',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lanza NotFoundException si no hay depósito para esa propiedad', async () => {
    escrowRepo.findOne.mockResolvedValue(null);

    await expect(
      service.confirmRelease(
        'prop-1',
        '0xabc',
        '0xhash',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('devuelve las transacciones donde el usuario es comprador o vendedor', async () => {
    escrowRepo.find.mockResolvedValue([
      { id: '1' },
      { id: '2' },
    ]);

    const result = await service.findForUser('0xabc');

    expect(escrowRepo.find).toHaveBeenCalledWith({
      where: [
        { buyerWallet: '0xabc' },
        { sellerWallet: '0xabc' },
      ],
      order: { createdAt: 'DESC' },
    });

    expect(result).toHaveLength(2);
  });
});