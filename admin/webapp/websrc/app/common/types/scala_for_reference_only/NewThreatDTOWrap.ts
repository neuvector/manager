// Generated by ScalaTS 0.5.9: https://scala-ts.github.io/scala-ts/

import { Array, isArray } from './Array';

export interface NewThreatDTOWrap {
  threats: Array;
}

export function isNewThreatDTOWrap(v: any): v is NewThreatDTOWrap {
  return (
    (v['threats'] && isArray(v['threats']))
  );
}