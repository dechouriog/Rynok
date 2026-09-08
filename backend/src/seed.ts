import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PropertyService } from './property/property.service';
import { AuthService } from './auth/auth.service';
import { Wallet } from 'ethers';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const properties = app.get(PropertyService);
  const auth = app.get(AuthService);

  const wallet = Wallet.createRandom();
  const message = 'seed';
  const signature = await wallet.signMessage(message);
  const { user } = await auth.connectWallet({ walletAddress: wallet.address, signature, message });

  const samples = [
    { title: 'Casa campestre en Envigado', description: 'Amplio jardín, 3 habitaciones', location: 'Envigado', priceEth: '4.2' },
    { title: 'Loft en El Poblado', description: 'Estilo moderno, cerca al metro', location: 'Medellín', priceEth: '1.8' },
    { title: 'Finca en Guatapé', description: 'Vista al embalse', location: 'Guatapé', priceEth: '6.5' },
  ];

  for (const sample of samples) await properties.create(sample as any, user.id);
  console.log(`Seed completado: ${samples.length} propiedades para ${wallet.address}`);
  await app.close();
}
seed();