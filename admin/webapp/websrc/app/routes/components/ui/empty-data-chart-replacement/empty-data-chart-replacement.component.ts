import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-empty-data-chart-replacement',
  templateUrl: './empty-data-chart-replacement.component.html',
  styleUrls: ['./empty-data-chart-replacement.component.scss']
})
export class EmptyDataChartReplacementComponent implements OnInit {

  @Input() type: string;
  @Input() message: string;

  constructor() { }

  ngOnInit(): void {
  }

}
