import {
  Directive,
  ElementRef,
  Input,
  HostListener,
  OnInit,
} from '@angular/core';

@Directive({
  selector: '[appTwoWayInfiniteScroll]',
  standalone: false,
})
export class TwoWayInfiniteScrollDirective implements OnInit {
  @Input() ctx: any;
  element!: HTMLDivElement;

  constructor(private elementRef: ElementRef) {
    console.log('appTwoWayInfiniteScroll is working...');
  }

  ngOnInit(): void {
    this.element = this.elementRef.nativeElement;
    console.log('this.element', this.element, this.ctx);
  }

  @HostListener('scroll', ['$event'])
  infinityScroll(): void {
    this.scroll();
    // this.throttled(20, this.scroll);
    // this.debounced(1, scroll);
    // scroll();
  }

  private closeDetails = () => {
    document.getElementsByName('secEvt').forEach((elem: any) => {
      elem.checked = false;
    });
  };

  private scroll = () => {
    let a = this.element.scrollTop;
    let b = this.element.scrollHeight - this.element.clientHeight;

    let percentOfScroll = a / b;

    if (percentOfScroll > 0.9) {
      if (this.ctx.array.length - this.ctx.begin > this.ctx.limit) {
        this.ctx.begin += 9;
        this.ctx.page++;
        // console.log('page: ', this.ctx.page)
        // this.element.scrollTop -= 20;
        this.closeDetails();
      }
    } else if (percentOfScroll < 0.2 && percentOfScroll > 0) {
      if (this.ctx.begin !== 0) {
        // console.log('this.ctx.begin - 1');
        this.ctx.begin -= 9;
        this.ctx.page--;
        // console.log('page: ', this.ctx.page)
        // this.element.scrollTop += 20;
        this.closeDetails();
      }
    } else if (percentOfScroll == 0) {
      this.ctx.begin = 0;
    }
    let targetIndex =
      this.ctx.openedIndex - 9 * (this.ctx.page - this.ctx.openedPage);
    if (targetIndex < 30 && targetIndex >= 0) {
      document.getElementById(`sec-${targetIndex}`)!['checked'] = true;
    }
  };

  private throttled = (function (delay, fn) {
    let lastCall = 0;
    return function (delay, fn, ...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return fn(...args);
    };
  })();

  private debounced = (function (delay, fn) {
    let timerId;
    return function (delay, fn, ...args) {
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        fn(...args);
        timerId = null;
      }, delay);
    };
  })();
}
