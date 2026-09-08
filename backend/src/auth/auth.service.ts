import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { verifyMessage } from 'ethers';
import { User } from '../user/entities/user.entity';
import { ConnectWalletDto } from './dto/connect-wallet.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async connectWallet(dto: ConnectWalletDto) {
    const recovered = verifyMessage(dto.message, dto.signature);
    if (recovered.toLowerCase() !== dto.walletAddress.toLowerCase()) {
      throw new UnauthorizedException('La firma no corresponde a la wallet');
    }

    let user = await this.users.findOneBy({ walletAddress: dto.walletAddress.toLowerCase() });
    if (!user) {
      user = this.users.create({ walletAddress: dto.walletAddress.toLowerCase() });
      user = await this.users.save(user);
    }

    const accessToken = this.jwt.sign({ sub: user.id, wallet: user.walletAddress });
    return { accessToken, user };
  }

  findById(id: string) {
    return this.users.findOneBy({ id });
  }
}