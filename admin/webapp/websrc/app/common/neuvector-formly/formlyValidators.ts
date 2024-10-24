import { AbstractControl, ValidationErrors } from '@angular/forms';
import { CertificateDeserializer } from '@common/types/settings/certificate';

export function urlValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  const pattern = new RegExp(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  );
  if (!value) {
    return null;
  }
  return pattern.test(value) ? null : { invalidURL: true };
}

export function objNameValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  const pattern = new RegExp(/^[a-zA-Z0-9]+[.:a-zA-Z0-9_-]*[^.]?$/);
  if (!value) {
    return null;
  }
  return pattern.test(value) ? null : { invalidObjName: true };
}

export function webhookUsernameValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  const pattern = new RegExp(/^(fed\.)/);
  if (!value) {
    return null;
  }

  return pattern.test(value) ? { invalidWebhookUserName: true } : null;
}

export function fedNameValidator(
  control: AbstractControl
): ValidationErrors | null {
  let value = control.value;
  const pattern = new RegExp(/^(fed\.)/);
  if (!value) {
    return null;
  }

  return !pattern.test(value) ? { invalidFedName: true } : null;
}

export function portRangeValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  const pattern = new RegExp(/\d+/);
  if (!value) {
    return null;
  }
  return !pattern.test(value) || +value < 1 || +value > 65535
    ? { invalidPortRange: true }
    : null;
}

export function emailValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  const pattern = new RegExp(
    /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/
  );
  if (!value) {
    return null;
  }
  return pattern.test(value) ? null : { invalidEmail: true };
}

export function certificateValidator(
  control: AbstractControl
): ValidationErrors | null {
  const certificateDeserializer = CertificateDeserializer.getInstance();
  const value = control.value;

  if (!value) {
    return null;
  }

  try {
    certificateDeserializer.getCertificate(value);
    return null;
  } catch (e) {
    return { invalidCertificate: true };
  }
}
