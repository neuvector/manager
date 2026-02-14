import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ErrorResponse } from '@common/types';
import { EventsGridComponent } from '@components/events-grid/events-grid.component';
import { EventsService } from '@services/events.service';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  standalone: false,
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnInit, OnDestroy {
  @ViewChild(EventsGridComponent) eventsGrid!: EventsGridComponent;
  refreshing$ = new Subject();
  error!: string;
  loaded = false;
  private _switchClusterSubscription;

  get events() {
    return this.eventsService.events;
  }

  constructor(
    private eventsService: EventsService,
    private multiClusterService: MultiClusterService
  ) {}

  ngOnInit(): void {
    this.getEvents();
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

  refresh(): void {
    this.refreshing$.next(true);
    this.getEvents();
  }

  getEvents(): void {
    this.eventsService.resetEvents();
    this.eventsService
      .getEvents()
      .pipe(
        finalize(() => {
          this.loaded = true;
          this.refreshing$.next(false);
        })
      )
      .subscribe({
        next: res => {
          this.eventsService.events = res;
          this.eventsService.displayEvents = this.eventsService.formatEvents(
            this.eventsService.events
          );
          this.error = '';
          if (!this.loaded) this.loaded = true;
        },
        error: ({ error }: { error: ErrorResponse }) => {},
      });
  }
}
