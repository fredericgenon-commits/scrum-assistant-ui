import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Team, Developer } from '../../core/models';
import { DeveloperService } from '../../core/services/developer.service';

@Component({
  selector: 'app-team-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Team' : 'New Team' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Scrum Master</mat-label>
          <mat-select formControlName="scrumMasterId">
            <mat-option [value]="null">None</mat-option>
            @for (dev of developers(); track dev.id) {
              <mat-option [value]="dev.id">{{ dev.displayName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Time Log Threshold (minutes)</mat-label>
          <input matInput type="number" formControlName="timeLogThreshold">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Start Hour</mat-label>
          <input matInput type="time" formControlName="startHour">
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
export class TeamFormDialogComponent implements OnInit {
  data = inject<Team | null>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<TeamFormDialogComponent>);
  private fb = inject(FormBuilder);
  private developerService = inject(DeveloperService);

  developers = signal<Developer[]>([]);
  form: FormGroup = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    scrumMasterId: [this.data?.scrumMasterId || null],
    timeLogThreshold: [this.data?.timeLogThreshold || 360],
    startHour: [this.data?.startHour || '09:30']
  });

  ngOnInit() {
    this.developerService.findAll().subscribe(devs => this.developers.set(devs));
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
