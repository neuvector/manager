import { Node } from '@common/types/network-activities/node';
import { Edge } from '@common/types/network-activities/edge';
import { Blacklist } from '@common/types/network-activities/blacklist';

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  blacklist?: Blacklist;
}

export interface GraphDataSet {
  nodes: Node[];
  edges: Edge[];
}
