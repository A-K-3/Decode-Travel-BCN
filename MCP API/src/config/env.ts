import { config } from 'dotenv';
import { z } from 'zod';

config({ quiet: true });

const envSchema = z.object({
  CAMINO_BOT_HOST: z.string().default('localhost'),
  CAMINO_BOT_PORT: z.string().default('9090'),
  CAMINO_WALLET_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  CAMINO_KEYSTORE_PATH: z.string().optional(),
  CAMINO_KEYSTORE_PASSWORD: z.string().optional(),
  CAMINO_NETWORK: z.enum(['columbus', 'camino']).default('columbus'),
  OPENAI_API_KEY: z.string().min(1),
  PORT: z.string().default('3000'),
  REST_API_BASE_URL: z.string().url().default('http://172.18.160.1:3000'),
  REST_API_TIMEOUT: z.coerce.number().default(30000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten());
  process.exit(1);
}

export const env = {
  bot: {
    host: parsed.data.CAMINO_BOT_HOST,
    port: parseInt(parsed.data.CAMINO_BOT_PORT, 10),
    endpoint: `${parsed.data.CAMINO_BOT_HOST}:${parsed.data.CAMINO_BOT_PORT}`,
  },
  wallet: {
    address: parsed.data.CAMINO_WALLET_ADDRESS,
    keystorePath: parsed.data.CAMINO_KEYSTORE_PATH,
    keystorePassword: parsed.data.CAMINO_KEYSTORE_PASSWORD,
  },
  network: parsed.data.CAMINO_NETWORK,
  openai: {
    apiKey: parsed.data.OPENAI_API_KEY,
  },
  http: {
    port: parseInt(parsed.data.PORT, 10),
  },
  restApi: {
    baseUrl: parsed.data.REST_API_BASE_URL,
    timeout: parsed.data.REST_API_TIMEOUT,
  },
};
