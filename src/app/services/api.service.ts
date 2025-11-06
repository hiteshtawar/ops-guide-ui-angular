import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClassificationResponse, ApiRequest, StepExecution, StepExecutionRequest } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:8093';
  private readonly authToken = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvcHMtZW5naW5lZXItdGVzdCIsIm5hbWUiOiJUZXN0IE9wZXJhdG9yIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjE3MDA5OTk5OTksInJvbGVzIjpbIm9wc19lbmdpbmVlciJdfQ.SAMPLE_JWT_TOKEN';
  private readonly userId = 'ops-engineer-test';

  constructor(private http: HttpClient) {}

  private getHeaders(idempotencyKey?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-User-ID': this.userId,
      'Authorization': this.authToken
    });

    if (idempotencyKey) {
      headers = headers.set('X-Idempotency-Key', idempotencyKey);
    }

    return headers;
  }

  processRequest(request: ApiRequest): Observable<ClassificationResponse> {
    const idempotencyKey = this.generateIdempotencyKey();
    const headers = this.getHeaders(idempotencyKey);

    return this.http.post<ClassificationResponse>(
      `${this.baseUrl}/api/v1/process`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  executeStep(request: StepExecutionRequest): Observable<StepExecution> {
    const headers = this.getHeaders();

    return this.http.post<StepExecution>(
      `${this.baseUrl}/v1/steps/execute`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `API error: ${error.status} ${error.statusText || error.message}`;
    }
    
    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

