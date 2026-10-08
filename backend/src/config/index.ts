import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port:               parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv:            process.env.NODE_ENV ?? 'development',
  frontendUrl:        process.env.FRONTEND_URL ?? 'http://localhost:3000',
  rpcUrl:             process.env.RPC_URL ?? 'http://127.0.0.1:8545',
  chainId:            parseInt(process.env.CHAIN_ID ?? '31337', 10),
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY ?? '',
  custodianPrivateKey: process.env.CUSTODIAN_PRIVATE_KEY ?? '',
  tursoDatabaseUrl:   process.env.TURSO_DATABASE_URL ?? '',
  tursoAuthToken:     process.env.TURSO_AUTH_TOKEN ?? '',
  demoSeedToken:      process.env.DEMO_SEED_TOKEN ?? '',
} as const;
