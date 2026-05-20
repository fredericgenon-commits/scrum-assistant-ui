  import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JiraTicket } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JiraTicketService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/jira-tickets`;

  findAll(): Observable<JiraTicket[]> {
    return this.http.get<JiraTicket[]>(this.baseUrl);
  }

  findById(id: number): Observable<JiraTicket> {
    return this.http.get<JiraTicket>(`${this.baseUrl}/${id}`);
  }

  create(ticket: Partial<JiraTicket>): Observable<JiraTicket> {
    return this.http.post<JiraTicket>(this.baseUrl, ticket);
  }

  update(id: number, ticket: Partial<JiraTicket>): Observable<JiraTicket> {
    return this.http.put<JiraTicket>(`${this.baseUrl}/${id}`, ticket);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
