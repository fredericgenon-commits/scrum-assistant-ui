import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimeLog } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TimeLogService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/time-logs`;

  findAll(): Observable<TimeLog[]> {
    return this.http.get<TimeLog[]>(this.baseUrl);
  }

  findById(id: number): Observable<TimeLog> {
    return this.http.get<TimeLog>(`${this.baseUrl}/${id}`);
  }

  create(timeLog: Partial<TimeLog>): Observable<TimeLog> {
    return this.http.post<TimeLog>(this.baseUrl, timeLog);
  }

  update(id: number, timeLog: Partial<TimeLog>): Observable<TimeLog> {
    return this.http.put<TimeLog>(`${this.baseUrl}/${id}`, timeLog);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
