// Shared types for MCP tools

export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface SearchContext {
  searchId: string;
  optionId: string;
}

export interface BookingContext {
  validationId: string;
  searchId: string;
  optionId: string;
}
