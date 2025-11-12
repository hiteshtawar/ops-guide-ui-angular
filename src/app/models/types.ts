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

export interface StepGroups {
  prechecks?: Step[];
  procedure?: Step[];
  postchecks?: Step[];
  rollback?: Step[];
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
  steps: StepGroups;
  warnings?: string[];
}

export interface ApiRequest {
  query: string;
  userId: string;
  taskId?: string;  // Optional: override classification
}

export interface AvailableTask {
  taskId: string;
  taskName: string;
  description: string;
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
  taskId: string;
  stepNumber: number;
  entities: Record<string, string | null>;
  userId: string;
  authToken: string;
  roleName?: string;
}

