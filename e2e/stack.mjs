// Levanta un stack aislado para las pruebas e2e de navegador:
//   Postgres (base rynok_e2e, limpia) → nodo Hardhat :8546 → Escrow.sol → API :3101 (verificación on-chain activa) → Next.js :3100
// Playwright lo arranca como webServer. No usa ni lee ningún .env real: todo va por variables de proceso.
import { spawn, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import pg from 'pg';
import { ContractFactory, JsonRpcProvider, Wallet } from 'ethers';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const E2E = {
  rpcPort: 8546,
  apiPort: 3101,
  webPort: 3100,
  escrow: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // primer despliegue de la cuenta #0 en un nodo nuevo
  deployerKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // cuenta #0 pública de Hardhat
};

const db = {
  host: process.env.E2E_DB_HOST ?? 'localhost',
  port: Number(process.env.E2E_DB_PORT ?? 5433),
  user: process.env.E2E_DB_USER ?? 'rynok',
  password: process.env.E2E_DB_PASSWORD ?? 'rynok',
  database: 'rynok_e2e',
};

const children = [];
function run(name, command, cwd, env = {}) {
  const child = spawn(command, {
    cwd,
    shell: true,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const prefix = (chunk) => process.stdout.write(chunk.toString().replace(/^(?=.)/gm, `[${name}] `));
  child.stdout.on('data', prefix);
  child.stderr.on('data', prefix);
  child.on('exit', (code) => code && code !== 0 && console.error(`[${name}] terminó con código ${code}`));
  children.push(child);
  return child;
}

function cleanup() {
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;
    try {
      if (process.platform === 'win32') execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
      else process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGKILL');
    }
  }
}
process.on('exit', cleanup);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => process.exit(0));

async function waitFor(description, check, timeoutMs = 180_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check().catch(() => false)) return;
    await sleep(1000);
  }
  throw new Error(`Tiempo agotado esperando ${description}`);
}

async function resetDatabase() {
  const admin = new pg.Client({ ...db, database: process.env.E2E_DB_ADMIN_DB ?? 'postgres' });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [db.database]);
  if (!exists.rowCount) await admin.query(`CREATE DATABASE ${db.database}`);
  await admin.end();
  const client = new pg.Client(db);
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await client.end();
  console.log('[stack] base rynok_e2e limpia');
}

async function main() {
  await resetDatabase();

  run('hardhat', `npx hardhat node --port ${E2E.rpcPort}`, resolve(ROOT, 'contracts'));
  const provider = new JsonRpcProvider(`http://127.0.0.1:${E2E.rpcPort}`, 31337, { staticNetwork: true });
  await waitFor('el nodo Hardhat', async () => (await provider.getBlockNumber()) >= 0);

  const artifact = JSON.parse(
    readFileSync(resolve(ROOT, 'contracts/artifacts/contracts/Escrow.sol/Escrow.json'), 'utf8'),
  );
  const deployer = new Wallet(E2E.deployerKey, provider);
  const contract = await new ContractFactory(artifact.abi, artifact.bytecode, deployer).deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  if (address !== E2E.escrow) throw new Error(`Dirección inesperada ${address}: el nodo Hardhat no estaba limpio`);
  console.log(`[stack] Escrow en ${address}`);

  // Con ESCROW_RPC_URL el backend verifica cada depósito, liberación y reembolso contra el contrato.
  const chainEnv = {
    ESCROW_RPC_URL: `http://127.0.0.1:${E2E.rpcPort}`,
    ESCROW_CONTRACT_ADDRESS: address,
  };
  execSync('npm run build', { cwd: resolve(ROOT, 'backend'), stdio: 'inherit' });
  run('api', 'node dist/main.js', resolve(ROOT, 'backend'), {
    ...chainEnv,
    PORT: String(E2E.apiPort),
    DB_HOST: db.host,
    DB_PORT: String(db.port),
    DB_USER: db.user,
    DB_PASSWORD: db.password,
    DB_NAME: db.database,
    DB_SYNCHRONIZE: 'true',
    JWT_SECRET: 'e2e-secret-solo-para-pruebas',
    CORS_ORIGINS: `http://localhost:${E2E.webPort}`,
  });
  await waitFor('la API', async () => {
    const health = await (await fetch(`http://localhost:${E2E.apiPort}/health`)).json();
    return health.escrow?.verification === 'on-chain';
  });

  const webEnv = {
    NEXT_DIST_DIR: '.next-e2e',
    NEXT_PUBLIC_API_URL: `http://localhost:${E2E.apiPort}`,
    NEXT_PUBLIC_CHAIN_ID: '31337',
    NEXT_PUBLIC_RPC_URL: `http://127.0.0.1:${E2E.rpcPort}`,
    NEXT_PUBLIC_ESCROW_ADDRESS: address,
  };
  execSync('npx next build', { cwd: resolve(ROOT, 'frontend'), stdio: 'inherit', env: { ...process.env, ...webEnv } });
  run('web', `npx next start -p ${E2E.webPort}`, resolve(ROOT, 'frontend'), webEnv);
  await waitFor('el frontend', async () => (await fetch(`http://localhost:${E2E.webPort}`)).ok);
  console.log('[stack] listo');
  await new Promise(() => undefined); // se mantiene vivo hasta que Playwright lo detenga
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
