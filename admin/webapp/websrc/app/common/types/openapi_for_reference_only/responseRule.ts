import { ClusterEventCondition } from './clusterEventCondition';

export interface ResponseRule {
  id: number;
  event: string;
  comment: string;
  group: string;
  conditions: ClusterEventCondition[];
  actions: string[];
  webhooks: string[];
  disable: boolean;
  cfg_type: string;
}
