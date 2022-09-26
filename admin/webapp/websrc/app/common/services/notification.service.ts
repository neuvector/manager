import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  open(message: string, action = 'OK', duration = 4000): void {
    this.snackBar.open(message, action, { duration });
  }
}
