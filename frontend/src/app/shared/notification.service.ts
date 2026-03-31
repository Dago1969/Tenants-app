// NotificationService: gestisce messaggi evanescenti di successo/errore con durata e stile diversi.
// Utilizzo: notificationService.showSuccess(msgKey) o notificationService.showError(msgKey)
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error';

export interface NotificationMessage {
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new BehaviorSubject<NotificationMessage | null>(null);
  notification$ = this.notificationSubject.asObservable();
  private timeoutId: any;

  show(type: NotificationType, message: string) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.notificationSubject.next({ type, message });
    const duration = type === 'error' ? 20000 : 10000;
    this.timeoutId = setTimeout(() => {
      this.clear();
    }, duration);
  }

  showSuccess(message: string) {
    this.show('success', message);
  }

  showError(message: string) {
    this.show('error', message);
  }

  clear() {
    this.notificationSubject.next(null);
  }
}
