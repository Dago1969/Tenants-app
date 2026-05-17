import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppointmentService, Appointment } from '../../../services/appointment.service';
import { environment } from '../../../../environments/environment';
import { MessageKey, t } from '../../../i18n/messages';

interface TherapeuticPlanHeader {
  id: number;
  patientId: number;
  patientDisplayName: string;
  projectCode: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
  drugCode: string;
}

/**
 * Component per visualizzare il dettaglio di un appuntamento e gestire le azioni relative:
 * - Visualizza il piano terapeutico associato
 * - Permette di iniziare una visita, consegna farmaci o prelievi
 * - Aggiorna lo stato dell'appuntamento
 */
@Component({
  selector: 'app-appointment-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.css']
})
export class AppointmentDetailsComponent implements OnInit {
  appointment: Appointment | null = null;
  therapeuticPlanHeader: TherapeuticPlanHeader | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private appointmentService: AppointmentService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  translate(key: MessageKey): string {
    return t(key);
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const planId = params['id'];
      const appointmentId = this.route.snapshot.queryParams['appointmentId'];

      if (planId && appointmentId) {
        this.loadAppointmentAndPlan(parseInt(appointmentId, 10), parseInt(planId, 10));
      } else {
        this.errorMessage = t('appointment.error.missingParameters');
      }
    });
  }

  loadAppointmentAndPlan(appointmentId: number, planId: number): void {
    this.loading = true;
    this.errorMessage = '';

    // Carica l'appuntamento e il piano terapeutico in parallelo
    Promise.all([
      this.appointmentService.getByTherapeuticPlan(planId).toPromise(),
      this.http
        .get<TherapeuticPlanHeader>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}`)
        .toPromise()
    ])
      .then(([appointments, plan]) => {
        const foundAppointment = appointments?.find((a) => a.id === appointmentId);
        if (foundAppointment && plan) {
          this.appointment = foundAppointment;
          this.therapeuticPlanHeader = plan;
        } else {
          this.errorMessage = t('appointment.error.appointmentNotFound');
        }
        this.loading = false;
      })
      .catch((error) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
        console.error('Errore caricamento appuntamento/piano:', error);
      });
  }

  /**
   * Inizia una visita: aggiorna lo stato dell'appuntamento a "IN_PROGRESS"
   * e naviga verso il form di inserimento visita del piano terapeutico
   */
  startVisit(): void {
    if (!this.appointment || !this.therapeuticPlanHeader) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const actualVisitStartDateTime = this.getCurrentLocalDateTimeForBackend();

    const updatedAppointment = {
      ...this.appointment,
      status: 'IN_PROGRESS',
      startDateTime: actualVisitStartDateTime
    };

    this.appointmentService.updateAppointment(this.appointment.id, updatedAppointment).subscribe({
      next: () => {
        this.appointment = {
          ...updatedAppointment
        };
        this.loading = false;
        this.successMessage = t('appointment.message.visitStarted');
        // Naviga direttamente al wizard di inserimento visita.
        setTimeout(() => {
          this.router.navigate(['/therapeutic-plans/manage', this.therapeuticPlanHeader!.id], {
            queryParams: {
              tab: 'visits',
              openVisitWizard: 'true',
              appointmentId: this.appointment!.id,
              appointmentDateTime: actualVisitStartDateTime,
              appointmentStartedAt: actualVisitStartDateTime
            }
          });
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  /**
   * Avvia la consegna farmaci
   */
  startDrugDelivery(): void {
    if (!this.appointment) {
      return;
    }

    this.loading = true;
    const updatedAppointment = {
      ...this.appointment,
      status: 'IN_PROGRESS'
    };

    this.appointmentService.updateAppointment(this.appointment.id, updatedAppointment).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = t('appointment.message.drugDeliveryStarted');
        // Naviga verso il piano terapeutico per registrare la consegna
        setTimeout(() => {
          this.router.navigate(['/therapeutic-plans/manage', this.therapeuticPlanHeader!.id], {
            fragment: 'activities'
          });
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  /**
   * Avvia un prelievo
   */
  startBloodDraw(): void {
    if (!this.appointment) {
      return;
    }

    this.loading = true;
    const updatedAppointment = {
      ...this.appointment,
      status: 'IN_PROGRESS'
    };

    this.appointmentService.updateAppointment(this.appointment.id, updatedAppointment).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = t('appointment.message.bloodDrawStarted');
        // Naviga verso il piano terapeutico per registrare il prelievo
        setTimeout(() => {
          this.router.navigate(['/therapeutic-plans/manage', this.therapeuticPlanHeader!.id], {
            fragment: 'activities'
          });
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/appointments/daily']);
  }

  getAppointmentStatusLabel(): MessageKey {
    if (!this.appointment) {
      return 'appointment.status.scheduled';
    }
    return `appointment.status.${this.appointment.status.toLowerCase()}` as MessageKey;
  }

  getTherapeuticPlanStatusLabel(): MessageKey {
    if (!this.therapeuticPlanHeader) {
      return 'therapeuticPlan.status.active';
    }
    return `therapeuticPlan.status.${this.therapeuticPlanHeader.status.toLowerCase()}` as MessageKey;
  }

  getActionButtonLabel(): MessageKey {
    if (!this.appointment) {
      return 'appointment.button.startAppointment';
    }

    const appointmentType = this.appointment.appointmentTypeName.toLowerCase();
    if (appointmentType.includes('visita')) {
      return 'appointment.button.startVisit';
    } else if (appointmentType.includes('farmaci') || appointmentType.includes('consegna')) {
      return 'appointment.button.startDrugDelivery';
    } else if (appointmentType.includes('prelievo') || appointmentType.includes('sangue')) {
      return 'appointment.button.startBloodDraw';
    }
    return 'appointment.button.startAppointment';
  }

  performAction(): void {
    if (!this.appointment) {
      return;
    }

    const appointmentType = this.appointment.appointmentTypeName.toLowerCase();
    if (appointmentType.includes('visita')) {
      this.startVisit();
    } else if (appointmentType.includes('farmaci') || appointmentType.includes('consegna')) {
      this.startDrugDelivery();
    } else if (appointmentType.includes('prelievo') || appointmentType.includes('sangue')) {
      this.startBloodDraw();
    }
  }

  formatPageDate(value?: string | null): string {
    if (!value?.trim()) {
      return this.translate('common.notAvailable');
    }

    return this.appointmentService.formatLocalDateTime(value) || value;
  }

  private resolveErrorMessage(error: any): string {
    const detail = typeof error?.error?.detail === 'string' ? error.error.detail.trim() : '';
    if (detail) {
      return detail;
    }
    const message = typeof error?.error?.message === 'string' ? error.error.message.trim() : '';
    if (message) {
      return message;
    }
    return t('crud.error.generic');
  }

  private getCurrentLocalDateTimeForBackend(): string {
    return this.appointmentService.getCurrentLocalDateTimePayload();
  }
}
