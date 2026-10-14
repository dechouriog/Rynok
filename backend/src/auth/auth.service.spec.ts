import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Wallet } from 'ethers';
import { AuthService, NONCE_TTL_MS } from './auth.service.js';
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
    repo.findOneBy.mockResolvedValue({ id: '1' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function signedLogin(wallet: ReturnType<typeof Wallet.createRandom>) {
    const { message } = service.createLoginMessage(wallet.address);
    const signature = await wallet.signMessage(message);
    return { walletAddress: wallet.address, signature, message };
  }

  it('genera un mensaje distinto en cada solicitud, con la wallet y un nonce', () => {
    const wallet = Wallet.createRandom();
    const a = service.createLoginMessage(wallet.address).message;
    const b = service.createLoginMessage(wallet.address).message;

    expect(a).not.toBe(b);
    expect(a).toContain(wallet.address.toLowerCase());
    expect(a).toMatch(/Nonce: [0-9a-f]{32}/);
  });

  it('crea un usuario nuevo si la firma es válida y el wallet no existe', async () => {
    const wallet = Wallet.createRandom();
    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockReturnValue({ walletAddress: wallet.address.toLowerCase() });
    repo.save.mockResolvedValue({ id: '1', walletAddress: wallet.address.toLowerCase() });

    const result = await service.connectWallet(await signedLogin(wallet));

    expect(result.accessToken).toBe('fake-jwt');
    expect(repo.save).toHaveBeenCalled();
  });

  it('rechaza si la firma no corresponde a la wallet', async () => {
    const wallet = Wallet.createRandom();
    const other = Wallet.createRandom();
    const { message } = service.createLoginMessage(wallet.address);
    const signature = await other.signMessage(message);

    await expect(
      service.connectWallet({ walletAddress: wallet.address, signature, message }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza reutilizar una firma ya usada (replay)', async () => {
    const login = await signedLogin(Wallet.createRandom());

    await service.connectWallet(login);
    await expect(service.connectWallet(login)).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza un mensaje que no fue emitido por el backend', async () => {
    const wallet = Wallet.createRandom();
    const message = 'Iniciar sesión en Rynok - 1736200000000';
    const signature = await wallet.signMessage(message);

    await expect(
      service.connectWallet({ walletAddress: wallet.address, signature, message }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza un mensaje emitido para otra wallet', async () => {
    const victim = Wallet.createRandom();
    const attacker = Wallet.createRandom();
    const { message } = service.createLoginMessage(victim.address);
    const signature = await attacker.signMessage(message);

    await expect(
      service.connectWallet({ walletAddress: attacker.address, signature, message }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza un mensaje expirado', async () => {
    vi.useFakeTimers();
    const login = await signedLogin(Wallet.createRandom());
    vi.advanceTimersByTime(NONCE_TTL_MS + 1);

    await expect(service.connectWallet(login)).rejects.toThrow(UnauthorizedException);
  });

  it('pedir un nonce nuevo no invalida uno pendiente', async () => {
    const wallet = Wallet.createRandom();
    const first = await signedLogin(wallet);
    service.createLoginMessage(wallet.address);

    await expect(service.connectWallet(first)).resolves.toMatchObject({ accessToken: 'fake-jwt' });
  });
});
