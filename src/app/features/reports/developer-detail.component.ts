import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TimeLogReport, TimeLogDetail } from '../../core/models';
import { ReportService } from '../../core/services/report.service';
import { minutesToDisplay } from '../../shared/utils/time-format.util';

type DetailLevel = 'ticket' | 'requirement' | 'project' | 'deliveryMethod';

interface GroupedRow {
  label: string;
  sublabel: string;
  minutes: number;
}

@Component({
  selector: 'app-developer-detail',
  standalone: true,
  imports: [
    MatCardModule, MatTableModule, MatButtonToggleModule,
    MatButtonModule, MatIconModule, FormsModule, DecimalPipe
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ developerName() }}</h1>
            <p class="subtitle">Time Log Details</p>
          </div>
        </div>
        <div class="total-badge">
          <span class="total-label">Total</span>
          <span class="total-value">{{ formatMinutes(totalMinutes()) }}</span>
        </div>
      </div>

      <!-- Detail level toggle -->
      <div class="level-selector">
        <span class="level-label">Group by:</span>
        <mat-button-toggle-group [(value)]="detailLevel" (change)="onLevelChange()">
          <mat-button-toggle value="ticket">Ticket</mat-button-toggle>
          <mat-button-toggle value="requirement">Requirement</mat-button-toggle>
          <mat-button-toggle value="project">Project</mat-button-toggle>
          <mat-button-toggle value="deliveryMethod">Delivery Method</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <!-- Grouped data table -->
      <div class="card-elevated">
        <table mat-table [dataSource]="groupedRows()">
          <ng-container matColumnDef="label">
            <th mat-header-cell *matHeaderCellDef>{{ columnTitle() }}</th>
            <td mat-cell *matCellDef="let row">
              <strong>{{ row.label }}</strong>
              @if (row.sublabel) {
                <br><span class="sublabel">{{ row.sublabel }}</span>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="time">
            <th mat-header-cell *matHeaderCellDef>Time Logged</th>
            <td mat-cell *matCellDef="let row">
              <div class="time-cell">
                <span class="time-value">{{ formatMinutes(row.minutes) }}</span>
                <div class="time-bar-mini">
                  <div class="time-bar-fill"
                       [style.width.%]="maxRowMinutes() > 0 ? (row.minutes / maxRowMinutes() * 100) : 0">
                  </div>
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="percentage">
            <th mat-header-cell *matHeaderCellDef>%</th>
            <td mat-cell *matCellDef="let row">
              {{ totalMinutes() > 0 ? (row.minutes / totalMinutes() * 100 | number:'1.0-0') : 0 }}%
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['label', 'time', 'percentage']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['label', 'time', 'percentage']"></tr>
        </table>

        <!-- Total row -->
        <div class="total-row">
          <span>Total</span>
          <span class="total-row-value">{{ formatMinutes(totalMinutes()) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .subtitle {
        color: var(--color-text-light);
        font-size: 14px;
        margin-top: 2px;
      }
    }

    .total-badge {
      background: var(--color-badge-bg);
      color: white;
      padding: 14px 28px;
      border-radius: 4px;
      text-align: center;
      border: 1px solid var(--color-border);

      .total-label {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.6;
        font-weight: 500;
      }

      .total-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--color-gold);
        letter-spacing: -0.02em;
      }
    }

    .level-selector {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;

      .level-label {
        font-weight: 500;
        color: var(--color-text-light);
        font-size: 14px;
      }
    }

    .sublabel {
      font-size: 12px;
      color: var(--color-text-light);
    }

    .time-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 200px;

      .time-value {
        font-weight: 600;
        min-width: 60px;
        color: var(--color-text-heading);
      }
    }

    .time-bar-mini {
      flex: 1;
      height: 5px;
      border-radius: 3px;
      background: var(--color-border);
      min-width: 100px;

      .time-bar-fill {
        height: 100%;
        border-radius: 3px;
        background: linear-gradient(90deg, var(--color-bar-start), var(--color-bar-end));
        transition: width 0.4s ease;
      }
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 16px 24px;
      background: var(--color-total-row);
      font-weight: 600;
      border-top: 2px solid var(--color-border);
      color: var(--color-text);

      .total-row-value {
        color: var(--color-gold);
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
    }
  `]
})
export class DeveloperDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportService = inject(ReportService);

  report = signal<TimeLogReport | null>(null);
  detailLevel: DetailLevel = 'ticket';

  developerName = computed(() => this.report()?.developerName ?? '');
  totalMinutes = computed(() => this.report()?.totalMinutes ?? 0);

  groupedRows = computed<GroupedRow[]>(() => {
    const r = this.report();
    if (!r) return [];

    if (this.detailLevel === 'ticket') {
      return r.details.map(d => ({
        label: d.ticketKey,
        sublabel: d.summary,
        minutes: d.minutes
      }));
    }

    const map = new Map<string, number>();
    for (const d of r.details) {
      let key: string;
      switch (this.detailLevel) {
        case 'requirement': key = d.requirement || 'No Requirement'; break;
        case 'project': key = d.project || 'No Project'; break;
        case 'deliveryMethod': key = d.deliveryMethod || 'Other'; break;
      }
      map.set(key, (map.get(key) || 0) + d.minutes);
    }

    return Array.from(map.entries())
      .map(([label, minutes]) => ({ label, sublabel: '', minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  });

  maxRowMinutes = computed(() => Math.max(...this.groupedRows().map(r => r.minutes), 1));

  columnTitle = computed(() => {
    switch (this.detailLevel) {
      case 'ticket': return 'Ticket';
      case 'requirement': return 'Requirement';
      case 'project': return 'Project';
      case 'deliveryMethod': return 'Delivery Method';
    }
  });

  formatMinutes = minutesToDisplay;

  ngOnInit() {
    const devId = Number(this.route.snapshot.paramMap.get('id'));
    const teamId = Number(this.route.snapshot.queryParamMap.get('teamId'));
    const sprintId = Number(this.route.snapshot.queryParamMap.get('sprintId'));

    if (teamId && sprintId) {
      this.reportService.getTeamSprintReport(teamId, sprintId).subscribe(reports => {
        const found = reports.find(r => r.developerId === devId);
        if (found) this.report.set(found);
      });
    }
  }

  onLevelChange() {}

  goBack() {
    this.router.navigate(['/reports']);
  }
}
