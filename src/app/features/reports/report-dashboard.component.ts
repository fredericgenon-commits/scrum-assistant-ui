import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Team, Sprint, TimeLogReport } from '../../core/models';
import { TeamService } from '../../core/services/team.service';
import { SprintService } from '../../core/services/sprint.service';
import { ReportService } from '../../core/services/report.service';
import { minutesToDisplay } from '../../shared/utils/time-format.util';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [
    MatCardModule, MatSelectModule, MatFormFieldModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, FormsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Sprint Time Report</h1>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <mat-form-field appearance="outline">
          <mat-label>Team</mat-label>
          <mat-select [(value)]="selectedTeamId" (selectionChange)="loadReport()">
            @for (team of teams(); track team.id) {
              <mat-option [value]="team.id">{{ team.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Sprint</mat-label>
          <mat-select [(value)]="selectedSprintId" (selectionChange)="loadReport()">
            @for (sprint of sprints(); track sprint.id) {
              <mat-option [value]="sprint.id">
                {{ sprint.name }}
                @if (sprint.id === currentSprintId()) {
                  (Current)
                }
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Summary cards -->
      @if (reports().length > 0) {
        <div class="summary-row">
          <div class="stat-card">
            <div class="stat-value">{{ reports().length }}</div>
            <div class="stat-label">Developers</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatMinutes(totalMinutes()) }}</div>
            <div class="stat-label">Total Time Logged</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatMinutes(averageMinutes()) }}</div>
            <div class="stat-label">Average per Developer</div>
          </div>
        </div>

        <!-- Developer bars -->
        <div class="card-elevated developer-chart">
          <h3 class="chart-title">Time Logged by Developer</h3>
          @for (report of reports(); track report.developerId) {
            <div class="dev-row" (click)="goToDetail(report.developerId)">
              <div class="dev-info">
                <span class="dev-name">{{ report.developerName }}</span>
                <span class="dev-time">{{ formatMinutes(report.totalMinutes) }}</span>
              </div>
              <div class="time-bar">
                <div class="time-bar-fill"
                     [style.width.%]="maxMinutes() > 0 ? (report.totalMinutes / maxMinutes() * 100) : 0">
                </div>
              </div>
              <div class="dev-breakdown">
                @for (group of groupByDelivery(report); track group.method) {
                  <span class="breakdown-chip" [class]="'chip-' + group.method.toLowerCase()">
                    {{ group.method }}: {{ formatMinutes(group.minutes) }}
                  </span>
                }
              </div>
            </div>
          }
        </div>
      } @else if (selectedTeamId && selectedSprintId) {
        <div class="empty-state">
          <mat-icon>info_outline</mat-icon>
          <p>No time logs found for the selected team and sprint.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters-row {
      display: flex;
      gap: 16px;
      margin-bottom: 28px;

      mat-form-field { min-width: 220px; }
    }

    .summary-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }

    .developer-chart {
      padding: 32px;
    }

    .chart-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 28px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-heading);
    }

    .dev-row {
      padding: 18px 0;
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--color-hover);
        margin: 0 -32px;
        padding: 18px 32px;
      }

      &:last-child { border-bottom: none; }
    }

    .dev-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;

      .dev-name {
        font-weight: 500;
        color: var(--color-text-heading);
        font-size: 15px;
      }

      .dev-time {
        font-weight: 700;
        color: var(--color-gold);
        font-size: 15px;
        letter-spacing: -0.02em;
      }
    }

    .time-bar {
      height: 6px;
      border-radius: 3px;
      background: var(--color-border);
      overflow: hidden;
      margin-bottom: 10px;

      .time-bar-fill {
        height: 100%;
        border-radius: 3px;
        background: linear-gradient(90deg, var(--color-bar-start), var(--color-bar-end));
        transition: width 0.6s ease;
      }
    }

    .dev-breakdown {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .breakdown-chip {
      font-size: 11px;
      padding: 3px 12px;
      border-radius: 9999px;
      font-weight: 500;
      background: var(--color-bg-alt);
      color: var(--color-text-light);
      border: 1px solid var(--color-border);

      &.chip-project { color: var(--color-text-heading); }
      &.chip-improvement { color: var(--color-gold); }
      &.chip-it { color: #7a00df; }
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--color-text-light);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        opacity: 0.4;
      }
    }
  `]
})
export class ReportDashboardComponent implements OnInit {
  private teamService = inject(TeamService);
  private sprintService = inject(SprintService);
  private reportService = inject(ReportService);
  private router = inject(Router);

  teams = signal<Team[]>([]);
  sprints = signal<Sprint[]>([]);
  reports = signal<TimeLogReport[]>([]);
  currentSprintId = signal<number | null>(null);
  selectedTeamId: number | null = null;
  selectedSprintId: number | null = null;

  totalMinutes = computed(() => this.reports().reduce((sum, r) => sum + r.totalMinutes, 0));
  averageMinutes = computed(() => {
    const r = this.reports();
    return r.length > 0 ? Math.round(this.totalMinutes() / r.length) : 0;
  });
  maxMinutes = computed(() => Math.max(...this.reports().map(r => r.totalMinutes), 1));

  formatMinutes = minutesToDisplay;

  ngOnInit() {
    this.teamService.findAll().subscribe(teams => {
      this.teams.set(teams);
      if (teams.length > 0) {
        this.selectedTeamId = teams[0].id;
      }
    });

    this.sprintService.findAll().subscribe(sprints => {
      this.sprints.set(sprints);
    });

    this.sprintService.findCurrentSprint().subscribe({
      next: sprint => {
        if (sprint) {
          this.currentSprintId.set(sprint.id);
          this.selectedSprintId = sprint.id;
          if (this.selectedTeamId) this.loadReport();
        }
      },
      error: () => {
        if (this.sprints().length > 0) {
          this.selectedSprintId = this.sprints()[0].id;
        }
      }
    });
  }

  loadReport() {
    if (this.selectedTeamId && this.selectedSprintId) {
      this.reportService.getTeamSprintReport(this.selectedTeamId, this.selectedSprintId)
        .subscribe(data => this.reports.set(data));
    }
  }

  groupByDelivery(report: TimeLogReport): { method: string; minutes: number }[] {
    const map = new Map<string, number>();
    for (const d of report.details) {
      const method = d.deliveryMethod || 'OTHER';
      map.set(method, (map.get(method) || 0) + d.minutes);
    }
    return Array.from(map.entries()).map(([method, minutes]) => ({ method, minutes }));
  }

  goToDetail(developerId: number) {
    this.router.navigate(['/reports/developer', developerId], {
      queryParams: {
        teamId: this.selectedTeamId,
        sprintId: this.selectedSprintId
      }
    });
  }
}
