import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Appointment, AppointmentService } from '../../../services/appointment.service';
import { MessageKey, t } from '../../../i18n/messages';

@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="calendar-shell">
      <header class="calendar-header">
        <div class="calendar-navigation">
          <button type="button" class="btn btn-outline" (click)="previousMonth()">&lt;</button>
          <button type="button" class="btn btn-outline" (click)="goToToday()">{{ translate('appointment.button.today') }}</button>
          <button type="button" class="btn btn-outline" (click)="nextMonth()">&gt;</button>
        </div>
        <h2 class="calendar-month">{{ monthYear }}</h2>
        <div class="calendar-views" role="tablist">
          <button *ngFor="let view of views" type="button" class="view-tab" [class.active]="activeView === view" (click)="setView(view)">
            {{ translate(viewLabels[view]) }}
          </button>
        </div>
      </header>

      <div *ngIf="errorMessage" class="calendar-error">{{ errorMessage }}</div>

      <div class="calendar-grid" *ngIf="activeView === 'month'">
        <div class="calendar-weekday" *ngFor="let day of weekDays">{{ day }}</div>
        <div
          class="calendar-day"
          *ngFor="let day of daysInMonth"
          [class.calendar-day-empty]="day === null"
          [class.calendar-day-today]="isToday(day)"
          (click)="goToDayView(day, $event)"
        >
          <ng-container *ngIf="day !== null">
            <div class="calendar-day-label">{{ day }}</div>
            <div class="calendar-events">
              <button *ngFor="let appointment of getAppointmentsForDay(day)" type="button" class="calendar-event"
                [class.ticket-event]="isTicket(appointment)" [class.service-event]="!isTicket(appointment)"
                (click)="selectAppointment(appointment, $event)">
                {{ getEventLabel(appointment) }}
              </button>
            </div>
          </ng-container>
        </div>
      </div>
      <div class="calendar-list" *ngIf="activeView === 'list'">
        <button *ngFor="let appointment of appointments" type="button" class="list-event" (click)="selectAppointment(appointment)">
          <strong>{{ formatDateTime(appointment.startDateTime) }}</strong> {{ getEventLabel(appointment) }}
        </button>
        <p *ngIf="appointments.length === 0">{{ translate('appointment.message.noAppointments') }}</p>
      </div>
      <div class="calendar-day-view" *ngIf="activeView === 'day'">
        <button *ngFor="let appointment of getAppointmentsForDay(currentDate.getDate())" type="button" class="list-event" (click)="selectAppointment(appointment)">
          <strong>{{ formatDateTime(appointment.startDateTime) }}</strong> {{ getEventLabel(appointment) }}
        </button>
      </div>
      <div class="calendar-list" *ngIf="activeView === 'week'">
        <button *ngFor="let appointment of getAppointmentsForCurrentWeek()" type="button" class="list-event" (click)="selectAppointment(appointment)">
          <strong>{{ formatDateTime(appointment.startDateTime) }}</strong> {{ getEventLabel(appointment) }}
        </button>
        <p *ngIf="getAppointmentsForCurrentWeek().length === 0">{{ translate('appointment.message.noAppointments') }}</p>
      </div>
      <div class="custom-modal-overlay" *ngIf="isDetailsModalOpen && selectedAppointment" (click)="closeDetailsModal()">
        <div class="custom-modal-container" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="custom-modal-header">
            <div class="custom-modal-header-top">
              <h5 class="modal-title">{{ translate('appointment.title.details') }}</h5>
              <button type="button" class="custom-modal-close" (click)="closeDetailsModal()" [attr.aria-label]="translate('common.close')">
                <span class="custom-modal-close-circle" aria-hidden="true">
                  <span class="custom-modal-close-icon"></span>
                </span>
              </button>
            </div>
          </div>
          <div class="custom-modal-body">
            <p class="detail-day" *ngIf="selectedDay !== null"><strong>{{ selectedDay | number: '2.0-0' }}</strong> {{ monthYear }}</p>
        <ng-container *ngIf="selectedAppointment as appointment">
          <div class="detail-grid">
            <section class="detail-section">
              <h4>{{ translate('appointment.field.patient') }}</h4>
              <div class="detail-field"><span>{{ translate('appointment.field.name') }}</span><strong>{{ getPatientName(appointment) }}</strong></div>
              <div class="detail-field"><span>Telefono</span><strong>{{ appointment.patientPhone || '-' }}</strong></div>
              <div class="detail-field"><span>Telefono Caregiver</span><strong>{{ appointment.caregiverPhone || 'Non presente' }}</strong></div>
              <div class="detail-field"><span>Indirizzo</span><strong>{{ appointment.patientAddress || '-' }}</strong></div>
              <div class="detail-field" *ngIf="appointment.patientCode"><span>{{ translate('appointment.field.patientCode') }}</span><strong>{{ appointment.patientCode }}</strong></div>
              <div class="detail-field" *ngIf="appointment.patientFiscalCode"><span>{{ translate('appointment.field.fiscalCode') }}</span><strong>{{ appointment.patientFiscalCode }}</strong></div>
            </section>
            <section class="detail-section">
              <h4>{{ translate('appointment.field.startDateTime') }} / {{ translate('appointment.field.status') }}</h4>
              <div class="detail-field"><span>{{ translate('appointment.field.type') }}</span><strong>{{ appointment.appointmentCategory || getEventType(appointment) }}</strong></div>
              <div class="detail-field"><span>{{ translate('appointment.field.startDateTime') }}</span><strong>{{ formatDateTime(appointment.startDateTime) }}</strong></div>
              <div class="detail-field"><span>{{ translate('appointment.field.endDateTime') }}</span><strong>{{ formatDateTime(appointment.endDateTime) }}</strong></div>
              <div class="detail-field"><span>{{ translate('appointment.field.status') }}</span><strong class="status-badge">{{ appointment.status || '-' }}</strong></div>
            </section>
            <section class="detail-section">
              <h4>{{ translate('appointment.field.doctor') }}</h4>
              <div class="detail-field"><span>{{ translate('appointment.field.doctor') }}</span><strong>{{ appointment.prevalentDoctorName || '-' }} <small *ngIf="appointment.prevalentDoctorCode">({{ appointment.prevalentDoctorCode }})</small></strong></div>
              <div class="detail-field"><span>{{ translate('appointment.field.location') }}</span><strong>{{ getLocation(appointment) || '-' }}</strong></div>
              <div class="detail-field" *ngIf="appointment.dischargeType || appointment.dischargeDate"><span>{{ translate('appointment.field.discharge') }}</span><strong>{{ appointment.dischargeType || '-' }} <small *ngIf="appointment.dischargeDate">({{ appointment.dischargeDate | date: 'dd/MM/yyyy' }})</small></strong></div>
            </section>
            <section class="detail-section detail-notes" *ngIf="appointment.notes">
              <h4>{{ translate('appointment.field.notes') }}</h4>
              <p>{{ appointment.notes }}</p>
            </section>
          </div>
        </ng-container>
          </div>
          <div class="custom-modal-footer">
            <button
              *ngIf="selectedAppointment?.therapeuticPlanId"
              type="button"
              class="btn btn-primary"
              (click)="onNavigateToVisit(selectedAppointment)"
              [attr.title]="translate('appointment.action.executeVisit')"
            >
              <span aria-hidden="true">▶</span> {{ translate('appointment.action.executeVisit') }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="closeDetailsModal()">Chiudi</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .calendar-shell { display: grid; gap: 16px; min-width: 0; width: 100%; }
    .calendar-header { align-items: center; display: grid; gap: 12px; grid-template-columns: 1fr auto 1fr; margin-bottom: 0; }
    .calendar-navigation, .calendar-views { align-items: center; display: flex; gap: 8px; }
    .calendar-views { justify-content: flex-end; }
    .calendar-header button { font-size: 0.85rem; height: 32px; line-height: 22px; padding: 4px 12px; }
    .calendar-month { font-size: 1.35rem; font-weight: 700; margin: 0; text-align: center; text-transform: capitalize; }
    .view-tab { background: #fff; border: 1px solid #f4b183; color: #e65100; }
    .view-tab.active { background: #f36f21; color: #fff; }
    .calendar-error { background: #fee2e2; border: 1px solid #fecaca; border-radius: 10px; color: #991b1b; padding: 10px; }
    .calendar-grid { display: grid; gap: 8px; grid-template-columns: repeat(7, minmax(0, 1fr)); }
    .calendar-weekday { color: #475569; font-size: 12px; font-weight: 700; text-align: center; }
    .calendar-day { background: #fff; border: 1px solid #dbe4f0; border-radius: 6px; min-height: 120px; min-width: 0; overflow: hidden; padding: 8px; }
    .calendar-day-empty { background: #f8fafc; border-style: dashed; }
    .calendar-day-today { border-color: #1d4ed8; box-shadow: 0 0 0 1px #1d4ed8 inset; }
    .calendar-day-label { font-weight: 700; }
    .calendar-events { display: grid; gap: 4px; margin-top: 8px; }
    .calendar-event, .list-event { border: 0; border-radius: 4px; cursor: pointer; font-size: 0.75rem; line-height: 1.3; overflow: hidden; padding: 4px 6px; text-align: left; text-overflow: ellipsis; white-space: nowrap; }
    .ticket-event { background: #fff3e0; color: #e65100; }
    .service-event { background: #e8f5e9; color: #2e7d32; }
    .calendar-list, .calendar-day-view { display: grid; gap: 6px; }
    .list-event { background: #fff3e0; color: #e65100; }
    .custom-modal-overlay { align-items: center; background: rgba(15, 23, 42, .48); display: flex; inset: 0; justify-content: center; padding: 24px; position: fixed; z-index: 1050; }
    .custom-modal-container { background: #fff; border-radius: 12px; box-shadow: 0 24px 70px rgba(15, 23, 42, .28); max-height: 92vh; max-width: 960px; overflow: hidden; width: min(960px, 100%); }
    .custom-modal-header { background: linear-gradient(90deg, #007bff 0%, #00d285 100%); color: #fff; padding: 16px 24px; }
    .custom-modal-header-top { align-items: center; display: flex; gap: 16px; justify-content: space-between; min-height: 42px; }
    .custom-modal-header .modal-title { color: #fff; font-size: 1.6rem; font-weight: 700; margin: 0; }
    .custom-modal-close { align-items: center; background: transparent; border: 0; border-radius: 50%; cursor: pointer; display: flex; height: 42px; justify-content: center; width: 42px; }
    .custom-modal-close-circle { align-items: center; background: rgba(255, 255, 255, .12); border: 1.5px solid rgba(255, 255, 255, .92); border-radius: 50%; box-shadow: 0 6px 14px rgba(7, 48, 110, .18); display: inline-flex; height: 26px; justify-content: center; width: 26px; }
    .custom-modal-close-icon { display: inline-block; height: 10px; position: relative; width: 10px; }
    .custom-modal-close-icon::before, .custom-modal-close-icon::after { background: #fff; border-radius: 999px; content: ''; height: 1.7px; left: 0; position: absolute; top: 50%; transform-origin: center; width: 10px; }
    .custom-modal-close-icon::before { transform: translateY(-50%) rotate(45deg); }
    .custom-modal-close-icon::after { transform: translateY(-50%) rotate(-45deg); }
    .custom-modal-close:hover .custom-modal-close-circle { background: rgba(255, 255, 255, .2); border-color: #fff; transform: scale(1.04); }
    .custom-modal-body { max-height: calc(92vh - 132px); overflow-y: auto; }
    .custom-modal-footer { display: flex; justify-content: flex-end; padding: 0 20px 20px; }
    .detail-day { color: #64748b; margin: 14px 20px 0; }
    .detail-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); padding: 16px 20px 20px; }
    .detail-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .detail-section h4 { color: #1d4ed8; font-size: .9rem; margin: 0 0 12px; }
    .detail-field { display: grid; gap: 4px; margin-top: 10px; }
    .detail-field span { color: #6c757d; font-size: .8rem; font-weight: 600; text-transform: uppercase; }
    .detail-field strong { color: #1e293b; font-size: .95rem; font-weight: 500; overflow-wrap: anywhere; }
    .status-badge { background: #dcfce7; border-radius: 999px; color: #166534 !important; display: inline-block; padding: 4px 10px; width: fit-content; }
    .detail-notes { grid-column: 1 / -1; }
    .detail-notes p { color: #1e293b; line-height: 1.5; margin: 0; white-space: pre-wrap; }
    @media (max-width: 900px) { .calendar-header { grid-template-columns: 1fr; } .calendar-month { order: -1; } .calendar-views { justify-content: flex-start; flex-wrap: wrap; } .calendar-day { min-height: 100px; } }
  `]
})
export class AppointmentsCalendarComponent implements OnInit {
  @Input() nurseId: number | null = null;

  currentDate = new Date();
  appointments: Appointment[] = [];
  loading = false;
  errorMessage = '';
  daysInMonth: Array<number | null> = [];
  monthYear = '';
  views = ['month', 'week', 'day', 'list'] as const;
  activeView: typeof this.views[number] = 'month';
  selectedAppointment: Appointment | null = null;
  isDetailsModalOpen = false;
  selectedDay: number | null = null;
  viewLabels: Record<typeof this.views[number], MessageKey> = {
    month: 'appointment.view.month', week: 'appointment.view.week', day: 'appointment.view.day', list: 'appointment.view.list'
  };
  appointmentsByDay: Map<number, Appointment[]> = new Map();
  weekDays = [
    t('appointment.weekDay.mon'),
    t('appointment.weekDay.tue'),
    t('appointment.weekDay.wed'),
    t('appointment.weekDay.thu'),
    t('appointment.weekDay.fri'),
    t('appointment.weekDay.sat'),
    t('appointment.weekDay.sun')
  ];

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.appointmentService.getCurrentNurse().subscribe({
      next: (nurse) => {
        this.nurseId = nurse.id;
        this.generateCalendar();
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.monthYear = new Date(year, month).toLocaleString([], { month: 'long', year: 'numeric' });
    this.loadAppointmentsForMonth(year, month);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    this.daysInMonth = [];
    for (let i = 0; i < firstDay; i += 1) {
      this.daysInMonth.push(null);
    }
    for (let day = 1; day <= daysInCurrentMonth; day += 1) {
      this.daysInMonth.push(day);
    }
  }

  loadAppointmentsForMonth(year: number, month: number): void {
    if (!this.nurseId) {
      this.errorMessage = this.translate('appointment.error.nurseNotConfigured');
      this.appointments = [];
      this.appointmentsByDay.clear();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.appointmentService.getNurseDashboardCalendar(this.nurseId, month + 1, year).subscribe({
      next: (items) => {
        console.log('[NurseDashboard] Risposta ricevuta dal server per calendario appuntamenti:', items);
        console.log('[NurseDashboard] Numero appuntamenti ricevuti:', items?.length || 0);
        this.appointments = items;
        this.groupAppointmentsByDay(items);
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
  }

  getApptCountForDay(day: number | null): number {
    if (day === null) {
      return 0;
    }
    return this.appointmentsByDay.get(day)?.length ?? 0;
  }

  setView(view: typeof this.views[number]): void { this.activeView = view; }

  getAppointmentsForDay(day: number | null): Appointment[] {
    return day === null ? [] : this.appointmentsByDay.get(day) ?? [];
  }

  getAppointmentsForCurrentWeek(): Appointment[] {
    const start = new Date(this.currentDate);
    const dayOfWeek = start.getDay() || 7;
    start.setDate(start.getDate() - dayOfWeek + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return this.appointments.filter((appointment) => {
      const date = new Date(appointment.startDateTime);
      return date >= start && date < end;
    });
  }

  selectAppointment(appointment: Appointment, event?: Event): void {
    event?.stopPropagation();
    this.selectedAppointment = appointment;
    this.selectedDay = new Date(appointment.startDateTime).getDate();
    this.isDetailsModalOpen = true;
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.selectedAppointment = null;
    this.selectedDay = null;
  }

  onNavigateToVisit(appointment: Appointment | null): void {
    if (!appointment) {
      return;
    }

    const planId = appointment.therapeuticPlanId;
    if (!planId) {
      return;
    }

    const visitId = appointment.visitId ?? appointment.id;
    this.closeDetailsModal();
    void this.router.navigate([`/therapeutic-plans/manage/${planId}`], {
      queryParams: {
        tab: 'visits',
        openVisitId: visitId,
        appointmentId: appointment.id,
        appointmentStartedAt: appointment.startDateTime,
        appointmentDateTime: appointment.startDateTime,
        autoOpenWizard: true,
        openVisitWizard: true
      }
    });
  }

  clearSelection(): void { this.closeDetailsModal(); }

  goToDayView(day: number | null, event?: Event): void {
    event?.stopPropagation();
    if (day === null) return;
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
    this.activeView = 'day';
    this.selectedAppointment = null;
    this.selectedDay = day;
  }

  isTicket(appointment: Appointment): boolean { return appointment.appointmentTypeName === 'TICKET'; }

  getEventLabel(appointment: Appointment): string {
    const time = new Date(appointment.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const type = this.getEventType(appointment);
    const subject = this.getPatientName(appointment);
    return `[${time}] ${type}${subject !== '-' ? ` - ${subject}` : ''}`;
  }

  getEventType(appointment: Appointment): string {
    return appointment.appointmentCategory || appointment.appointmentTypeName || 'Visita';
  }

  getPatientName(appointment: Appointment): string {
    return appointment.patientName || [appointment.patientLastName, appointment.patientFirstName].filter(Boolean).join(' ')
      || appointment.therapeuticPlanPatientDisplayName || appointment.therapeuticPlanId?.toString() || '-';
  }

  getLocation(appointment: Appointment): string {
    return [appointment.address, appointment.city, appointment.facility].filter(Boolean).join(', ');
  }

  formatDateTime(value: string): string { return new Date(value).toLocaleString(); }

  isToday(day: number | null): boolean {
    if (day === null) {
      return false;
    }
    const today = new Date();
    return day === today.getDate()
      && this.currentDate.getMonth() === today.getMonth()
      && this.currentDate.getFullYear() === today.getFullYear();
  }

  private groupAppointmentsByDay(appointments: Appointment[]): void {
    this.appointmentsByDay.clear();
    appointments.forEach((appointment) => {
      const currentDate = new Date(appointment.startDateTime);
      const day = currentDate.getDate();
      if (!this.appointmentsByDay.has(day)) {
        this.appointmentsByDay.set(day, []);
      }
      this.appointmentsByDay.get(day)?.push(appointment);
    });
  }

  private resolveErrorMessage(error: unknown): string {
    const typedError = error as { error?: { detail?: string; message?: string } };
    const detail = typeof typedError?.error?.detail === 'string' ? typedError.error.detail.trim() : '';
    if (detail) {
      return detail;
    }
    const message = typeof typedError?.error?.message === 'string' ? typedError.error.message.trim() : '';
    if (message) {
      return message;
    }
    return this.translate('crud.error.load');
  }
}