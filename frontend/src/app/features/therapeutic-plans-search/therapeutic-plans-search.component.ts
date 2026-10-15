
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ViewChild, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { SearchField, SearchPageComponent, SearchPrintSection } from '../../shared/search-page.component';
import { AuthService } from '../../core/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { t } from '../../i18n/messages';

/**
 * Pagina di ricerca dei piani terapeutici con wizard popup su route figlia.
 */
@Component({
  selector: 'app-therapeutic-plans-search',
  standalone: true,
  imports: [CommonModule, SearchPageComponent, RouterLink, RouterOutlet],
  template: `
    <app-search-page
      #searchPage
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
      [createRoute]="createRoute"
      [detailRouteBase]="detailRouteBase"
      [showManageAction]="true"
      [manageRouteBase]="manageRouteBase"
      [manageActionLabelKey]="manageActionLabelKey"
      [printSections]="printSections"
      [autoSearch]="true"
      [fixedParams]="getFixedParams()"
      [routeQueryParams]="patientQueryParams"
    >
      <span search-header-action *ngIf="patientQueryParams['patientId']">
        {{ patientScopeLabel }}: #{{ patientQueryParams['patientId'] }}
        <a routerLink="/therapeutic-plans/search" [queryParams]="{}">{{ allPlansLabel }}</a>
      </span>
    </app-search-page>

    <router-outlet (deactivate)="refreshAfterWizardClose()"></router-outlet>
  `
})
export class TherapeuticPlansSearchComponent implements OnInit {
  @ViewChild('searchPage') private searchPage?: SearchPageComponent;

  titleKey = 'therapeuticPlan.search.title' as const;
  endpoint = 'therapeutic-plans';
  moduleCode = 'THERAPEUTIC_PLAN';
  createFunctionCode = 'CREATE';
  createRoute = '/therapeutic-plans/search/new';
  detailRouteBase = '/therapeutic-plans/search';
  manageRouteBase = '/therapeutic-plans/manage';
  manageActionLabelKey = 'therapeuticPlan.manage.action';
  fixedParams: Record<string, string> = {};
  patientQueryParams: Record<string, string> = {};
  patientScopeLabel = t('therapeuticPlan.search.patientScope');
  allPlansLabel = t('therapeuticPlan.search.allPlans');

