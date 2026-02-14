import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ComplianceProfileService } from '@routes/compliance-profile/compliance-profile.service';
import { iconMap } from '../compliance-profile-assets-table.component';

@Component({
  standalone: false,
  selector: 'app-edit-template-dialog',
  templateUrl: './edit-template-dialog.component.html',
  styleUrls: ['./edit-template-dialog.component.scss'],
})
export class EditTemplateDialogComponent implements OnInit {
  regulations = ['NIST', 'HIPAA', 'GDPR', 'PCI'];
  available: string[] = [];
  applied: string[] = [];
  name!: string;

  constructor(
    private complianceProfileService: ComplianceProfileService,
    public dialogRef: MatDialogRef<EditTemplateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit(): void {
    this.name = this.data.name;
    if (this.name.charAt(0) === '_') {
      this.name = this.name.substring(1);
      this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
    }
    this.applied = this.data.tags || [];
    this.filterApplied();
  }

  getAssetIcon(name: string) {
    if (name in iconMap) {
      return iconMap[name];
    }
    return 'fa fa-building';
  }

  filterApplied() {
    this.available = this.regulations.filter(
      tag => !this.applied.includes(tag)
    );
  }

  filterAvailable() {
    this.applied = this.regulations.filter(
      tag => !this.available.includes(tag)
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  add(tag) {
    this.applied.push(tag);
    this.filterApplied();
  }

  remove(tag) {
    this.available.push(tag);
    this.filterAvailable();
  }

  save() {
    const payload = {
      name: this.data.name,
      tags: this.applied,
    };
    this.complianceProfileService
      .saveTemplates(payload)
      .subscribe(() => this.dialogRef.close(this.applied));
  }
}
