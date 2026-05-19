import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { Sprint, Team } from '../../core/models';
import { TeamService } from '../../core/services/team.service';
import { SprintService } from '../../core/services/sprint.service';

export interface SprintDialogData {
  sprint: Sprint | null;
  teams: Team[];
}

export interface SprintDialogResult {
  mode: 'single' | 'pip';
  sprints: Partial<Sprint>[];
}

@Component({
  selector: 'app-sprint-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatButtonModule, MatSelectModule, MatRadioModule
  ],
  template: `
    @if (data.sprint) {
      <h2 mat-dialog-title>Edit Sprint</h2>
      <form [formGroup]="editForm" (ngSubmit)="saveEdit()">
        <mat-dialog-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Team</mat-label>
            <mat-select formControlName="teamId">
              @for (team of teams(); track team.id) {
                <mat-option [value]="team.id">{{ team.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="sp" formControlName="startDate">
            <mat-datepicker-toggle matIconSuffix [for]="sp"></mat-datepicker-toggle>
            <mat-datepicker #sp></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="ep" formControlName="endDate">
            <mat-datepicker-toggle matIconSuffix [for]="ep"></mat-datepicker-toggle>
            <mat-datepicker #ep></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Velocity (%)</mat-label>
            <input matInput type="number" formControlName="velocity" min="0" max="100">
          </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="editForm.invalid">Save</button>
        </mat-dialog-actions>
      </form>
    } @else {
      <h2 mat-dialog-title>New Sprint</h2>
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Team</mat-label>
          <mat-select [(value)]="selectedTeamId" (selectionChange)="onTeamChange()">
            @for (team of teams(); track team.id) {
              <mat-option [value]="team.id">{{ team.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (selectedTeamId) {
          <div class="mode-selection">
            <mat-radio-group [value]="createMode" (change)="createMode = $event.value; onModeChange()">
              <mat-radio-button value="single">Single Sprint</mat-radio-button>
              <mat-radio-button value="pip">Full PIP (4 sprints)</mat-radio-button>
            </mat-radio-group>
          </div>
        }

        @if (createMode === 'single' && selectedTeamId) {
          <form [formGroup]="singleForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="s1" formControlName="startDate">
              <mat-datepicker-toggle matIconSuffix [for]="s1"></mat-datepicker-toggle>
              <mat-datepicker #s1></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="e1" formControlName="endDate">
              <mat-datepicker-toggle matIconSuffix [for]="e1"></mat-datepicker-toggle>
              <mat-datepicker #e1></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Velocity (%)</mat-label>
              <input matInput type="number" formControlName="velocity" min="0" max="100">
            </mat-form-field>
          </form>
        }

        @if (createMode === 'pip' && selectedTeamId) {
          <div class="pip-summary">
            <h3>{{ pipLabel() }}</h3>
      <mat-form-field appearance="outline" class="full-width">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="ps" [formControl]="pipStartControl">
              <mat-datepicker-toggle matIconSuffix [for]="ps"></mat-datepicker-toggle>
              <mat-datepicker #ps></mat-datepicker>
            </mat-form-field>
            @for (s of pipSprints(); track $index; let i = $index) {
              <div class="pip-sprint-row">
                <strong>{{ s.name }}</strong>
                <span>{{ s.displayStart }} &rarr; {{ s.displayEnd }}</span>
                <span class="pip-duration">{{ i < 3 ? '2 weeks' : '1 week' }}</span>
              </div>
            }
            <mat-form-field appearance="outline" class="full-width" style="margin-top: 12px;">
              <mat-label>Velocity (%) for all sprints</mat-label>
              <input matInput type="number" [value]="pipVelocity" min="0" max="100"
                     (input)="pipVelocity = +$any($event.target).value">
            </mat-form-field>
          </div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        @if (createMode === 'single') {
          <button mat-flat-button color="primary" (click)="saveSingle()" [disabled]="singleForm.invalid">Create</button>
        }
        @if (createMode === 'pip') {
          <button mat-flat-button color="primary" (click)="savePip()" [disabled]="!selectedTeamId">Create PIP</button>
        }
      </mat-dialog-actions>
    }
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 8px; }
    .mode-selection {
      display: flex; gap: 24px; margin-bottom: 16px;
      mat-radio-button { font-size: 14px; }
    }
    .pip-summary h3 { margin: 0 0 12px; color: var(--color-gold, #8F7237); }
    .pip-sprint-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 12px; margin-bottom: 4px;
      background: var(--color-bg-alt, #f3f1ec); border-radius: 6px;
      font-size: 13px;
    }
    .pip-sprint-row strong { min-width: 200px; }
    .pip-duration { color: var(--color-text-light, #7a7670); font-style: italic; }
  `]
})
export class SprintFormDialogComponent implements OnInit {
  data = inject<SprintDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<SprintFormDialogComponent>);
  private fb = inject(FormBuilder);
  private teamService = inject(TeamService);
  private sprintService = inject(SprintService);

  teams = signal<Team[]>([]);
  teamSprints = signal<Sprint[]>([]);
  selectedTeamId: number | null = null;
  createMode: 'single' | 'pip' = 'pip';
  pipVelocity: number | null = null;
  pipStartDate = signal<Date | null>(null);
  pipStartControl = this.fb.control<Date | null>(null);

  /** Matches "<team>_<yy>_PIP<n>_S<n>" and captures year, pip, sprint number. */
  private readonly NAME_RE = /_(\d{2})_PIP(\d+)_S(\d+)\b/;

  editForm: FormGroup = this.fb.group({
    name: [this.data.sprint?.name || '', Validators.required],
    teamId: [this.data.sprint?.teamId || null],
    startDate: [this.data.sprint?.startDate ? new Date(this.data.sprint.startDate) : null, Validators.required],
    endDate: [this.data.sprint?.endDate ? new Date(this.data.sprint.endDate) : null, Validators.required],
    velocity: [this.data.sprint?.velocity || null]
  });

  singleForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    startDate: [null, Validators.required],
    endDate: [null, Validators.required],
    velocity: [null]
  });

  pipLabel = computed(() => {
    const team = this.teams().find(t => t.id === this.selectedTeamId);
    if (!team) return '';
    const { year, pip } = this.nextPipIdentity();
    return `${team.name}_${this.pad2(year)}_PIP${pip}`;
  });

  pipSprints = computed(() => {
    const team = this.teams().find(t => t.id === this.selectedTeamId);
    const startDate = this.pipStartDate();
    if (!team || !startDate) return [];
    const { year, pip } = this.nextPipIdentity();
    const prefix = `${team.name}_${this.pad2(year)}_PIP${pip}`;
    const startHour = this.getTeamStartHour();

    const sprints: { name: string; startDate: string; endDate: string; displayStart: string; displayEnd: string }[] = [];
    let current = new Date(startDate);

    for (let i = 1; i <= 4; i++) {
      const weeks = this.sprintWeeks(i);
      const start = new Date(current);
      const end = new Date(current);
      end.setDate(end.getDate() + weeks * 7);
      sprints.push({
        name: `${prefix}_S${i}`,
        startDate: this.toTimestamp(start, startHour),
        endDate: this.toTimestamp(end, startHour),
        displayStart: this.formatDisplayDate(start),
        displayEnd: this.formatDisplayDate(end)
      });
      current = new Date(end);
    }
    return sprints;
  });

  ngOnInit() {
    if (this.data.teams?.length) {
      this.teams.set(this.data.teams);
    } else {
      this.teamService.findAll().subscribe(t => this.teams.set(t));
    }
    if (this.data.sprint?.teamId) {
      this.selectedTeamId = this.data.sprint.teamId;
    }
    this.pipStartControl.valueChanges.subscribe(d => this.pipStartDate.set(d ?? null));
    this.singleForm.get('startDate')!.valueChanges.subscribe(d => this.recomputeSingleEndDate(d));
  }

  onTeamChange() {
    if (this.selectedTeamId) {
      this.sprintService.findByTeamId(this.selectedTeamId).subscribe(sprints => {
        this.teamSprints.set(sprints);
        const latest = this.latestSprint(sprints);
        this.pipVelocity = latest?.velocity ?? null;
        this.pipStartControl.setValue(this.getNextStartDate());
        this.prefillSingle();
      });
    }
  }

  onModeChange() {
    if (this.createMode === 'single') {
      this.prefillSingle();
    }
  }

  private getTeamStartHour(): string {
    const team = this.teams().find(t => t.id === this.selectedTeamId);
    return team?.startHour || '09:30';
  }

  private pad2(n: number): string {
    return String(n).padStart(2, '0');
  }

  /** Last two digits of a date's year, as a number. */
  private yearOf(d: Date): number {
    return +d.getFullYear().toString().slice(-2);
  }

  /** Sprints 1-3 last 2 weeks, sprint 4 lasts 1 week. */
  private sprintWeeks(sprintNum: number): number {
    return sprintNum === 4 ? 1 : 2;
  }

  /** Parses a sprint name into its (year, pip, sprint) parts, or null. */
  private parseSprintName(name: string | null | undefined): { year: number; pip: number; sprint: number } | null {
    const m = name?.match(this.NAME_RE);
    return m ? { year: +m[1], pip: +m[2], sprint: +m[3] } : null;
  }

  /** The sprint of the team that ends the latest (furthest in the future). */
  private latestSprint(sprints: Sprint[]): Sprint | null {
    if (!sprints.length) return null;
    return sprints.reduce((a, b) =>
      new Date(b.endDate).getTime() > new Date(a.endDate).getTime() ? b : a);
  }

  /** Start date of the next sprint: end date of the latest sprint, else next Monday. */
  private getNextStartDate(): Date {
    const latest = this.latestSprint(this.teamSprints());
    if (latest) {
      const next = new Date(latest.endDate);
      next.setHours(0, 0, 0, 0);
      return next;
    }
    const today = new Date();
    const day = today.getDay();
    const daysUntilMonday = day === 0 ? 1 : (8 - day);
    today.setDate(today.getDate() + daysUntilMonday);
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /** Name parts of the next single sprint, derived from the latest sprint. */
  private nextSingleIdentity(startDate: Date): { name: string } {
    const team = this.teams().find(t => t.id === this.selectedTeamId)!;
    const startYear = this.yearOf(startDate);
    const parsed = this.parseSprintName(this.latestSprint(this.teamSprints())?.name);
    let year: number, pip: number, sprint: number;
    if (!parsed) {
      year = startYear; pip = 1; sprint = 1;
    } else if (parsed.sprint < 4) {
      year = startYear; pip = parsed.pip; sprint = parsed.sprint + 1;
    } else {
      year = startYear; sprint = 1;
      pip = startYear === parsed.year ? parsed.pip + 1 : 1;
    }
    return { name: `${team.name}_${this.pad2(year)}_PIP${pip}_S${sprint}` };
  }

  /** Year and PIP number of the next full PIP, derived from the latest sprint. */
  private nextPipIdentity(): { year: number; pip: number } {
    const start = this.pipStartDate() ?? this.getNextStartDate();
    const startYear = this.yearOf(start);
    const parsed = this.parseSprintName(this.latestSprint(this.teamSprints())?.name);
    if (!parsed) return { year: startYear, pip: 1 };
    return { year: startYear, pip: startYear === parsed.year ? parsed.pip + 1 : 1 };
  }

  private prefillSingle() {
    const team = this.teams().find(t => t.id === this.selectedTeamId);
    if (!team) return;
    const startDate = this.getNextStartDate();
    const { name } = this.nextSingleIdentity(startDate);
    // endDate is recomputed by the startDate valueChanges listener.
    this.singleForm.patchValue({ name, startDate, velocity: this.pipVelocity });
  }

  /** Recomputes the single-sprint end date from its start date and the rule. */
  private recomputeSingleEndDate(start: Date | null) {
    if (!(start instanceof Date) || isNaN(start.getTime())) return;
    const parsed = this.parseSprintName(this.singleForm.get('name')!.value);
    const weeks = this.sprintWeeks(parsed?.sprint ?? 0);
    const end = new Date(start);
    end.setDate(end.getDate() + weeks * 7);
    this.singleForm.get('endDate')!.setValue(end, { emitEvent: false });
  }

  /** Formats a date + startHour as ISO local datetime: "2026-04-27T09:30:00" */
  private toTimestamp(d: Date, startHour: string): string {
    const [h, m] = startHour.split(':').map(Number);
    const date = new Date(d);
    date.setHours(h, m, 0, 0);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(h).padStart(2, '0');
    const mi = String(m).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`;
  }

  /** Formats a Date for display: "27/04/2026" */
  private formatDisplayDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }

  /** Converts a date picker Date value to a timestamp string with team startHour */
  private dateToTimestamp(val: any): string {
    if (val instanceof Date) {
      return this.toTimestamp(val, this.getTeamStartHour());
    }
    return val;
  }

  /** For edit mode: get the team from the form's teamId */
  private getEditTeamStartHour(): string {
    const teamId = this.editForm.value.teamId;
    const team = this.teams().find(t => t.id === teamId);
    return team?.startHour || '09:30';
  }

  saveEdit() {
    if (this.editForm.valid) {
      const val = this.editForm.value;
      const startHour = this.getEditTeamStartHour();
      const result: SprintDialogResult = {
        mode: 'single',
        sprints: [{
          name: val.name,
          teamId: val.teamId,
          startDate: val.startDate instanceof Date ? this.toTimestamp(val.startDate, startHour) : val.startDate,
          endDate: val.endDate instanceof Date ? this.toTimestamp(val.endDate, startHour) : val.endDate,
          velocity: val.velocity
        }]
      };
      this.dialogRef.close(result);
    }
  }

  saveSingle() {
    if (this.singleForm.valid) {
      const val = this.singleForm.value;
      const startHour = this.getTeamStartHour();
      const result: SprintDialogResult = {
        mode: 'single',
        sprints: [{
          name: val.name,
          teamId: this.selectedTeamId!,
          startDate: val.startDate instanceof Date ? this.toTimestamp(val.startDate, startHour) : val.startDate,
          endDate: val.endDate instanceof Date ? this.toTimestamp(val.endDate, startHour) : val.endDate,
          velocity: val.velocity
        }]
      };
      this.dialogRef.close(result);
    }
  }

  savePip() {
    const result: SprintDialogResult = {
      mode: 'pip',
      sprints: this.pipSprints().map(s => ({
        name: s.name,
        teamId: this.selectedTeamId!,
        startDate: s.startDate,
        endDate: s.endDate,
        velocity: this.pipVelocity
      }))
    };
    this.dialogRef.close(result);
  }
}
