import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { JiraTicket } from '../../core/models';

@Component({
  selector: 'app-jira-ticket-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Ticket' : 'New Ticket' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Key</mat-label>
          <input matInput formControlName="key" placeholder="PROJ-123">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Summary</mat-label>
          <input matInput formControlName="summary">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Requirement</mat-label>
          <input matInput formControlName="requirement">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Delivery Method</mat-label>
          <mat-select formControlName="deliveryMethod">
            <mat-option value="PROJECT">Project</mat-option>
            <mat-option value="IMPROVEMENT">Improvement</mat-option>
            <mat-option value="IT">IT</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project</mat-label>
          <input matInput formControlName="project">
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
export class JiraTicketFormDialogComponent {
  data = inject<JiraTicket | null>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<JiraTicketFormDialogComponent>);
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    key: [this.data?.key || '', Validators.required],
    summary: [this.data?.summary || ''],
    requirement: [this.data?.requirement || ''],
    deliveryMethod: [this.data?.deliveryMethod || 'PROJECT'],
    project: [this.data?.project || '']
  });

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
