export enum PopupState {
  onInit,
  onNode,
  onHost,
  onEdge,
  onGroupNode,
  onQuickSearch,
  onDomain,
  onActiveSession,
  onSniffer,
  onRule,
  onBlacklist,
  onAdvFilter,
}

export class ActivityState {
  constructor(state: PopupState) {
    this.state = state;
  }

  protected state: PopupState;

  transitTo = (state: PopupState) => {
    this.state = state;
  };

  public leave = () => this.transitTo(PopupState.onInit);
  public onNode = () => this.state === PopupState.onNode;
  public onEdge = () => this.state === PopupState.onEdge;
  public onGroupNode = () => this.state === PopupState.onGroupNode;
  public onActiveSession = () => this.state === PopupState.onActiveSession;
  public onSniffer = () => this.state === PopupState.onSniffer;
  public onDomain = () => this.state === PopupState.onDomain;
  public onQuickSearch = () => this.state === PopupState.onQuickSearch;
  public onAdvFilter = () => this.state === PopupState.onAdvFilter;
  public onBlacklist = () => this.state === PopupState.onBlacklist;
  public onRule = () => this.state === PopupState.onRule;
  public onHost = () => this.state === PopupState.onHost;
  public getState = () => this.state;
}
