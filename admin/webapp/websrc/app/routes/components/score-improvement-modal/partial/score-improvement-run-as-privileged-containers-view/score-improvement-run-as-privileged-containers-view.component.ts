import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ErrorResponse, Workload } from '@common/types';
import { arrayToCsv } from '@common/utils/common.utils';
import { ContainersGridComponent } from '@components/containers-grid/containers-grid.component';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { ContainersService, WorkloadRow } from '@services/containers.service';
import { ScoreImprovementModalService } from '@services/score-improvement-modal.service';
import { saveAs } from 'file-saver';
import { tap } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-score-improvement-run-as-privileged-containers-view',
  templateUrl:
    './score-improvement-run-as-privileged-containers-view.component.html',
  styleUrls: [
    './score-improvement-run-as-privileged-containers-view.component.scss',
  ],
})
export class ScoreImprovementRunAsPrivilegedContainersViewComponent implements OnInit {
  _containersGrid!: ContainersGridComponent;
  @ViewChild(ContainersGridComponent) set containersGrid(
    grid: ContainersGridComponent
  ) {
    this._containersGrid = grid;
    if (this._containersGrid) {
      this._containersGrid.selectedContainer$.subscribe(container => {
        if (container) this.selectedContainer = container;
      });
    }
  }
  get containersGrid() {
    return this._containersGrid;
  }
  @Input() isGlobalUser!: boolean;
  get score() {
    return this.scoreImprovementModalService.score;
  }
  projectedScore!: number;
  filter = new FormControl('');
  containers!: Workload[];
  selectedContainer!: WorkloadRow;

  constructor(
    private scoreImprovementModalService: ScoreImprovementModalService,
    private quickFilterService: QuickFilterService,
    private containersService: ContainersService
  ) {}

  ngOnInit(): void {
    this.filter.valueChanges
      .pipe(
        tap((value: string | null) =>
          this.quickFilterService.setTextInput(value || '')
        )
      )
      .subscribe();
    this.getPredictionScores();
    this.getWorkloads();
  }

  exportCSV() {
    const workloads4Csv = this.containersService.makeWorkloadCSVData(
      this.containers
    );
    let csv = arrayToCsv(workloads4Csv);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'Workloads_Privileged.csv');
  }

  getWorkloads() {
    this.containersService.resetContainers();
    this.containersService.getContainers().subscribe({
      next: workloads => {
        this.containers = workloads
          .filter(this.runAsPrivilegedFilter)
          .filter(w => w.state !== 'exit' && !w.platform_role);
        this.containersService.displayContainers =
          this.containersService.formatScannedWorkloads(this.containers);
      },
      error: ({ error }: { error: ErrorResponse }) => {},
    });
  }

  getPredictionScores() {
    const metrics = JSON.parse(
      JSON.stringify(this.scoreImprovementModalService.newMetrics())
    );
    metrics.workloads.privileged_wls = 0;
    this.scoreImprovementModalService
      .calculateScoreData(metrics)
      .subscribe(scores => {
        this.projectedScore = scores.security_scores.security_risk_score;
      });
  }

  private runAsPrivilegedFilter = (w: Workload) => {
    return (
      w.children &&
      w.children.length > 0 &&
      w.children.filter(child => child.privileged).length > 0
    );
  };
}
