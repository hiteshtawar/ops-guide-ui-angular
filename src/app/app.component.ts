import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from './services/api.service';
import { ClassificationResponse, Step, StepExecution, ApiRequest, StepExecutionRequest } from './models/types';
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
      user_id: 'ops-engineer-test',
      query: query,
      context: {
        reason: 'UI request',
        priority: 'normal',
        requested_by: 'ops-engineer-test',
        timestamp: new Date().toISOString()
      },
      environment: 'prod'
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
          this.queryForm.patchValue({ query: '' });
          
          // Auto-execute only the first auto-executable step
          if (data.steps && data.steps.length > 0) {
            const firstAutoStep = data.steps.find((step, idx) => {
              if (step.autoExecutable) {
                const hasNonAutoBefore = data.steps.slice(0, idx).some(s => !s.autoExecutable);
                return !hasNonAutoBefore;
              }
              return false;
            });
            
            if (firstAutoStep) {
              const stepIndex = data.steps.indexOf(firstAutoStep);
              timer(500).subscribe(() => {
                this.executeStep(stepIndex, firstAutoStep, data);
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

  executeStep(stepIndex: number, step: Step, response: ClassificationResponse, skipApproval = false): void {
    const stepId = `${response.taskId}-step-${stepIndex}`;
    this.executingSteps.add(stepId);
    
    const stepRequest: StepExecutionRequest = {
      requestId: response.taskId,
      stepIndex: String(stepIndex),
      stepName: step.description,
      taskId: response.taskId,
      extractedEntities: response.extractedEntities,
      skipApproval: skipApproval,
      apiEndpoint: step.path || undefined,
      httpMethod: step.method || undefined,
      apiParameters: undefined
    };

    this.apiService.executeStep(stepRequest)
      .pipe(
        finalize(() => {
          this.executingSteps.delete(stepId);
        })
      )
      .subscribe({
        next: (stepExecution: StepExecution) => {
          this.steps.set(stepId, stepExecution);
          
          // If this step completed successfully, check if we should auto-execute the next step
          if (stepExecution.status === 'COMPLETED' && stepExecution.result?.success) {
            const nextStepIndex = stepIndex + 1;
            const nextStep = response.steps?.[nextStepIndex];
            
            // Only auto-execute next step if it's auto-executable
            if (nextStep && nextStep.autoExecutable) {
              timer(500).subscribe(() => {
                this.executeStep(nextStepIndex, nextStep, response);
              });
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

  getStepId(taskId: string, index: number): string {
    return `${taskId}-step-${index}`;
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
}
