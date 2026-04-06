import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/teams`;

  findAll(): Observable<Team[]> {
    return this.http.get<Team[]>(this.baseUrl);
  }

  findById(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.baseUrl}/${id}`);
  }

  create(team: Partial<Team>): Observable<Team> {
    return this.http.post<Team>(this.baseUrl, team);
  }

  update(id: number, team: Partial<Team>): Observable<Team> {
    return this.http.put<Team>(`${this.baseUrl}/${id}`, team);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