  filters: SearchField[] = [];
  patientOptions: { value: string; label: string }[] = [];
  nurseOptions: { value: string; label: string }[] = [];
  doctorOptions: { value: string; label: string }[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly destroyRef: DestroyRef
  ) {
    const projectCode = this.authService.getSelectedProject();
    if (projectCode) {
      this.fixedParams = { projectCode };
    }
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const patientId = params.get('patientId');
      this.patientQueryParams = patientId !== null ? { patientId } : {};
      const projectCode = this.authService.getSelectedProject();
      this.fixedParams = {
        ...(projectCode ? { projectCode } : {}),
        ...this.patientQueryParams
      };
    });
    this.updateFilters();

    this.http.get<any[]>(`${environment.apiBaseUrl}/patients`)
      .pipe(catchError(() => of([])))
      .subscribe((list) => {
        this.patientOptions = (list ?? [])
          .map((patient) => this.toPatientOption(patient))
          .filter((option): option is { value: string; label: string } => option !== null)
          .sort((left, right) => left.label.localeCompare(right.label, 'it', { sensitivity: 'base' }));
        this.updateFilters();
      });

    this.http.get<any[]>(`${environment.apiBaseUrl}/nurses`)
      .pipe(catchError(() => of([])))
      .subscribe((list) => {
        this.nurseOptions = (list ?? [])
          .map((nurse) => this.toNamedOption(nurse?.fullName))
          .filter((option): option is { value: string; label: string } => option !== null)
          .sort((left, right) => left.label.localeCompare(right.label, 'it', { sensitivity: 'base' }));
        this.updateFilters();
      });

    this.http.get<any[]>(`${environment.apiBaseUrl}/doctors`)
      .pipe(catchError(() => of([])))
      .subscribe((list) => {
        this.doctorOptions = (list ?? [])
          .map((doctor) => this.toNamedOption(doctor?.fullName))
          .filter((option): option is { value: string; label: string } => option !== null)
          .sort((left, right) => left.label.localeCompare(right.label, 'it', { sensitivity: 'base' }));
        this.updateFilters();
      });
  }

  updateFilters(): void {
    this.filters = [
      {
        key: 'patientName',
        labelKey: 'therapeuticPlan.field.patient',
        type: 'select',
        options: this.patientOptions
      },
      {
        key: 'nurseName',
        labelKey: 'therapeuticPlan.field.nurse',
        type: 'select',
        options: this.nurseOptions
      },
      {
        key: 'doctorName',
        labelKey: 'therapeuticPlan.field.doctor',
        type: 'select',
        options: this.doctorOptions
      },
      { key: 'projectCode', labelKey: 'therapeuticPlan.field.projectCode', type: 'text' },
      { key: 'drugCode', labelKey: 'therapeuticPlan.field.drugCode', type: 'text' },
      {
        key: 'status',
        labelKey: 'therapeuticPlan.field.status',
        type: 'select',
        options: [
          { value: 'draft', label: 'status.draft' },
          { value: 'active', label: 'status.active' },
          { value: 'completed', label: 'status.completed' },
          { value: 'suspended', label: 'status.suspended' },
          { value: 'cancelled', label: 'status.cancelled' }
        ]
      }
    ];
  }

  resultColumns: SearchField[] = [
    { key: 'patientDisplayName', labelKey: 'therapeuticPlan.field.patient', type: 'text' },
    { key: 'projectCode', labelKey: 'therapeuticPlan.field.projectCode', type: 'text' },
    { key: 'structureName', labelKey: 'therapeuticPlan.field.structure', type: 'text' },
    { key: 'nurseName', labelKey: 'therapeuticPlan.field.nurse', type: 'text' },
    { key: 'doctorName', labelKey: 'therapeuticPlan.field.doctor', type: 'text' },
    { key: 'drugCode', labelKey: 'therapeuticPlan.field.drugCode', type: 'text' },
    { key: 'status', labelKey: 'therapeuticPlan.field.status', type: 'text' },
    { key: 'startDate', labelKey: 'therapeuticPlan.field.startDate', type: 'text' },
    { key: 'endDate', labelKey: 'therapeuticPlan.field.endDate', type: 'text' }
  ];

  printSections: SearchPrintSection[] = [
    {
      titleKey: 'therapeuticPlan.folder.main',
      descriptionKey: 'therapeuticPlan.folder.main.desc',
      fields: ['patientDisplayName', 'projectCode', 'status', 'drugCode']
    },
    {
      titleKey: 'therapeuticPlan.folder.clinical',
      descriptionKey: 'therapeuticPlan.folder.clinical.desc',
      fields: ['structureName', 'structureType', 'nurseName', 'doctorName']
    },
    {
      titleKey: 'therapeuticPlan.folder.equipment',
      descriptionKey: 'therapeuticPlan.folder.equipment.desc',
      fields: ['equipmentCodes']
    },
    {
      titleKey: 'therapeuticPlan.folder.schedule',
      descriptionKey: 'therapeuticPlan.folder.schedule.desc',
      fields: ['startDate', 'endDate', 'notes']
    }
  ];

  refreshAfterWizardClose(): void {
    this.searchPage?.search(false);
  }

  getFixedParams(): Record<string, string> {
    return this.fixedParams;
  }

  private toPatientOption(patient: any): { value: string; label: string } | null {
    const firstName = typeof patient?.firstName === 'string' ? patient.firstName.trim() : '';
    const lastName = typeof patient?.lastName === 'string' ? patient.lastName.trim() : '';
    const assistedId = typeof patient?.assistedId === 'string' ? patient.assistedId.trim() : '';
    const fullName = `${firstName} ${lastName}`.trim();
    const label = assistedId ? `${fullName} (${assistedId})` : fullName;
    return this.toNamedOption(label);
  }

  private toNamedOption(rawLabel: unknown): { value: string; label: string } | null {
    if (typeof rawLabel !== 'string') {
      return null;
    }

    const label = rawLabel.trim();
    if (!label) {
      return null;
    }

    return {
      value: label,
      label
    };
  }
}