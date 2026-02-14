import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-empty-data-chart-replacement',
  templateUrl: './empty-data-chart-replacement.component.html',
  styleUrls: ['./empty-data-chart-replacement.component.scss'],
})
export class EmptyDataChartReplacementComponent {
  @Input() type: string;
  @Input() message: string;

  constructor() {}
}
