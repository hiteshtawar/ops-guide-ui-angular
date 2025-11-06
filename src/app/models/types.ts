export interface Step {
  stepNumber: number;
  description: string;
  method: string;
  path: string;
  requestBody: string;
  expectedResponse: unknown | null;
  autoExecutable: boolean;
  stepType: string;
}

export interface ClassificationResponse {
  taskId: string;
  taskName: string;
  extractedEntities: {
    [key: string]: string | null;
    entity_type?: string;
    case_id?: string;
    order_id?: string;
    service?: string;
    target_status?: string;
  };
  steps: Step[];
  warnings?: string[];
}

export interface ApiRequest {
  user_id: string;
  query: string;
  context: {
    reason: string;
    priority: string;
    requested_by: string;
    timestamp: string;
    [key: string]: unknown;
  };
  environment: string;
}

export interface StepExecution {
  stepId: string;
  requestId: string;
  stepName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'APPROVAL_REQUIRED' | 'APPROVED' | 'CANCELLED';
  type: 'VALIDATION' | 'PERMISSION_CHECK' | 'API_EXECUTION' | 'VERIFICATION';
  requiresApproval: boolean;
  startedAt?: string;
  completedAt?: string;
  result?: {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
    statusCode?: number;
  };
  errorMessage?: string;
}

export interface StepExecutionRequest {
  requestId: string;
  stepIndex: string;
  stepName: string;
  taskId: string;
  extractedEntities?: Record<string, string | null>;
  skipApproval?: boolean;
  apiEndpoint?: string | null;
  httpMethod?: string | null;
  apiParameters?: Record<string, unknown> | null;
}

