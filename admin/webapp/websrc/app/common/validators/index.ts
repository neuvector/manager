import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const pattern = new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,256}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
    );
    if (!value) {
      return null;
    }
    return pattern.test(value) ? null : { invalidURL: true };
  };
}

export function passwordValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (newPassword !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ notSame: true });
    }
    return newPassword === confirmPassword ? null : { notSame: true };
  };
}

export function autocompleteValidator(validOptions: string[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;
    return validOptions.includes(control.value)
      ? null
      : { invalidAutocompleteString: true };
  };
}
