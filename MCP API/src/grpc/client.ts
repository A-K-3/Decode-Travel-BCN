import { createClient, type Client } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import type { DescService } from '@bufbuild/protobuf';
import { env } from '../config/env.js';

// Transport configuration for Camino Messenger Bot
const transport = createGrpcTransport({
  baseUrl: `http://${env.bot.endpoint}`,
  // Timeout de 30 segundos para evitar esperas largas
  defaultTimeoutMs: 30000,
});

/**
 * Creates a typed gRPC client for a Camino Messenger service
 * @param service - The service definition from generated proto files
 * @returns Typed client for the service
 */
export function createCaminoClient<T extends DescService>(service: T): Client<T> {
  return createClient(service, transport);
}

export { transport };
