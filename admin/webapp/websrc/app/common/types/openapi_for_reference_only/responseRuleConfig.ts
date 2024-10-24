import { ClusterEventCondition } from './clusterEventCondition';

export interface ResponseRuleConfig {
  id: number;
  comment?: string;
  group?: string;
  event?: string;
  conditions?: ClusterEventCondition[];
  actions?: string[];
  webhooks?: string[];
  disable?: boolean;
  cfg_type: string;
}
