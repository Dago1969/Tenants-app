import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService, TicketDto } from '../../services/ticket.service';
import { AuthService } from '../../core/auth.service';
import { MessageKey, t } from '../../i18n/messages';
import { QtmStepModalComponent } from '../../shared/qtm-step-modal.component';

interface TicketManageTab {
  key: 'create' | 'view' | 'edit' | 'delete';
  titleKey: MessageKey;
}

/**
 * Componente wizard per la gestione dei ticket.
 * Consente creazione a tutti gli autenticati.
 * Visualizzazione, modifica e cancellazione solo per SUPERADMIN e OperatoreQTM.
 */
@Component({
  selector: 'app-tickets-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, QtmStepModalComponent],
  templateUrl: './tickets-manage.component.html',
  styleUrl: './tickets-manage.component.css'
})
export class TicketsManageComponent implements OnInit {
  isLoading = false;
  isSuperAdmin = false;
  ticketId: number | null = null;
  selectedTab: TicketManageTab['key'] = 'create';
  ticketForm: FormGroup;
  currentTicket: TicketDto | null = null;
  errorMessage = '';
  successMessage = '';

  tabs: TicketManageTab[] = [
    { key: 'create', titleKey: 'ticket.manage.create' },
    { key: 'view', titleKey: 'ticket.manage.view' },
    { key: 'edit', titleKey: 'ticket.manage.edit' },
    { key: 'delete', titleKey: 'ticket.manage.delete' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private ticketService: TicketService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.ticketForm = this.createEmptyForm();
  }

  ngOnInit(): void {
    // Verifica autorizzazioni
    const selectedRole = this.authService.getSelectedRole().toLowerCase();
    this.isSuperAdmin = selectedRole.includes('superadmin') || selectedRole.includes('operatoreqtm');

    // Se non è super admin, disabilita visualizzazione, modifica e cancellazione
    if (!this.isSuperAdmin) {
      this.tabs = [{ key: 'create', titleKey: 'ticket.manage.create' }];
      this.selectedTab = 'create';
    }

    // Leggi l'ID dal route se presente
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.ticketId = parseInt(params['id'], 10);
        if (this.isSuperAdmin) {
          this.loadTicket(this.ticketId);
        }
      }
    });
  }

  get visibleTabs(): TicketManageTab[] {
    return this.tabs;
  }

  selectTab(tab: TicketManageTab['key']): void {
    this.selectedTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
    this.ticketForm = this.createEmptyForm();

    if (tab === 'view' || tab === 'edit') {
      if (this.ticketId) {
        this.loadTicket(this.ticketId);
      }
    }
  }

  private createEmptyForm(): FormGroup {
    return this.formBuilder.group({
      realm: [this.getDefaultRealm(), Validators.required],
      project: [this.authService.getSelectedProject(), Validators.required],
      patientId: [''],
      therapeuticPlanId: [''],
      ticketType: ['', Validators.required],
      status: ['OPEN', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      contentJson: ['']
    });
  }

  private loadTicket(id: number): void {
    this.isLoading = true;
    this.ticketService.getTicketById(id).subscribe({
      next: (ticket) => {
        this.currentTicket = ticket;
        this.ticketForm.patchValue(ticket);
        this.isLoading = false;
        this.successMessage = t('ticket.manage.loaded');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = t('ticket.manage.error.load');
        console.error('Errore caricamento ticket:', err);
      }
    });
  }

  createTicket(): void {
    if (this.ticketForm.invalid) {
      this.errorMessage = t('form.validation.error');
      return;
    }

    this.isLoading = true;
    const dto: TicketDto = this.ticketForm.value;

    this.ticketService.createTicket(dto).subscribe({
      next: (created) => {
        this.isLoading = false;
        this.successMessage = t('ticket.manage.created');
        this.ticketForm = this.createEmptyForm();
        this.ticketId = created.id || null;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = t('ticket.manage.error.create');
        console.error('Errore creazione ticket:', err);
      }
    });
  }

  updateTicket(): void {
    if (this.ticketForm.invalid || !this.ticketId) {
      this.errorMessage = t('form.validation.error');
      return;
    }

    this.isLoading = true;
    const dto: TicketDto = this.ticketForm.value;

    this.ticketService.updateTicket(this.ticketId, dto).subscribe({
      next: (updated) => {
        this.isLoading = false;
        this.successMessage = t('ticket.manage.updated');
        this.currentTicket = updated;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = t('ticket.manage.error.update');
        console.error('Errore aggiornamento ticket:', err);
      }
    });
  }

  deleteTicket(): void {
    if (!this.ticketId || !confirm(t('ticket.manage.confirm.delete'))) {
      return;
    }

    this.isLoading = true;
    this.ticketService.deleteTicket(this.ticketId).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = t('ticket.manage.deleted');
        this.ticketId = null;
        this.ticketForm = this.createEmptyForm();
        this.currentTicket = null;
        setTimeout(() => {
          this.successMessage = '';
          this.selectedTab = 'create';
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = t('ticket.manage.error.delete');
        console.error('Errore cancellazione ticket:', err);
      }
    });
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  private getDefaultRealm(): string {
    return 'QTM';
  }
}
