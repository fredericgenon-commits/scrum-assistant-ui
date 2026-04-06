import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JiraTicket } from '../../core/models';
import { JiraTicketService } from '../../core/services/jira-ticket.service';
import { JiraTicketFormDialogComponent } from './jira-ticket-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-jira-ticket-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Jira Tickets</h1>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> New Ticket
        </button>
      </div>
      <div class="card-elevated">
        <table mat-table [dataSource]="tickets()">
          <ng-container matColumnDef="key">
            <th mat-header-cell *matHeaderCellDef>Key</th>
            <td mat-cell *matCellDef="let t"><strong>{{ t.key }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="summary">
            <th mat-header-cell *matHeaderCellDef>Summary</th>
            <td mat-cell *matCellDef="let t">{{ t.summary }}</td>
          </ng-container>
          <ng-container matColumnDef="requirement">
            <th mat-header-cell *matHeaderCellDef>Requirement</th>
            <td mat-cell *matCellDef="let t">{{ t.requirement || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="deliveryMethod">
            <th mat-header-cell *matHeaderCellDef>Delivery</th>
            <td mat-cell *matCellDef="let t">
              <mat-chip [class]="'chip-' + (t.deliveryMethod || '').toLowerCase()">
                {{ t.deliveryMethod }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="project">
            <th mat-header-cell *matHeaderCellDef>Project</th>
            <td mat-cell *matCellDef="let t">{{ t.project }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let t">
              <button mat-icon-button (click)="openForm(t)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="confirmDelete(t)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .chip-project { --mdc-chip-label-text-color: #1a2744; }
    .chip-improvement { --mdc-chip-label-text-color: #c5a44e; }
    .chip-it { --mdc-chip-label-text-color: #6366f1; }
  `]
})
export class JiraTicketListComponent implements OnInit {
  private ticketService = inject(JiraTicketService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tickets = signal<JiraTicket[]>([]);
  columns = ['key', 'summary', 'requirement', 'deliveryMethod', 'project', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.ticketService.findAll().subscribe(data => this.tickets.set(data));
  }

  openForm(ticket?: JiraTicket) {
    const ref = this.dialog.open(JiraTicketFormDialogComponent, { width: '520px', data: ticket || null });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const obs = ticket ? this.ticketService.update(ticket.id, result) : this.ticketService.create(result);
      obs.subscribe(() => {
        this.snackBar.open(ticket ? 'Ticket updated' : 'Ticket created', 'OK', { duration: 3000 });
        this.load();
      });
    });
  }

  confirmDelete(ticket: JiraTicket) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Ticket', message: `Delete "${ticket.key}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.ticketService.delete(ticket.id).subscribe(() => {
          this.snackBar.open('Ticket deleted', 'OK', { duration: 3000 });
          this.load();
        });
      }
    });
  }
}
