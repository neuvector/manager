import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ErrorResponse } from '@common/types';
import { RiskReportGridComponent } from '@components/risk-report-grid/risk-report-grid.component';
import { RiskReportsService } from '@services/risk-reports.service';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';


@Component({
  standalone: false,
  selector: 'app-risk-reports',
  templateUrl: './risk-reports.component.html',
  styleUrls: ['./risk-reports.component.scss'],
  
})
export class RiskReportsComponent implements OnInit, OnDestroy {
  @ViewChild(RiskReportGridComponent) riskReportGrid!: RiskReportGridComponent;
  refreshing$ = new Subject();
  error!: string;
  loaded = false;
  isPrinting: boolean = false;
  private _switchClusterSubscription;

  get riskReports() {
    return this.riskReportsService.riskReports;
  }

  constructor(
    private riskReportsService: RiskReportsService,
    private multiClusterService: MultiClusterService
  ) {}

  ngOnInit(): void {
    this.getRiskReports();
    //refresh the page when it switched to a remote cluster
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  print = () => {
    this.isPrinting = true;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        this.isPrinting = false;
      }, 1000);
    }, 1000);
  };

  refresh(): void {
    this.refreshing$.next(true);
    this.getRiskReports();
  }

  getRiskReports(): void {
    this.riskReportsService.resetReports();
    this.riskReportsService
      .getRiskReports()
      .pipe(
        finalize(() => {
          this.loaded = true;
          this.refreshing$.next(false);
        })
      )
      .subscribe({
        next: res => {
          this.riskReportsService.riskReports = res;
          this.riskReportsService.displayReports =
            this.riskReportsService.formatReports(
              this.riskReportsService.riskReports
            );
          this.error = '';
          if (!this.loaded) this.loaded = true;
        },
        error: ({ error }: { error: ErrorResponse }) => {},
      });
  }
}
