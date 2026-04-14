import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { DeveloperDailyReport, DailyTimeEntry, Sprint } from '../../core/models';
import { ReportService } from '../../core/services/report.service';
import { DeveloperService } from '../../core/services/developer.service';
import { SprintService } from '../../core/services/sprint.service';
import { minutesToDisplay } from '../../shared/utils/time-format.util';

type ViewMode = 'ticket' | 'epic' | 'project';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TicketRow {
  project: string;
  epic: string;
  ticketKey: string;
  byDay: Record<string, number>;
}

interface AggRow {
  project: string;
  epic: string;
  ticketKey: string;
  byDay: Record<string, number>;
  projectSpan: number;
  epicSpan: number;
  showProject: boolean;
  showEpic: boolean;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dayName} ${dd}/${mm}`;
}

function getSprintDays(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (current < endDay) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function buildTicketRows(entries: DailyTimeEntry[]): TicketRow[] {
  const map = new Map<string, TicketRow>();
  for (const e of entries) {
    let row = map.get(e.ticketKey);
    if (!row) {
      row = { project: e.project || '', epic: e.epic || '', ticketKey: e.ticketKey, byDay: {} };
      map.set(e.ticketKey, row);
    }
    row.byDay[e.date] = (row.byDay[e.date] || 0) + e.minutes;
  }
  const rows = Array.from(map.values());
  rows.sort((a, b) => a.project.localeCompare(b.project) || a.epic.localeCompare(b.epic) || a.ticketKey.localeCompare(b.ticketKey));
  return rows;
}

function buildAggregatedRows(ticketRows: TicketRow[], mode: ViewMode): AggRow[] {
  let rows: AggRow[];

  if (mode === 'ticket') {
    rows = ticketRows.map(r => ({ ...r, projectSpan: 1, epicSpan: 1, showProject: true, showEpic: true }));
  } else if (mode === 'epic') {
    const grouped = new Map<string, { project: string; epic: string; byDay: Record<string, number> }>();
    for (const r of ticketRows) {
      const key = `${r.project}|||${r.epic}`;
      let g = grouped.get(key);
      if (!g) { g = { project: r.project, epic: r.epic, byDay: {} }; grouped.set(key, g); }
      for (const [day, min] of Object.entries(r.byDay)) { g.byDay[day] = (g.byDay[day] || 0) + min; }
    }
    rows = Array.from(grouped.values())
      .map(g => ({ ...g, ticketKey: '', projectSpan: 1, epicSpan: 1, showProject: true, showEpic: true }));
    rows.sort((a, b) => a.project.localeCompare(b.project) || a.epic.localeCompare(b.epic));
  } else {
    const grouped = new Map<string, { project: string; byDay: Record<string, number> }>();
    for (const r of ticketRows) {
      let g = grouped.get(r.project);
      if (!g) { g = { project: r.project, byDay: {} }; grouped.set(r.project, g); }
      for (const [day, min] of Object.entries(r.byDay)) { g.byDay[day] = (g.byDay[day] || 0) + min; }
    }
    rows = Array.from(grouped.values())
      .map(g => ({ ...g, epic: '', ticketKey: '', projectSpan: 1, epicSpan: 1, showProject: true, showEpic: false }));
    rows.sort((a, b) => a.project.localeCompare(b.project));
  }

  return addSpans(rows, mode);
}

function addSpans(rows: AggRow[], mode: ViewMode): AggRow[] {
  let i = 0;
  while (i < rows.length) {
    let projectEnd = i + 1;
    while (projectEnd < rows.length && rows[projectEnd].project === rows[i].project) projectEnd++;
    rows[i].showProject = true;
    rows[i].projectSpan = projectEnd - i;
    for (let j = i + 1; j < projectEnd; j++) { rows[j].showProject = false; rows[j].projectSpan = 0; }

    if (mode === 'ticket' || mode === 'epic') {
      let k = i;
      while (k < projectEnd) {
        let epicEnd = k + 1;
        while (epicEnd < projectEnd && rows[epicEnd].epic === rows[k].epic) epicEnd++;
        rows[k].showEpic = true;
        rows[k].epicSpan = epicEnd - k;
        for (let j = k + 1; j < epicEnd; j++) { rows[j].showEpic = false; rows[j].epicSpan = 0; }
        k = epicEnd;
      }
    }
    i = projectEnd;
  }
  return rows;
}

@Component({
  selector: 'app-developer-detail',
  standalone: true,
  imports: [
    MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatSelectModule, MatFormFieldModule, FormsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ report()?.developerName ?? 'Developer' }} — Time Report</h1>
        </div>
      </div>

      <!-- Sprint selector -->
      <div class="filters-row">
        <mat-form-field appearance="outline">
          <mat-label>Sprint</mat-label>
          <mat-select [value]="selectedSprintId()" (selectionChange)="onSprintChange($event.value)">
            @for (sprint of sprints(); track sprint.id) {
              <mat-option [value]="sprint.id">{{ sprint.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- View mode buttons -->
      <div class="view-mode-row">
        <mat-button-toggle-group [value]="viewMode()" (change)="viewMode.set($event.value)">
          <mat-button-toggle value="project">Project</mat-button-toggle>
          <mat-button-toggle value="epic">Epic</mat-button-toggle>
          <mat-button-toggle value="ticket">Ticket</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <!-- Pivot table -->
      @if (aggRows().length > 0) {
        <div class="card-elevated table-wrapper">
          <table class="pivot-table">
            <thead>
              <tr>
                <th class="col-label">Project</th>
                @if (showEpicCol()) { <th class="col-label">Epic</th> }
                @if (showTicketCol()) { <th class="col-label">Ticket</th> }
                @for (day of sprintDays(); track day) {
                  <th class="col-day">{{ formatDay(day) }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of aggRows(); track $index) {
                <tr [class.even-row]="$index % 2 === 0">
                  @if (row.showProject) {
                    <td class="cell-label" [attr.rowspan]="row.projectSpan">{{ row.project }}</td>
                  }
                  @if (showEpicCol() && row.showEpic) {
                    <td class="cell-label" [attr.rowspan]="row.epicSpan">{{ row.epic }}</td>
                  }
                  @if (showTicketCol()) {
                    <td class="cell-label">{{ row.ticketKey }}</td>
                  }
                  @for (day of sprintDays(); track day) {
                    <td class="cell-time">{{ formatTime(row.byDay[day]) }}</td>
                  }
                </tr>
              }
              <!-- Total row -->
              <tr class="total-row">
                <td class="cell-label total-label"
                    [attr.colspan]="showTicketCol() ? 3 : showEpicCol() ? 2 : 1">Total</td>
                @for (day of sprintDays(); track day) {
                  <td class="cell-time total-time">{{ formatTime(dayTotals()[day]) }}</td>
                }
              </tr>
            </tbody>
          </table>
        </div>
      } @else if (selectedSprintId()) {
        <div class="empty-state">
          <mat-icon>info_outline</mat-icon>
          <p>No time logs for this developer in this sprint.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filters-row {
      margin-bottom: 16px;
      mat-form-field { min-width: 280px; }
    }

    .view-mode-row {
      margin-bottom: 20px;
    }

    .table-wrapper {
      overflow-x: auto;
      padding: 0;
    }

    .pivot-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      background: var(--color-card);
    }

    .pivot-table th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #fff;
      background: var(--color-gold, #8F7237);
      white-space: nowrap;
    }

    .pivot-table th.col-day {
      text-align: center;
      min-width: 80px;
    }

    .pivot-table td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--color-border);
      vertical-align: middle;
      color: var(--color-text);
    }

    .cell-label {
      border-right: 1px solid var(--color-border);
      font-weight: 500;
      color: var(--color-text-heading);
    }

    .cell-time {
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .even-row {
      background: var(--color-bg-alt);
    }

    .total-row {
      background: var(--color-gold, #8F7237);
      color: #fff;
      font-weight: 600;
    }

    .total-row td {
      color: #fff;
      font-weight: 600;
      border-bottom: none;
    }

    .total-label {
      border-right: 1px solid rgba(255,255,255,0.3);
    }

    .total-time {
      text-align: center;
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
export class DeveloperDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportService = inject(ReportService);
  private developerService = inject(DeveloperService);
  private sprintService = inject(SprintService);

  report = signal<DeveloperDailyReport | null>(null);
  sprints = signal<Sprint[]>([]);
  selectedSprintId = signal<number | null>(null);
  viewMode = signal<ViewMode>('ticket');

  private developerId = 0;

  sprintDays = computed<string[]>(() => {
    const sprintId = this.selectedSprintId();
    const sprint = this.sprints().find(s => s.id === sprintId);
    if (!sprint) return [];
    return getSprintDays(sprint.startDate, sprint.endDate);
  });

  private ticketRows = computed<TicketRow[]>(() => {
    const r = this.report();
    if (!r) return [];
    return buildTicketRows(r.entries);
  });

  aggRows = computed<AggRow[]>(() => buildAggregatedRows(this.ticketRows(), this.viewMode()));

  dayTotals = computed<Record<string, number>>(() => {
    const totals: Record<string, number> = {};
    for (const day of this.sprintDays()) totals[day] = 0;
    for (const row of this.ticketRows()) {
      for (const [day, min] of Object.entries(row.byDay)) {
        totals[day] = (totals[day] || 0) + min;
      }
    }
    return totals;
  });

  showEpicCol = computed(() => this.viewMode() !== 'project');
  showTicketCol = computed(() => this.viewMode() === 'ticket');

  formatDay = formatDayHeader;
  formatTime(minutes: number | undefined): string {
    if (!minutes) return '';
    return minutesToDisplay(minutes);
  }

  ngOnInit() {
    this.developerId = Number(this.route.snapshot.paramMap.get('id'));
    const sprintIdParam = Number(this.route.snapshot.queryParamMap.get('sprintId'));

    this.developerService.findById(this.developerId).subscribe(dev => {
      if (dev.teamId) {
        this.sprintService.findByTeamId(dev.teamId).subscribe(sprints => {
          const sorted = [...sprints].sort((a, b) => b.startDate.localeCompare(a.startDate));
          this.sprints.set(sorted);

          if (sprintIdParam && sorted.some(s => s.id === sprintIdParam)) {
            this.selectedSprintId.set(sprintIdParam);
          } else {
            const now = new Date().toISOString();
            const current = sorted.find(s => s.startDate <= now && s.endDate > now);
            this.selectedSprintId.set(current?.id ?? sorted[0]?.id ?? null);
          }
          this.loadReport();
        });
      }
    });
  }

  onSprintChange(sprintId: number) {
    this.selectedSprintId.set(sprintId);
    this.loadReport();
  }

  private loadReport() {
    const sprintId = this.selectedSprintId();
    if (this.developerId && sprintId) {
      this.reportService.getDeveloperSprintReport(this.developerId, sprintId)
        .subscribe(data => this.report.set(data));
    }
  }

  goBack() {
    this.router.navigate(['/reports']);
  }
}
