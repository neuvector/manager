export interface Metry {
  cpu: number;
  memory: number;
  session_in: number;
  session_out: number;
  cur_session_in?: number;
  cur_session_out?: number;
  packet_in: number;
  packet_out: number;
  byte_in: number;
  byte_out: number;
}
