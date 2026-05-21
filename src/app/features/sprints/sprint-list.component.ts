import { Component, inject, OnInit, signal, viewChild, effect } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Sprint, Team } from '../../core/models';
import { SprintService } from '../../core/services/sprint.service';
import { TeamService } from '../../core/services/team.service';
import { SprintFormDialogComponent, SprintDialogResult } from './sprint-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { parseSprintName } from '../../shared/utils/sprint-name.util';

interface PipOption {
  key: string;
  label: string;
  year: number | null;
  pip: number | null;
}

@Component({
  selector: 'app-sprint-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatSortModule,
    MatFormFieldModule, MatSelectModule, FormsModule, DatePipe
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Sprints</h1>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> New Sprint
        </button>
      </div>
      <div class="filters-row">
        <mat-form-field appearance="outline">
          <mat-label>Team</mat-label>
          <mat-select [(value)]="selectedTeamId" (selectionChange)="applyFilter()">
            <mat-option [value]="null">All teams</mat-option>
            @for (team of teams(); track team.id) {
              <mat-option [value]="team.id">{{ team.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>PIP filter</mat-label>
          <mat-select [(value)]="selectedPipKey" (selectionChange)="applyFilter()">
            @for (opt of pipOptions; track opt.key) {
              <mat-option [value]="opt.key">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
      <div class="card-elevated">
        <table mat-table [dataSource]="dataSource" matSort>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
            <td mat-cell *matCellDef="let s">
              {{ s.name }}
              @if (currentSprintId() === s.id) {
                <mat-chip color="accent" highlighted>Current</mat-chip>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="teamName">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Team</th>
            <td mat-cell *matCellDef="let s">{{ s.teamName || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="startDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Start Date</th>
            <td mat-cell *matCellDef="let s">{{ s.startDate | date:'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="endDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>End Date</th>
            <td mat-cell *matCellDef="let s">{{ s.endDate | date:'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="velocity">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Velocity</th>
            <td mat-cell *matCellDef="let s">{{ s.velocity != null ? s.velocity + '%' : '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let s">
              <button mat-icon-button (click)="openForm(s)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="confirmDelete(s)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .filters-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      mat-form-field { min-width: 220px; }
    }
  `]
})
export class SprintListComponent implements OnInit {
  private sprintService = inject(SprintService);
  private teamService = inject(TeamService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  sort = viewChild(MatSort);
  dataSource = new MatTableDataSource<Sprint>();
  teams = signal<Team[]>([]);
  currentSprintId = signal<number | null>(null);
  selectedTeamId: number | null = null;
  selectedPipKey: string = 'all';
  pipOptions: PipOption[] = [{ key: 'all', label: 'All', year: null, pip: null }];
  columns = ['name', 'teamName', 'startDate', 'endDate', 'velocity', 'actions'];

  private allSprints: Sprint[] = [];

  constructor() {
    effect(() => {
      const s = this.sort();
      if (s) this.dataSource.sort = s;
    });
  }

  ngOnInit() {
    this.load();
    this.teamService.findAll().subscribe(t => this.teams.set(t));
    this.sprintService.findCurrentSprint().subscribe({
      next: s => this.currentSprintId.set(s?.id ?? null),
      error: () => {}
    });
  }

  load() {
    this.sprintService.findAll().subscribe(data => {
      this.allSprints = data;
      this.recomputePipOptions();
      const currentYearKey = String(new Date().getFullYear() % 100);
      this.selectedPipKey = this.pipOptions.some(o => o.key === currentYearKey)
        ? currentYearKey
        : 'all';
      this.applyFilter();
    });
  }

  applyFilter() {
    this.recomputePipOptions();
    const opt = this.pipOptions.find(o => o.key === this.selectedPipKey);
    this.dataSource.data = this.allSprints.filter(s => {
      if (this.selectedTeamId != null && s.teamId !== this.selectedTeamId) return false;
      if (!opt || opt.year == null) return true;
      const p = parseSprintName(s.name);
      if (!p) return false;
      if (p.year !== opt.year) return false;
      if (opt.pip != null && p.pip !== opt.pip) return false;
      return true;
    });
  }

  private recomputePipOptions() {
    const teamSprints = this.selectedTeamId == null
      ? this.allSprints
      : this.allSprints.filter(s => s.teamId === this.selectedTeamId);

    const byYear = new Map<number, Set<number>>();
    for (const s of teamSprints) {
      const p = parseSprintName(s.name);
      if (!p) continue;
      if (!byYear.has(p.year)) byYear.set(p.year, new Set());
      byYear.get(p.year)!.add(p.pip);
    }

    const options: PipOption[] = [{ key: 'all', label: 'All', year: null, pip: null }];
    const years = [...byYear.keys()].sort((a, b) => b - a);
    for (const y of years) {
      const yy = String(y).padStart(2, '0');
      options.push({ key: `${y}`, label: `${yy} (all PIPs)`, year: y, pip: null });
      const pips = [...byYear.get(y)!].sort((a, b) => b - a);
      for (const p of pips) {
        options.push({ key: `${y}-${p}`, label: `${yy} / PIP${p}`, year: y, pip: p });
      }
    }
    this.pipOptions = options;

    if (!options.some(o => o.key === this.selectedPipKey)) {
      this.selectedPipKey = 'all';
    }
  }

  openForm(sprint?: Sprint) {
    const ref = this.dialog.open(SprintFormDialogComponent, {
      width: '600px',
      data: { sprint: sprint || null, teams: this.teams() }
    });
    ref.afterClosed().subscribe((result: SprintDialogResult | undefined) => {
      if (!result) return;

      if (sprint) {
        this.sprintService.update(sprint.id, result.sprints[0]).subscribe(() => {
          this.snackBar.open('Sprint updated', 'OK', { duration: 3000 });
          this.load();
        });
      } else if (result.mode === 'single') {
        this.sprintService.create(result.sprints[0]).subscribe(() => {
          this.snackBar.open('Sprint created', 'OK', { duration: 3000 });
          this.load();
        });
      } else {
        this.sprintService.createBatch(result.sprints).subscribe(() => {
          this.snackBar.open(`PIP created (${result.sprints.length} sprints)`, 'OK', { duration: 3000 });
          this.load();
        });
      }
    });
  }

  confirmDelete(sprint: Sprint) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Sprint', message: `Delete "${sprint.name}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.sprintService.delete(sprint.id).subscribe(() => {
          this.snackBar.open('Sprint deleted', 'OK', { duration: 3000 });
          this.load();
        });
      }
    });
  }
}
