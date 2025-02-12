// Generated by ScalaTS 0.5.9: https://scala-ts.github.io/scala-ts/

import { Array, isArray } from './Array';

export interface PolicyCoverage {
  learnt: Array;
  others: Array;
}

export function isPolicyCoverage(v: any): v is PolicyCoverage {
  return (
    v['learnt'] && isArray(v['learnt']) && v['others'] && isArray(v['others'])
  );
}
