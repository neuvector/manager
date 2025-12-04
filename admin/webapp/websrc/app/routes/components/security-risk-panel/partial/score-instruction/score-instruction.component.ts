import { Component, Input } from '@angular/core';
import { DashboardService } from '@common/services/dashboard.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { ScoreImprovementModalComponent } from '@components/score-improvement-modal/score-improvement-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { InternalSystemInfo } from '@common/types';


@Component({
  standalone: false,
  selector: 'app-score-instruction',
  templateUrl: './score-instruction.component.html',
  styleUrls: ['./score-instruction.component.scss'],
  
})
export class ScoreInstructionComponent {
  @Input() scoreInfo!: InternalSystemInfo;

  constructor(
    public dashboardService: DashboardService,
    private dialog: MatDialog
  ) {}

  isPoorScore = (): boolean => {
    return (
      this.scoreInfo.security_scores.security_risk_score >
      GlobalConstant.SCORE_LEVEL.FAIR
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
