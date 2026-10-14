import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interface, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers';

const ESCROW_EVENTS = new Interface([
  'event Deposited(uint256 indexed propertyId, address indexed buyer, address indexed seller, uint256 amount)',
  'event Released(uint256 indexed propertyId, address indexed seller)',
  'event Refunded(uint256 indexed propertyId, address indexed seller)',
]);

/** Debe coincidir con Escrow.DELIVERY_PERIOD (30 días). */
export const DELIVERY_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export type EscrowEvent = 'Deposited' | 'Released' | 'Refunded';

/** Mismo mapeo UUID -> uint256 que usa el frontend al llamar al contrato. */
export function escrowPropertyId(propertyId: string): bigint {
  return BigInt(keccak256(toUtf8Bytes(propertyId)));
}

/**
 * Comprueba que un hash de transacción reportado por el frontend corresponda a
 * un evento real del contrato de escrow. Si ESCROW_RPC_URL no está configurado
 * la verificación on-chain se omite (útil en tests y desarrollo sin nodo).
 */
@Injectable()
export class EscrowChainVerifier {
  private readonly logger = new Logger(EscrowChainVerifier.name);
  private readonly provider?: JsonRpcProvider;
  private readonly contractAddress?: string;

  constructor(config: ConfigService) {
    const rpcUrl = config.get<string>('ESCROW_RPC_URL');
    this.contractAddress = config.get<string>('ESCROW_CONTRACT_ADDRESS')?.toLowerCase() || undefined;
    if (rpcUrl) {
      this.provider = new JsonRpcProvider(rpcUrl);
    } else {
      this.logger.warn('ESCROW_RPC_URL no configurado: las transacciones de escrow no se verifican on-chain');
    }
  }

  async assertEvent(
    txHash: string,
    contractAddress: string,
    eventName: EscrowEvent,
    propertyId: string,
    expectedArgs: Record<string, string | bigint> = {},
  ) {
    const contract = contractAddress.toLowerCase();
    if (this.contractAddress && contract !== this.contractAddress) {
      throw new BadRequestException('La dirección del contrato de escrow no es la configurada');
    }
    if (!this.provider) return;

    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      throw new BadRequestException('La transacción no existe o no fue exitosa');
    }

    const onchainId = escrowPropertyId(propertyId);
    const found = receipt.logs
      .filter((log) => log.address.toLowerCase() === contract)
      .map((log) => ESCROW_EVENTS.parseLog(log))
      .some(
        (event) =>
          event?.name === eventName &&
          event.args.propertyId === onchainId &&
          Object.entries(expectedArgs).every(([key, value]) =>
            typeof value === 'string'
              ? String(event.args[key]).toLowerCase() === value.toLowerCase()
              : event.args[key] === value,
          ),
      );

    if (!found) {
      throw new BadRequestException(`La transacción no contiene el evento ${eventName} esperado`);
    }
  }
}
