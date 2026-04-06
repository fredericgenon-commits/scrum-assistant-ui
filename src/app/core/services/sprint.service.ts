import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sprint } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SprintService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/sprints`;

  findAll(): Observable<Sprint[]> {
    return this.http.get<Sprint[]>(this.baseUrl);
  }

  findById(id: number): Observable<Sprint> {
    return this.http.get<Sprint>(`${this.baseUrl}/${id}`);
  }

  findCurrentSprint(): Observable<Sprint> {
    return this.http.get<Sprint>(`${this.baseUrl}/current`);
  }

  findByTeamId(teamId: number): Observable<Sprint[]> {
    return this.http.get<Sprint[]>(`${this.baseUrl}/team/${teamId}`);
  }

  create(sprint: Partial<Sprint>): Observable<Sprint> {
    return this.http.post<Sprint>(this.baseUrl, sprint);
  }

  createBatch(sprints: Partial<Sprint>[]): Observable<Sprint[]> {
    return this.http.post<Sprint[]>(`${this.baseUrl}/batch`, sprints);
  }

  update(id: number, sprint: Partial<Sprint>): Observable<Sprint> {
    return this.http.put<Sprint>(`${this.baseUrl}/${id}`, sprint);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
