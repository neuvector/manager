import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-vulnerabilities-grid-feed-rating-cell',
  templateUrl: './vulnerabilities-grid-feed-rating-cell.component.html',
  styleUrls: ['./vulnerabilities-grid-feed-rating-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VulnerabilitiesGridFeedRatingCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  feed_rating!: string;
  labelCode!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.feed_rating = this.params.data.feed_rating;
    this.labelCode = MapConstant.colourMap[this.feed_rating];
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
