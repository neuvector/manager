import { Component, OnInit, Input } from '@angular/core';
import { DashboardService } from '@common/services/dashboard.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { ScoreImprovementModalComponent } from '@components/score-improvement-modal/score-improvement-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { InternalSystemInfo } from '@common/types';

@Component({
  selector: 'app-score-instruction',
  templateUrl: './score-instruction.component.html',
  styleUrls: ['./score-instruction.component.scss'],
})
export class ScoreInstructionComponent implements OnInit {
  @Input() scoreInfo!: InternalSystemInfo;

  constructor(
    public dashboardService: DashboardService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {}

  isPoorScore = (): boolean => {
    return (
      this.scoreInfo.score.securityRiskScore > GlobalConstant.SCORE_LEVEL.FAIR
    );
  };

  openScoreImprovementConsole = () => {
    const scoreImpovementDialogRef = this.dialog.open(
      ScoreImprovementModalComponent,
      {
        data: {
          scoreInfo: this.scoreInfo,
        },

        panelClass: 'mat-dialog-container-full',
        width: '80vw',
        height: '685px',
      }
    );
    scoreImpovementDialogRef.afterClosed().subscribe(result => {
      this.dashboardService.refresh();
    });
  };
}
