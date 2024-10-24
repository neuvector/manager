import * as forge from 'node-forge';
import * as moment from 'moment';

export enum CertificateKeyAlgorithmType {
  RSA = 'RSA',
  ED25519 = 'ED25519',
}

export enum CertificateFieldKey {
  COMMON_NAME = 'CN',
  ORGANIZATION = 'O',
  ORGANIZATION_UNIT = 'OU',
}

export interface CertificateManifest {
  commonName?: forge.pki.CertificateField;
  serialNumber: string;
  keyAlgorithm: string;
  signatureAlgorithm: string;
  organization?: forge.pki.CertificateField;
  organizationUnit?: forge.pki.CertificateField;
  issuer: string;
  validFrom: moment.Moment;
  validTo: moment.Moment;
  daysLeft: number;
  isSelfSigned: boolean;
}

export class CertificateDeserializer {
  private static _instance: CertificateDeserializer;

  private constructor() {}

  public static getInstance(): CertificateDeserializer {
    if (!CertificateDeserializer._instance) {
      CertificateDeserializer._instance = new CertificateDeserializer();
    }

    return CertificateDeserializer._instance;
  }

  public getCertificate(value: string | Buffer): forge.pki.Certificate {
    if (typeof value === 'string') {
      return forge.pki.certificateFromPem(value);
    } else if (Buffer.isBuffer(value)) {
      return forge.pki.certificateFromPem(value.toString('utf8'));
    } else {
      throw new Error('Invalid certificate data type');
    }
  }

  public getMainfest(cert: forge.pki.Certificate): CertificateManifest {
    const keyAlgorithmType = this.getKeyAlgorithmType(cert);
    const validFrom = moment(cert.validity.notBefore);
    const validTo = moment(cert.validity.notAfter);
    const daysLeft = moment
      .duration(moment(cert.validity.notAfter).diff(moment()))
      .asDays();

    return {
      commonName: cert.subject.getField(CertificateFieldKey.COMMON_NAME),
      serialNumber: cert.serialNumber,
      keyAlgorithm: keyAlgorithmType,
      signatureAlgorithm: forge.pki.oids[cert.siginfo.algorithmOid],
      organization: cert.subject.getField(CertificateFieldKey.ORGANIZATION),
      organizationUnit: cert.subject.getField(
        CertificateFieldKey.ORGANIZATION_UNIT
      ),
      issuer: this.getIssuerString(cert),
      validFrom: validFrom,
      validTo: validTo,
      daysLeft: Math.round(daysLeft),
      isSelfSigned: this.isSelfSigned(cert),
    };
  }

  private getKeyAlgorithmType(cert: forge.pki.Certificate) {
    if (
      (cert.publicKey as forge.pki.rsa.PublicKey).n &&
      (cert.publicKey as forge.pki.rsa.PublicKey).e
    ) {
      return CertificateKeyAlgorithmType.RSA;
    } else {
      return CertificateKeyAlgorithmType.ED25519;
    }
  }

  private getIssuerString(cert: forge.pki.Certificate): string {
    let issuerValues: string[] = [];

    cert.issuer.attributes.forEach(a => {
      issuerValues.push(`${a.shortName}=${a.value}`);
    });

    return issuerValues.join(', ');
  }

  private isSelfSigned(cert: forge.pki.Certificate) {
    return cert.issuer.toString() === cert.subject.toString();
  }
}
