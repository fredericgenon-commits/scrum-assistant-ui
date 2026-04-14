import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimeLogReport, DeveloperDailyReport } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/reports`;

  getTeamSprintReport(teamId: number, sprintId: number): Observable<TimeLogReport[]> {
    return this.http.get<TimeLogReport[]>(`${this.baseUrl}/team/${teamId}/sprint/${sprintId}`);
  }

  getDeveloperSprintReport(developerId: number, sprintId: number): Observable<DeveloperDailyReport> {
    return this.http.get<DeveloperDailyReport>(`${this.baseUrl}/developer/${developerId}/sprint/${sprintId}`);
  }
}
