import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Wallet } from 'ethers';
import { AuthService } from './auth.service.js';
import { User } from '../user/entities/user.entity.js';

const mockRepo = () => ({ findOneBy: vi.fn(), create: vi.fn(), save: vi.fn() });

describe('AuthService', () => {
  let service: AuthService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: JwtService, useValue: { sign: () => 'fake-jwt' } },
      ],
    }).compile();

    service = module.get(AuthService);
    repo = module.get(getRepositoryToken(User));
  });

  it('crea un usuario nuevo si la firma es válida y el wallet no existe', async () => {
    const wallet = Wallet.createRandom();
    const message = 'login';
    const signature = await wallet.signMessage(message);

    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockReturnValue({ walletAddress: wallet.address.toLowerCase() });
    repo.save.mockResolvedValue({ id: '1', walletAddress: wallet.address.toLowerCase() });

    const result = await service.connectWallet({ walletAddress: wallet.address, signature, message });

    expect(result.accessToken).toBe('fake-jwt');
    expect(repo.save).toHaveBeenCalled();
  });

  it('rechaza si la firma no corresponde a la wallet', async () => {
    const signer = Wallet.createRandom();
    const otherWallet = Wallet.createRandom();
    const message = 'login';
    const signature = await otherWallet.signMessage(message);

    await expect(
      service.connectWallet({ walletAddress: signer.address, signature, message }),
    ).rejects.toThrow(UnauthorizedException);
  });
});