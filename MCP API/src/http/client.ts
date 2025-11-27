/**
 * HTTP Client for Camino Messenger REST API
 */

import { env } from '../config/env.js';
import type {
  HotelsResponse,
  Hotel,
  CacheInfoResponse,
  AvailabilityRequest,
  AvailabilityResponse,
  HealthResponse,
  ApiErrorResponse,
} from './types.js';

export class RestApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'RestApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

class CaminoRestClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl || env.restApi.baseUrl;
    this.timeout = timeout || env.restApi.timeout;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      let url = `${this.baseUrl}${path}`;

      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      };

      if (body && method === 'POST') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        let errorData: ApiErrorResponse | undefined;
        try {
          errorData = await response.json() as ApiErrorResponse;
        } catch {
          // Response body is not JSON
        }

        const errorMessage = errorData?.message || errorData?.error || `HTTP ${response.status}`;
        const errorCode = this.getErrorCode(response.status, errorData);

        throw new RestApiError(
          response.status,
          errorCode,
          errorMessage,
          errorData?.details || errorData?.errors
        );
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof RestApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError(`Request to ${path} timed out after ${this.timeout}ms`);
        }
        throw new NetworkError(`Network error: ${error.message}`, error);
      }

      throw new NetworkError('Unknown network error');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getErrorCode(statusCode: number, errorData?: ApiErrorResponse): string {
    if (errorData?.details?.[0]?.code) {
      return errorData.details[0].code;
    }

    switch (statusCode) {
      case 400: return 'VALIDATION_ERROR';
      case 404: return 'NOT_FOUND';
      case 500: return 'SERVER_ERROR';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return `HTTP_${statusCode}`;
    }
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  // ============================================
  // Typed API Methods
  // ============================================

  async healthCheck(): Promise<HealthResponse> {
    return this.get<HealthResponse>('/health');
  }

  async getHotels(refresh?: boolean): Promise<HotelsResponse> {
    const params = refresh ? { refresh: 'true' } : undefined;
    return this.get<HotelsResponse>('/api/hotels', params);
  }

  async getHotelByCode(code: string): Promise<Hotel> {
    return this.get<Hotel>(`/api/hotels/${encodeURIComponent(code)}`);
  }

  async getCacheInfo(): Promise<CacheInfoResponse> {
    return this.get<CacheInfoResponse>('/api/hotels/cache-info');
  }

  async searchAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    return this.post<AvailabilityResponse>('/api/availability', request);
  }
}

// Singleton instance
let clientInstance: CaminoRestClient | null = null;

export function getRestClient(): CaminoRestClient {
  if (!clientInstance) {
    clientInstance = new CaminoRestClient();
  }
  return clientInstance;
}

// For testing - allows creating client with custom config
export function createRestClient(baseUrl?: string, timeout?: number): CaminoRestClient {
  return new CaminoRestClient(baseUrl, timeout);
}

export { CaminoRestClient };
