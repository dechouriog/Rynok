import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { EscrowService } from './escrow.service.js';
import { EscrowChainVerifier } from './escrow-chain.verifier.js';
import { EscrowTransaction } from './entities/escrow-transaction.entity.js';
import { Property } from '../property/entities/property.entity.js';

const mockRepo = () => ({
  create: vi.fn((x) => x),
  save: vi.fn(async (x) => x),
  findOne: vi.fn(),
  findOneBy: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
});

const SELLER = '0x00000000000000000000000000000000000000d1';
const BUYER = '0x00000000000000000000000000000000000000b1';
const HASH = `0x${'a'.repeat(64)}`;

const property = (overrides = {}) => ({
  id: 'prop-1',
  priceEth: '2.000000',
  status: 'AVAILABLE',
  owner: { id: 'owner-1', walletAddress: SELLER },
  ...overrides,
});

const depositDto = (overrides = {}) => ({
  propertyId: 'prop-1',
  amountEth: '2',
  contractAddress: '0x0000000000000000000000000000000000000c01',
  depositTxHash: HASH,
  ...overrides,
});

describe('EscrowService', () => {
  let service: EscrowService;
  let escrowRepo: ReturnType<typeof mockRepo>;
  let propertyRepo: ReturnType<typeof mockRepo>;
  let chain: { assertEvent: ReturnType<typeof vi.fn> };

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
        {
          provide: EscrowChainVerifier,
          useValue: { assertEvent: vi.fn() },
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
    chain = module.get(EscrowChainVerifier);
  });

  describe('recordDeposit', () => {
    it('registra el depósito con comprador del token y vendedor de la propiedad, y marca IN_ESCROW', async () => {
      propertyRepo.findOneBy.mockResolvedValue(property());

      const saved = await service.recordDeposit(depositDto() as any, BUYER.toUpperCase().replace('0X', '0x'));

      expect(saved).toMatchObject({ buyerWallet: BUYER, sellerWallet: SELLER, status: 'AWAITING_DELIVERY' });
      expect(chain.assertEvent).toHaveBeenCalledWith(HASH, expect.any(String), 'Deposited', 'prop-1', expect.objectContaining({ buyer: BUYER, seller: SELLER }));
      expect(propertyRepo.update).toHaveBeenCalledWith('prop-1', { status: 'IN_ESCROW' });
    });

    it('lanza NotFoundException si la propiedad no existe', async () => {
      propertyRepo.findOneBy.mockResolvedValue(null);
      await expect(service.recordDeposit(depositDto() as any, BUYER)).rejects.toThrow(NotFoundException);
    });

    it('rechaza depositar sobre una propiedad que no está disponible', async () => {
      propertyRepo.findOneBy.mockResolvedValue(property({ status: 'SOLD' }));
      await expect(service.recordDeposit(depositDto() as any, BUYER)).rejects.toThrow(ConflictException);
      expect(escrowRepo.save).not.toHaveBeenCalled();
    });

    it('rechaza un monto distinto al precio de la propiedad', async () => {
      propertyRepo.findOneBy.mockResolvedValue(property());
      await expect(service.recordDeposit(depositDto({ amountEth: '0.000001' }) as any, BUYER)).rejects.toThrow(BadRequestException);
    });

    it('rechaza que el vendedor compre su propia propiedad', async () => {
      propertyRepo.findOneBy.mockResolvedValue(property());
      await expect(service.recordDeposit(depositDto() as any, SELLER)).rejects.toThrow(BadRequestException);
    });

    it('no guarda nada si la verificación on-chain falla', async () => {
      propertyRepo.findOneBy.mockResolvedValue(property());
      chain.assertEvent.mockRejectedValue(new BadRequestException('tx inválida'));
      await expect(service.recordDeposit(depositDto() as any, BUYER)).rejects.toThrow(BadRequestException);
      expect(escrowRepo.save).not.toHaveBeenCalled();
      expect(propertyRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('confirmRelease', () => {
    it('marca COMPLETE y la propiedad SOLD', async () => {
      escrowRepo.findOne.mockResolvedValue({ buyerWallet: BUYER, status: 'AWAITING_DELIVERY', contractAddress: '0xc' });

      const result = await service.confirmRelease('prop-1', BUYER, HASH);

      expect(result).toMatchObject({ status: 'COMPLETE', releaseTxHash: HASH });
      expect(propertyRepo.update).toHaveBeenCalledWith('prop-1', { status: 'SOLD' });
    });

    it('rechaza confirmar si el solicitante no es el comprador', async () => {
      escrowRepo.findOne.mockResolvedValue({ buyerWallet: BUYER, status: 'AWAITING_DELIVERY' });
      await expect(service.confirmRelease('prop-1', '0xotra', HASH)).rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si no hay depósito para esa propiedad', async () => {
      escrowRepo.findOne.mockResolvedValue(null);
      await expect(service.confirmRelease('prop-1', BUYER, HASH)).rejects.toThrow(NotFoundException);
    });

    it('rechaza confirmar un escrow ya cerrado', async () => {
      escrowRepo.findOne.mockResolvedValue({ buyerWallet: BUYER, status: 'COMPLETE' });
      await expect(service.confirmRelease('prop-1', BUYER, HASH)).rejects.toThrow(ConflictException);
    });
  });

  describe('refund', () => {
    it('marca REFUNDED y la propiedad vuelve a AVAILABLE', async () => {
      escrowRepo.findOne.mockResolvedValue({
        sellerWallet: SELLER, buyerWallet: BUYER, status: 'AWAITING_DELIVERY', contractAddress: '0xc', createdAt: new Date(),
      });

      const result = await service.refund('prop-1', SELLER, HASH);

      expect(result).toMatchObject({ status: 'REFUNDED', refundTxHash: HASH });
      expect(propertyRepo.update).toHaveBeenCalledWith('prop-1', { status: 'AVAILABLE' });
    });

    it('rechaza que el comprador registre el reembolso antes del plazo', async () => {
      escrowRepo.findOne.mockResolvedValue({
        sellerWallet: SELLER, buyerWallet: BUYER, status: 'AWAITING_DELIVERY', createdAt: new Date(),
      });
      await expect(service.refund('prop-1', BUYER, HASH)).rejects.toThrow(ForbiddenException);
    });

    it('permite al comprador registrar el reembolso vencido el plazo de 30 días', async () => {
      const createdAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      escrowRepo.findOne.mockResolvedValue({
        sellerWallet: SELLER, buyerWallet: BUYER, status: 'AWAITING_DELIVERY', contractAddress: '0xc', createdAt,
      });

      const result = await service.refund('prop-1', BUYER, HASH);

      expect(result).toMatchObject({ status: 'REFUNDED' });
      expect(chain.assertEvent).toHaveBeenCalledWith(HASH, '0xc', 'Refunded', 'prop-1', { seller: SELLER });
    });

    it('rechaza el reembolso de un tercero', async () => {
      const createdAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      escrowRepo.findOne.mockResolvedValue({
        sellerWallet: SELLER, buyerWallet: BUYER, status: 'AWAITING_DELIVERY', createdAt,
      });
      await expect(service.refund('prop-1', '0xotra', HASH)).rejects.toThrow(ForbiddenException);
    });
  });

  it('busca el historial normalizando la wallet a minúsculas', async () => {
    escrowRepo.find.mockResolvedValue([
      { id: '1' },
      { id: '2' },
    ]);

    const result = await service.findForUser('0xABC');

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
