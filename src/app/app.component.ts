import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from './services/api.service';
import { ClassificationResponse, Step, StepExecution, ApiRequest, StepExecutionRequest, AvailableTask, StepGroups } from './models/types';
import { Observable, timer } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('textareaRef', { static: false }) textareaRef!: ElementRef<HTMLTextAreaElement>;
  
  queryForm: FormGroup;
  response: ClassificationResponse | null = null;
  loading = false;
  error: string | null = null;
  steps = new Map<string, StepExecution>();
  executingSteps = new Set<string>();
  availableTasks: AvailableTask[] = [];
  showTaskSelector = false;
  originalQuery = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.queryForm = this.fb.group({
      query: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    // Auto-resize textarea when query changes
    this.queryForm.get('query')?.valueChanges.subscribe(() => {
      this.autoResizeTextarea();
    });
    
    // Fetch available tasks on mount
    this.fetchAvailableTasks();
  }
  
  fetchAvailableTasks(): void {
    this.apiService.getAvailableTasks().subscribe({
      next: (tasks) => {
        this.availableTasks = tasks;
      },
      error: (err) => {
        console.error('Failed to fetch available tasks:', err);
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  }

  handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      const fileType = file.type;
      
      if (fileType === 'image/jpeg' || fileType === 'image/jpg' || fileType === 'application/pdf') {
        console.log('File selected:', file.name, fileType);
        alert(`📎 File "${file.name}" selected (${fileType})`);
      } else {
        alert('⚠️ Please select only JPEG or PDF files');
        input.value = '';
      }
    }
  }

  autoResizeTextarea(): void {
    setTimeout(() => {
      if (this.textareaRef?.nativeElement) {
        const textarea = this.textareaRef.nativeElement;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, 0);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.queryForm.valid && !this.loading) {
        this.onSubmit();
      }
    }
  }

  onSubmit(): void {
    if (!this.queryForm.valid || this.loading) {
      return;
    }

    const query = this.queryForm.get('query')?.value?.trim();
    if (!query) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.response = null;

    const requestBody: ApiRequest = {
      query: query,
      userId: 'ops-engineer-test'
    };

    this.apiService.processRequest(requestBody)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (data: ClassificationResponse) => {
          // Check if classification failed
          if (!data.taskId || data.taskId === 'UNKNOWN') {
            this.originalQuery = query;
            this.showTaskSelector = true;
            this.response = null;
            this.queryForm.patchValue({ query: '' });
            return;
          }
          
          this.response = data;
          this.queryForm.patchValue({ query: '' });
          this.showTaskSelector = false;
          
          // Auto-execute the first auto-executable step from prechecks
          if (data.steps && data.steps.prechecks && data.steps.prechecks.length > 0) {
            const firstAutoStep = data.steps.prechecks.find(step => step.autoExecutable);
            if (firstAutoStep) {
              const stepIndex = data.steps.prechecks.indexOf(firstAutoStep);
              timer(500).subscribe(() => {
                this.executeStep(stepIndex, firstAutoStep, data, 'prechecks');
              });
            }
          }
        },
        error: (err: Error) => {
          this.error = err.message || 'An unknown error occurred';
          console.error('Error:', err);
        }
      });
  }
  
  handleTaskSelection(taskId: string): void {
    this.loading = true;
    this.error = null;
    this.showTaskSelector = false;

    const requestBody: ApiRequest = {
      query: this.originalQuery,
      userId: 'ops-engineer-test',
      taskId: taskId
    };

    this.apiService.processRequest(requestBody)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (data: ClassificationResponse) => {
          this.response = data;
          
          // Auto-execute first auto-executable step in prechecks
          if (data.steps?.prechecks && data.steps.prechecks.length > 0) {
            const firstAutoStep = data.steps.prechecks.find(step => step.autoExecutable);
            if (firstAutoStep) {
              const stepIndex = data.steps.prechecks.indexOf(firstAutoStep);
              timer(500).subscribe(() => {
                this.executeStep(stepIndex, firstAutoStep, data, 'prechecks');
              });
            }
          }
        },
        error: (err: Error) => {
          this.error = err.message || 'An unknown error occurred';
          console.error('Error:', err);
        }
      });
  }

  executeStep(stepIndex: number, step: Step, response: ClassificationResponse, stepGroup: string, skipApproval = false): void {
    const stepId = `${response.taskId}-${stepGroup}-${stepIndex}`;
    this.executingSteps.add(stepId);
    
    const jwtToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlbmdpbmVlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IEVuZ2luZWVyIiwicm9sZXMiOlsicHJvZHVjdGlvbl9zdXBwb3J0Iiwic3VwcG9ydF9hZG1pbiJdLCJpYXQiOjE3NjI0NjYzNTksImV4cCI6MjA3NzgyNjM1OX0.v8amYkiJOS2dT9MQaZJBkdN-8rWrs-rfxqgVCtgTu3Q';
    const roleName = this.extractRoleFromJWT(jwtToken);
    
    const stepRequest: StepExecutionRequest = {
      taskId: response.taskId,
      stepNumber: step.stepNumber,
      entities: response.extractedEntities,
      userId: 'ops-engineer-test',
      authToken: jwtToken,
      roleName: roleName
    };

    this.apiService.executeStep(stepRequest)
      .pipe(
        finalize(() => {
          this.executingSteps.delete(stepId);
        })
      )
      .subscribe({
        next: (stepResponse: any) => {
          // Parse response body to extract message if it's JSON
          let message = stepResponse.responseBody || 'Step completed';
          if (stepResponse.responseBody) {
            message = this.parseMessage(stepResponse.responseBody);
          }

          // Update step status - map backend response to UI format
          const stepExecution: StepExecution = {
            stepId: stepId,
            requestId: response.taskId,
            stepName: step.description,
            status: stepResponse.success ? 'COMPLETED' : 'FAILED',
            type: 'API_EXECUTION',
            requiresApproval: false,
            result: stepResponse.success ? {
              success: true,
              message: message,
              data: { statusCode: stepResponse.statusCode },
              statusCode: stepResponse.statusCode
            } : undefined,
            errorMessage: stepResponse.errorMessage
          };
          
          this.steps.set(stepId, stepExecution);
          
          // If this step completed successfully, check if we should auto-execute the next step in same group
          if (stepResponse.success) {
            const currentGroup = response.steps?.[stepGroup as keyof StepGroups];
            if (currentGroup) {
              const nextStepIndex = stepIndex + 1;
              const nextStep = currentGroup[nextStepIndex];
              
              // Only auto-execute next step if it exists and is auto-executable
              if (nextStep && nextStep.autoExecutable) {
                timer(500).subscribe(() => {
                  this.executeStep(nextStepIndex, nextStep, response, stepGroup);
                });
              }
            }
          }
        },
        error: (err: Error) => {
          const errorMessage = err.message || 'Step execution failed';
          console.error('Step execution error:', err);
          
          // Update step with error
          this.steps.set(stepId, {
            stepId: stepId,
            requestId: response.taskId,
            stepName: step.description,
            status: 'FAILED',
            type: 'VALIDATION',
            requiresApproval: false,
            errorMessage: errorMessage
          });
        }
      });
  }

  getStepId(taskId: string, stepGroup: string, index: number): string {
    return `${taskId}-${stepGroup}-${index}`;
  }
  
  renderStepGroup(stepList: Step[], response: ClassificationResponse, stepGroup: string): Step[] {
    return stepList;
  }

  getStepExecution(stepId: string): StepExecution | undefined {
    return this.steps.get(stepId);
  }

  isExecuting(stepId: string): boolean {
    return this.executingSteps.has(stepId);
  }

  getStepTypeLabel(stepType: string): string {
    return stepType.charAt(0).toUpperCase() + stepType.slice(1);
  }

  getStepStatusIcon(status: string | undefined): string {
    if (!status) return '○';
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'FAILED': return '✗';
      case 'RUNNING': return '⟳';
      case 'APPROVAL_REQUIRED': return '⏸';
      default: return '○';
    }
  }

  getStepStatusClass(status: string | undefined): string {
    return status?.toLowerCase() || 'pending';
  }

  getObjectEntries(obj: Record<string, string | null>): Array<[string, string | null]> {
    return Object.entries(obj);
  }

  /**
   * Checks if any previous step has failed
   * @param stepIndex Current step index in the group
   * @param stepGroup Current step group name
   * @param response Classification response containing all steps
   * @returns true if any previous step has failed
   */
  hasPreviousStepFailed(
    stepIndex: number,
    stepGroup: string,
    response: ClassificationResponse
  ): boolean {
    const groupOrder = ['prechecks', 'procedure', 'postchecks', 'rollback'];
    const currentGroupIndex = groupOrder.indexOf(stepGroup);

    // Check all steps in the same group before the current step
    const currentGroup = response.steps?.[stepGroup as keyof StepGroups];
    if (currentGroup) {
      for (let i = 0; i < stepIndex; i++) {
        const stepId = this.getStepId(response.taskId, stepGroup, i);
        const stepExecution = this.getStepExecution(stepId);
        if (stepExecution?.status === 'FAILED') {
          return true;
        }
      }
    }

    // Check all steps in previous groups
    for (let groupIdx = 0; groupIdx < currentGroupIndex; groupIdx++) {
      const prevGroupName = groupOrder[groupIdx];
      const prevGroup = response.steps?.[prevGroupName as keyof StepGroups];
      if (prevGroup) {
        for (let i = 0; i < prevGroup.length; i++) {
          const stepId = this.getStepId(response.taskId, prevGroupName, i);
          const stepExecution = this.getStepExecution(stepId);
          if (stepExecution?.status === 'FAILED') {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Parses JSON messages and extracts readable strings
   * @param message Message string that may contain JSON
   * @returns Parsed message string
   */
  parseMessage(message: string | undefined): string {
    if (!message) return 'Completed';

    try {
      const parsed = JSON.parse(message);
      // If it's an object with a message property, return that
      if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
        return String(parsed.message);
      }
      // If it's already a string, return it
      return String(parsed);
    } catch {
      // If it's not JSON, return as is
      return message;
    }
  }

  /**
   * Extracts role name from JWT token
   * @param jwtToken JWT token string (with or without Bearer prefix)
   * @returns Role name in Title Case (e.g., "Production Support")
   */
  extractRoleFromJWT(jwtToken: string): string {
    const tokenParts = jwtToken.split(' ');
    const token = tokenParts.length > 1 ? tokenParts[1] : jwtToken;

    let roleName = 'Production Support'; // Default fallback
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.roles && Array.isArray(payload.roles) && payload.roles.length > 0) {
        const role = payload.roles[0];
        roleName = role.split('_').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    } catch (e) {
      console.warn('Failed to parse JWT token for role extraction', e);
    }

    return roleName;
  }
}
