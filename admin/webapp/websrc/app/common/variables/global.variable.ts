import { HttpClient, HttpHeaders } from '@angular/common/http';
export class GlobalVariable {
  public static selectedFedGroup: string = '';
  public static window: any;
  public static user: any;
  public static namespaces4NamespaceUser: any;
  public static sidebarDone: boolean;
  public static versionDone: boolean;
  public static isFooterReady: boolean;
  public static isOpenShift: boolean;
  public static summary: any;
  public static hasInitializedSummary: boolean;
  public static clusterName: string;
  public static headers: HttpHeaders;
  public static http: HttpClient;
  public static nvToken: string;
  public static isSUSESSO: boolean;
  public static isMaster: boolean = false;
  public static isMember: boolean = false;
  public static isStandAlone: boolean = false;
  public static isRemote: boolean = false;
  public static version: string;
  public static gravatar: boolean = false;
}
