import { Component, inject, OnInit, signal, viewChild, effect } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Developer } from '../../core/models';
import { DeveloperService } from '../../core/services/developer.service';
import { DeveloperFormDialogComponent } from './developer-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-developer-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatSortModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Developers</h1>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> New Developer
        </button>
      </div>
      <div class="card-elevated">
        <table mat-table [dataSource]="dataSource" matSort>
          <ng-container matColumnDef="displayName">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
            <td mat-cell *matCellDef="let d">{{ d.displayName || d.name }}</td>
          </ng-container>
          <ng-container matColumnDef="jiraKey">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Jira Key</th>
            <td mat-cell *matCellDef="let d">
              <mat-chip>{{ d.jiraKey }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="team">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="teamName">Team</th>
            <td mat-cell *matCellDef="let d">{{ d.teamName || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let d">
              <button mat-icon-button (click)="openForm(d)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="confirmDelete(d)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </div>
    </div>
  `
})
export class DeveloperListComponent implements OnInit {
  private devService = inject(DeveloperService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  sort = viewChild(MatSort);
  dataSource = new MatTableDataSource<Developer>();
  columns = ['displayName', 'jiraKey', 'team', 'actions'];

  constructor() {
    effect(() => {
      const s = this.sort();
      if (s) this.dataSource.sort = s;
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.devService.findAll().subscribe(data => this.dataSource.data = data);
  }

  openForm(dev?: Developer) {
    const ref = this.dialog.open(DeveloperFormDialogComponent, { width: '480px', data: dev || null });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const obs = dev ? this.devService.update(dev.id, result) : this.devService.create(result);
      obs.subscribe(() => {
        this.snackBar.open(dev ? 'Developer updated' : 'Developer created', 'OK', { duration: 3000 });
        this.load();
      });
    });
  }

  confirmDelete(dev: Developer) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Developer', message: `Delete "${dev.displayName}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.devService.delete(dev.id).subscribe(() => {
          this.snackBar.open('Developer deleted', 'OK', { duration: 3000 });
          this.load();
        });
      }
    });
  }
}
