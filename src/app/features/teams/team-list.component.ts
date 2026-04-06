import { Component, inject, OnInit, signal, viewChild, effect } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Team } from '../../core/models';
import { TeamService } from '../../core/services/team.service';
import { TeamFormDialogComponent } from './team-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSortModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Teams</h1>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> New Team
        </button>
      </div>
      <div class="card-elevated">
        <table mat-table [dataSource]="dataSource" matSort>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
            <td mat-cell *matCellDef="let t">{{ t.name }}</td>
          </ng-container>
          <ng-container matColumnDef="scrumMaster">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="scrumMasterName">Scrum Master</th>
            <td mat-cell *matCellDef="let t">{{ t.scrumMasterName || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="threshold">
            <th mat-header-cell *matHeaderCellDef mat-sort-header="timeLogThreshold">Threshold (min)</th>
            <td mat-cell *matCellDef="let t">{{ t.timeLogThreshold }}</td>
          </ng-container>
          <ng-container matColumnDef="startHour">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Start Hour</th>
            <td mat-cell *matCellDef="let t">{{ t.startHour || '—' }}</td>
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
  `
})
export class TeamListComponent implements OnInit {
  private teamService = inject(TeamService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  sort = viewChild(MatSort);
  dataSource = new MatTableDataSource<Team>();
  columns = ['name', 'scrumMaster', 'threshold', 'startHour', 'actions'];

  constructor() {
    effect(() => {
      const s = this.sort();
      if (s) this.dataSource.sort = s;
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.teamService.findAll().subscribe(data => this.dataSource.data = data);
  }

  openForm(team?: Team) {
    const ref = this.dialog.open(TeamFormDialogComponent, {
      width: '480px',
      data: team || null
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const obs = team
        ? this.teamService.update(team.id, result)
        : this.teamService.create(result);
      obs.subscribe(() => {
        this.snackBar.open(team ? 'Team updated' : 'Team created', 'OK', { duration: 3000 });
        this.load();
      });
    });
  }

  confirmDelete(team: Team) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Team', message: `Delete team "${team.name}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.teamService.delete(team.id).subscribe(() => {
          this.snackBar.open('Team deleted', 'OK', { duration: 3000 });
          this.load();
        });
      }
    });
  }
}
