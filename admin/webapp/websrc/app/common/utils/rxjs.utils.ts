import { defer, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
