import {
  ChangeDetectorRef,
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { AsyncSubject, Observable, Subject } from 'rxjs';
import { concatMapTo, takeUntil } from 'rxjs/operators';

export class ObserveContext<T> {
  $implicit!: T;
  appObserve!: T;
}

export class ErrorContext {
  $implicit!: Error;
}

@Directive({
  selector: '[appObserve]',
  standalone: false,
})
export class ObserveDirective<T> implements OnDestroy, OnInit {
  private errorRef!: TemplateRef<ErrorContext>;
  private loadingRef!: TemplateRef<null>;
  private unsubscribe = new Subject<boolean>();
  private init = new AsyncSubject<void>();

  constructor(
    private view: ViewContainerRef,
    private nextRef: TemplateRef<ObserveContext<T>>,
    private cd: ChangeDetectorRef
  ) {}

  @Input()
  set appObserve(source: Observable<T>) {
    if (!source) {
      return;
    }
    this.showBefore();
    this.unsubscribe.next(true);
    this.init.pipe(concatMapTo(source), takeUntil(this.unsubscribe)).subscribe(
      value => {
        this.view.clear();
        this.view.createEmbeddedView(this.nextRef, {
          $implicit: value,
          appObserve: value,
        });
        this.cd.markForCheck();
      },
      error => {
        if (this.errorRef) {
          this.view.clear();
          this.view.createEmbeddedView(this.errorRef, { $implicit: error });
          this.cd.markForCheck();
        }
      }
    );
  }

  @Input()
  set appObserveError(ref: TemplateRef<ErrorContext>) {
    this.errorRef = ref;
  }

  @Input()
  set appObserveLoading(ref: TemplateRef<null>) {
    this.loadingRef = ref;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next(true);
  }

  ngOnInit(): void {
    this.showBefore();
    this.init.next();
    this.init.complete();
  }

  private showBefore(): void {
    if (this.loadingRef) {
      this.view.clear();
      this.view.createEmbeddedView(this.loadingRef);
    }
  }
}
