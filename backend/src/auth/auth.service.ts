import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { verifyMessage } from 'ethers';
import { User } from '../user/entities/user.entity.js';
import { ConnectWalletDto } from './dto/connect-wallet.dto.js';

export const NONCE_TTL_MS = 5 * 60 * 1000;
const MAX_PENDING_NONCES = 10_000;

type PendingNonce = { wallet: string; expiresAt: number };

@Injectable()
export class AuthService {
  /**
   * Mensajes de login emitidos y aún no usados, indexados por el mensaje completo.
   * En memoria: suficiente para una sola instancia del backend; con varias
   * instancias habría que moverlo a la base de datos o a Redis.
   */
  private readonly pendingNonces = new Map<string, PendingNonce>();

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  /** Genera el mensaje de un solo uso que la wallet debe firmar para iniciar sesión. */
  createLoginMessage(walletAddress: string) {
    this.pruneExpired();
    if (this.pendingNonces.size >= MAX_PENDING_NONCES) {
      throw new ServiceUnavailableException('Demasiados inicios de sesión pendientes; intenta en unos minutos');
    }

    const wallet = walletAddress.toLowerCase();
    const nonce = randomBytes(16).toString('hex');
    const message = [
      'Iniciar sesión en Rynok',
      '',
      `Wallet: ${wallet}`,
      `Nonce: ${nonce}`,
      `Emitido: ${new Date().toISOString()}`,
    ].join('\n');

    this.pendingNonces.set(message, { wallet, expiresAt: Date.now() + NONCE_TTL_MS });
    return { message };
  }

  async connectWallet(dto: ConnectWalletDto) {
    const wallet = dto.walletAddress.toLowerCase();
    const pending = this.pendingNonces.get(dto.message);

    if (!pending || pending.wallet !== wallet || pending.expiresAt < Date.now()) {
      throw new UnauthorizedException('Mensaje de inicio de sesión inválido o expirado; solicita uno nuevo');
    }
    // Un solo uso: una firma interceptada no sirve para volver a entrar.
    this.pendingNonces.delete(dto.message);

    let recovered: string;
    try {
      recovered = verifyMessage(dto.message, dto.signature);
    } catch {
      throw new UnauthorizedException('Firma inválida');
    }
    if (recovered.toLowerCase() !== wallet) {
      throw new UnauthorizedException('La firma no corresponde a la wallet');
    }

    let user = await this.users.findOneBy({ walletAddress: wallet });
    if (!user) {
      user = this.users.create({ walletAddress: wallet });
      user = await this.users.save(user);
    }

    const accessToken = this.jwt.sign({ sub: user.id, wallet: user.walletAddress });
    return { accessToken, user };
  }

  findById(id: string) {
    return this.users.findOneBy({ id });
  }

  private pruneExpired() {
    const now = Date.now();
    for (const [message, { expiresAt }] of this.pendingNonces) {
      if (expiresAt < now) this.pendingNonces.delete(message);
    }
  }
}
