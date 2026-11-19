import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { formatEther, isAddress, parseEther } from 'ethers';
import { AppModule } from './app.module.js';
import { User } from './user/entities/user.entity.js';
import { Property } from './property/entities/property.entity.js';

/**
 * Carga propiedades de demostración. Es idempotente: no duplica títulos ya existentes del vendedor.
 *
 * - DEMO_SELLER_ADDRESS: wallet dueña de las propiedades (por defecto la cuenta #0 pública de Hardhat,
 *   solo para la demo local). En Sepolia usa tu wallet vendedora.
 * - DEMO_PRICE_SCALE: multiplica los precios (p. ej. 0.001 en Sepolia, donde los faucets dan poco ETH).
 */
const DEFAULT_SELLER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const img = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=70&auto=format&fit=crop`;

export const DEMO_PROPERTIES = [
  {
    title: 'Apartamento moderno en El Poblado',
    description:
      'Tres habitaciones, dos baños, balcón con vista a la ciudad y parqueadero cubierto. A dos cuadras del parque Lleras.',
    location: 'Medellín, Antioquia',
    priceEth: '2.5',
    imageUrl: img('photo-1502672260266-1c1ef2d93688'),
  },
  {
    title: 'Casa campestre en Envigado',
    description: 'Amplio jardín con árboles frutales, cuatro habitaciones, chimenea y zona BBQ. Ideal para familias.',
    location: 'Envigado, Antioquia',
    priceEth: '4.2',
    imageUrl: img('photo-1568605114967-8130f3a36994'),
  },
  {
    title: 'Finca con vista al embalse de Guatapé',
    description: 'Lote de 2 hectáreas con casa principal, muelle privado y cabaña para invitados frente al embalse.',
    location: 'Guatapé, Antioquia',
    priceEth: '6.5',
    imageUrl: img('photo-1564013799919-ab600027ffc6'),
  },
  {
    title: 'Loft industrial en Chapinero',
    description: 'Doble altura, ventanales de piso a techo y cocina abierta. Edificio con gimnasio y coworking.',
    location: 'Bogotá, Cundinamarca',
    priceEth: '1.8',
    imageUrl: img('photo-1522708323590-d24dbb6b0267'),
  },
  {
    title: 'Casa colonial en el centro histórico',
    description:
      'Casa restaurada de dos pisos con patio central, techos altos y terraza con vista a la ciudad amurallada.',
    location: 'Cartagena, Bolívar',
    priceEth: '7.9',
    imageUrl: img('photo-1512917774080-9991f1c4c750'),
  },
  {
    title: 'Penthouse frente al mar',
    description: 'Cuatro habitaciones, piscina privada en la terraza y acceso directo a la playa desde el edificio.',
    location: 'Santa Marta, Magdalena',
    priceEth: '9.4',
    imageUrl: img('photo-1613490493576-7fde63acd811'),
  },
  {
    title: 'Casa minimalista en Llanogrande',
    description: 'Diseño contemporáneo, paneles solares, tres habitaciones y estudio. A 15 minutos del aeropuerto.',
    location: 'Rionegro, Antioquia',
    priceEth: '3.6',
    imageUrl: img('photo-1600596542815-ffad4c1539a9'),
  },
  {
    title: 'Apartaestudio cerca a la universidad',
    description: 'Ideal para estudiantes o renta: cocina integral, lavandería comunal y excelente transporte público.',
    location: 'Cali, Valle del Cauca',
    priceEth: '0.8',
    imageUrl: img('photo-1570129477492-45c003edd2be'),
  },
];

/** Escala un precio en ETH manteniendo como máximo 6 decimales (precisión de la columna). */
export function scalePrice(priceEth: string, scale: number): string {
  if (scale === 1) return priceEth;
  const scaled = Number(priceEth) * scale;
  const rounded = Math.max(Number(scaled.toFixed(6)), 0.000001);
  return formatEther(parseEther(rounded.toFixed(6))).replace(/\.0$/, '');
}

async function seed() {
  const logger = new Logger('Seed');
  const seller = (process.env.DEMO_SELLER_ADDRESS || DEFAULT_SELLER).toLowerCase();
  if (!isAddress(seller)) throw new Error('DEMO_SELLER_ADDRESS no es una dirección válida');
  const scale = Number(process.env.DEMO_PRICE_SCALE || '1');
  if (!(scale > 0)) throw new Error('DEMO_PRICE_SCALE debe ser un número mayor que 0');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const dataSource = app.get(DataSource);
  const users = dataSource.getRepository(User);
  const properties = dataSource.getRepository(Property);

  const owner =
    (await users.findOneBy({ walletAddress: seller })) ?? (await users.save(users.create({ walletAddress: seller })));

  let created = 0;
  for (const sample of DEMO_PROPERTIES) {
    if (await properties.existsBy({ title: sample.title, owner: { id: owner.id } })) continue;
    await properties.save(properties.create({ ...sample, priceEth: scalePrice(sample.priceEth, scale), owner }));
    created++;
  }
  logger.log(
    `Seed completado: ${created} propiedades nuevas (${DEMO_PROPERTIES.length - created} ya existían) ` +
      `para ${seller}${scale !== 1 ? ` con precios ×${scale}` : ''}`,
  );
  await app.close();
}

if (process.env.VITEST === undefined) void seed();
