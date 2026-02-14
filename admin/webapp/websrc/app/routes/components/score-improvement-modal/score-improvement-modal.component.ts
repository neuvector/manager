import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GlobalVariable } from '@common/variables/global.variable';
import {
  ScoreImprovementModalService,
  ScoreImprovementModalTemplate,
} from '@services/score-improvement-modal.service';
import { ScoreImprovementExposureViewComponent } from './partial/score-improvement-exposure-view/score-improvement-exposure-view.component';

@Component({
  standalone: false,
  selector: 'app-score-improvement-modal',
  templateUrl: './score-improvement-modal.component.html',
  styleUrls: ['./score-improvement-modal.component.scss'],
})
export class ScoreImprovementModalComponent implements OnInit {
  @ViewChild(ScoreImprovementExposureViewComponent)
  exposureView!: ScoreImprovementExposureViewComponent;
  template!: ScoreImprovementModalTemplate;
  isGlobalUser!: boolean;

  constructor(
    private dialogRef: MatDialogRef<ScoreImprovementModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private scoreImprovementModalService: ScoreImprovementModalService
  ) {}

  ngOnInit(): void {
    this.isGlobalUser = GlobalVariable.user?.global_permissions.length > 0;
    this.scoreImprovementModalService.reset();
    this.scoreImprovementModalService.scoreInfo = this.data.scoreInfo;
    this.scoreImprovementModalService.template$.subscribe(template => {
      this.template = template;
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  finish() {
    this.scoreImprovementModalService.go('completed');
  }

  next() {
    if (this.exposureView) this.exposureView.next();
  }

  done() {
    this.scoreImprovementModalService.go('general');
  }
}
