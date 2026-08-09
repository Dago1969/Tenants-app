import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

interface AppointmentFormNurse {
  id: number;
  fullName: string;
}

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule],
  template: ''
})
export class AppointmentFormComponent {
  @Input() embedded = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() appointmentToEdit: unknown = null;
  @Input() therapeuticPlanId: number | null = null;
  @Input() planNurses: AppointmentFormNurse[] = [];

  @Output() appointmentSaved = new EventEmitter<void>();
  @Output() appointmentDeleted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}