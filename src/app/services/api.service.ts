import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClassificationResponse, ApiRequest, StepExecution, StepExecutionRequest, AvailableTask } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:8093';
  private readonly authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlbmdpbmVlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IEVuZ2luZWVyIiwicm9sZXMiOlsicHJvZHVjdGlvbl9zdXBwb3J0Iiwic3VwcG9ydF9hZG1pbiJdLCJpYXQiOjE3NjI0NjYzNTksImV4cCI6MjA3NzgyNjM1OX0.v8amYkiJOS2dT9MQaZJBkdN-8rWrs-rfxqgVCtgTu3Q';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': this.authToken
    });
  }

  processRequest(request: ApiRequest): Observable<ClassificationResponse> {
    const headers = this.getHeaders();

    return this.http.post<ClassificationResponse>(
      `${this.baseUrl}/api/v1/process`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getAvailableTasks(): Observable<AvailableTask[]> {
    const headers = this.getHeaders();

    return this.http.get<AvailableTask[]>(
      `${this.baseUrl}/api/v1/tasks`,
      { headers }
    ).pipe(
      catchError(() => {
        console.error('Failed to fetch available tasks');
        return throwError(() => new Error('Failed to fetch available tasks'));
      })
    );
  }

  executeStep(request: StepExecutionRequest): Observable<any> {
    const headers = this.getHeadersWithRole(request.roleName);

    return this.http.post<any>(
      `${this.baseUrl}/api/v1/execute-step`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private getHeadersWithRole(roleName?: string): HttpHeaders {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Authorization': this.authToken
    };

    if (roleName) {
      headers['Role-Name'] = roleName;
    }

    return new HttpHeaders(headers);
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

