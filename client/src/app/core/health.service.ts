import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HealthResponse {
  status: string;
}

// Asks the API whether it can reach the database.
// @Service() makes it available everywhere in the app through inject().
@Service()
export class HealthService {
  private readonly http = inject(HttpClient);

  checkDatabase(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${environment.apiUrl}/api/health/database`);
  }
}
