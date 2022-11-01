// Generated by ScalaTS 0.5.9: https://scala-ts.github.io/scala-ts/

export interface WorkloadsChildren {
  id: string;
  name: string;
  display_name: string;
  domain: string;
  high: number;
  medium: number;
  state: string;
  privileged: boolean;
}

export function isWorkloadsChildren(v: any): v is WorkloadsChildren {
  return (
    ((typeof v['id']) === 'string') &&
    ((typeof v['name']) === 'string') &&
    ((typeof v['display_name']) === 'string') &&
    ((typeof v['domain']) === 'string') &&
    ((typeof v['high']) === 'number') &&
    ((typeof v['medium']) === 'number') &&
    ((typeof v['state']) === 'string') &&
    ((typeof v['privileged']) === 'boolean')
  );
}