import { PwdProfileBasic } from "./pwdProfileBasic";
import { ImportTaskData } from "./importTaskData";

export interface Error {
  code: number;
  error: string;
  message: string;
  password_profile_basic?: PwdProfileBasic;
  import_task_data?: ImportTaskData;
}
