import { Component, Input, OnInit } from '@angular/core';
import { Cluster, ClusterSummary } from '@common/types';
import { MultiClusterService } from '@services/multi-cluster.service';


@Component({
  standalone: false,
  selector: 'app-multi-cluster-details',
  templateUrl: './multi-cluster-details.component.html',
  styleUrls: ['./multi-cluster-details.component.scss'],
  
})
export class MultiClusterDetailsComponent implements OnInit {
  @Input() gridHeight!: number;
  summary!: ClusterSummary;
  selectedCluster!: Cluster;

  constructor(private multiClusterService: MultiClusterService) {}

  ngOnInit(): void {
    this.multiClusterService.selectedCluster$.subscribe(cluster => {
      if (cluster) {
        this.selectedCluster = cluster;
      }
    });
    this.multiClusterService.selectedClusterSummary$.subscribe(summary => {
      if (summary) {
        this.summary = summary;
      }
    });
  }
}
