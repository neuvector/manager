import { AbstractControl, ValidationErrors } from '@angular/forms';
import { GlobalConstant } from '@common/constants/global.constant';

export function urlValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  const pattern = new RegExp(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
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
  const pattern = new RegExp(/^[a-zA-Z0-9]+[.:a-zA-Z0-9_-]*$/);
  if (!value) {
    return null;
  }
  return pattern.test(value) ? null : { invalidObjName: true };
}

export function fedNameValidator(
  control: AbstractControl
): ValidationErrors | null {
  const { name, cfg_type } = control.value;
  const pattern = new RegExp(/^(fed\.)/);
  if (!name) {
    return null;
  }
  return pattern.test(name) && cfg_type !== GlobalConstant.CFG_TYPE.FED
    ? { invalidFedName: true }
    : null;
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
