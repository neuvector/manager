import { Component, OnInit } from '@angular/core';
import { Options, LabelType } from '@angular-slider/ngx-slider';
import { DatePipe } from '@angular/common';
import { SecurityEventsService } from '@services/security-events.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-date-slider',
  templateUrl: './date-slider.component.html',
  styleUrls: ['./date-slider.component.scss'],
})
export class DateSliderComponent implements OnInit {
  minValue: number;
  maxValue: number;
  options: Options;

  constructor(
    private datePipe: DatePipe,
    private securityEventsService: SecurityEventsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    let nowDateText = this.datePipe.transform(new Date(), 'MMM dd, yyyy');
    this.minValue =
      this.securityEventsService.cachedSecurityEvents[
        this.securityEventsService.cachedSecurityEvents.length - 1
      ].reportedTimestamp * 1000;
    this.maxValue = new Date().getTime();
    this.options = {
      floor:
        this.securityEventsService.cachedSecurityEvents[
          this.securityEventsService.cachedSecurityEvents.length - 1
        ].reportedTimestamp * 1000,
      ceil: new Date().getTime(),
      step: 1000 * 3600 * 24,
      enforceStep: false,
      translate: (value: number, label: LabelType): string => {
        return Math.floor(value / 60000) ===
          Math.floor(new Date().getTime() / 60000)
          ? this.translate.instant('general.NOW')
          : this.datePipe.transform(value, 'MMM dd, yyyy')!;
      },
    };
  }

  filterByDate = () => {
    console.log(this.minValue, this.maxValue);
    this.securityEventsService.displayedSecurityEvents =
      this.securityEventsService.cachedSecurityEvents.filter(event => {
        return (
          event.reportedTimestamp * 1000 >= this.minValue &&
          event.reportedTimestamp * 1000 <= this.maxValue
        );
      });
    this.securityEventsService.prepareContext4TwoWayInfinityScroll();
  };

  relocateFocus = () => {
    const listElem = document.getElementById('sec-event-list');
    listElem!.scrollTop = 0;
  };
}
