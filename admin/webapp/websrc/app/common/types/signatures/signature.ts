export class Verifier {
  name: string = '';
  comment: String = '';
  verifier_type: string = '';
  ignore_tlog: boolean = false;
  ignore_sct: boolean = false;
  public_key?: string = '';
  cert_issuer?: string = '';
  cert_subject?: string = '';
}

export class Signature {
  name: string = '';
  comment: String = '';
  attribute: String = '';
  rekor_public_key: string = '';
  root_cert?: string = '';
  sct_public_key?: string = '';
  cfg_type?: string = '';
  verifiers?: Array<Verifier>;
}

export class SignaturePayload {
  name: string = '';
  comment: String = '';
  is_private: Boolean = false;
  rootless_keypairs_only: Boolean = false;
  rekor_public_key: string = '';
  root_cert?: string = '';
  sct_public_key?: string = '';
  cfg_type?: string = '';
  verifiers?: Array<Verifier>;
}
