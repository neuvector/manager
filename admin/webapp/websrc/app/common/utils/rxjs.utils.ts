import { defer, Observable, timer } from 'rxjs';
import { filter, switchMap, take, tap, timeout } from 'rxjs/operators';

export function tapOnce<T>(fn: (value) => void) {
  return (source: Observable<any>) =>
    defer(() => {
      let first = true;
      return source.pipe(
        tap<T>(payload => {
          if (first) {
            fn(payload);
          }
          first = false;
        })
      );
    });
}

export function pollUntilResult<T>(
  pollFn: () => Observable<T>,
  pred: (val: T) => boolean,
  period: number,
  to: number
): Observable<T> {
  return timer(0, period).pipe(
    switchMap(() => pollFn()),
    filter(pred),
    take(1),
    timeout(to)
  );
}
