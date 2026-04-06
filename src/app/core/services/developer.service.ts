import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Developer } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DeveloperService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/developers`;

  findAll(): Observable<Developer[]> {
    return this.http.get<Developer[]>(this.baseUrl);
  }

  findById(id: number): Observable<Developer> {
    return this.http.get<Developer>(`${this.baseUrl}/${id}`);
  }

  findByTeamId(teamId: number): Observable<Developer[]> {
    return this.http.get<Developer[]>(`${this.baseUrl}/team/${teamId}`);
  }

  create(developer: Partial<Developer>): Observable<Developer> {
    return this.http.post<Developer>(this.baseUrl, developer);
  }

  update(id: number, developer: Partial<Developer>): Observable<Developer> {
    return this.http.put<Developer>(`${this.baseUrl}/${id}`, developer);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
