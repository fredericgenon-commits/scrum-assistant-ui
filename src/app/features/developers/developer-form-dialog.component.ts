import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Developer, Team } from '../../core/models';
import { TeamService } from '../../core/services/team.service';

@Component({
  selector: 'app-developer-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Developer' : 'New Developer' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Username</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Display Name</mat-label>
          <input matInput formControlName="displayName">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email">
          @if (form.get('email')?.hasError('email')) {
            <mat-error>Invalid email format</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Jira Key</mat-label>
          <input matInput formControlName="jiraKey">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Occupation (%)</mat-label>
          <input matInput type="number" formControlName="occupation" min="0" max="100" placeholder="e.g. 70">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Team</mat-label>
          <mat-select formControlName="teamId">
            <mat-option [value]="null">None</mat-option>
            @for (team of teams(); track team.id) {
              <mat-option [value]="team.id">{{ team.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 8px; }`]
})
export class DeveloperFormDialogComponent implements OnInit {
  data = inject<Developer | null>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<DeveloperFormDialogComponent>);
  private fb = inject(FormBuilder);
  private teamService = inject(TeamService);

  teams = signal<Team[]>([]);
  form: FormGroup = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    displayName: [this.data?.displayName || ''],
    email: [this.data?.email || null, Validators.email],
    jiraKey: [this.data?.jiraKey || ''],
    occupation: [this.data?.occupation != null ? Math.round(this.data.occupation * 100) : null],
    teamId: [this.data?.teamId || null]
  });

  ngOnInit() {
    this.teamService.findAll().subscribe(teams => this.teams.set(teams));
  }

  save() {
    if (this.form.valid) {
      const val = this.form.value;
      const occPercent = val.occupation;
      this.dialogRef.close({
        ...val,
        occupation: occPercent != null && occPercent !== '' ? occPercent / 100 : null
      });
    }
  }
}
