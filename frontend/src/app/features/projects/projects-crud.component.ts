import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';
import { AuthService } from '../../core/auth.service';
import { TenantPointerApiService, TenantAppPointerDto } from '../../core/tenant-pointer-api.service';

/**
 * Pagina CRUD progetti centralizzati da QTMDB.
 */
@Component({
  selector: 'app-projects-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" [initialFormModel]="formModel" />`
})
export class ProjectsCrudComponent {
  titleKey = 'projects.title' as const;
  endpoint = 'projects';
  fields: CrudField[] = [
    { key: 'code', labelKey: 'projects.field.code', type: 'text', lockOnEdit: true },
    // Mostra il client*code del tenant corrente come campo non modificabile
    { key: 'clientCode', labelKey: 'projects.field.clientCode', type: 'text', readonly: true },
    { key: 'tenant', labelKey: 'projects.field.tenant', type: 'text' },
    { key: 'descrizione', labelKey: 'projects.field.descrizione', type: 'text' },
    { key: 'dataInizio', labelKey: 'projects.field.dataInizio', type: 'date' },
    { key: 'dataFine', labelKey: 'projects.field.dataFine', type: 'date' }
  ];
  
  formModel: Record<string, any> = {};

  constructor(
    private readonly authService: AuthService,
    private readonly tenantPointerApi: TenantPointerApiService
  ) {
    const clientCode = this.authService.getSelectedClient();
    // eslint-disable-next-line no-console
    console.log('[ProjectsCrudComponent] Initializing /projects/new with selected clientCode:', clientCode);

    if (clientCode) {
      this.tenantPointerApi.getTenantPointerByClientCode(clientCode).subscribe({
        next: (tenant: TenantAppPointerDto | null) => {
          // eslint-disable-next-line no-console
          console.log('[ProjectsCrudComponent] Tenant pointer lookup result:', tenant);
          if (tenant) {
            this.formModel = {
              ...this.formModel,
              clientCode: tenant.clientCode,
              tenant: tenant.clientName,
              tenantId: tenant.id // <--- AGGIUNTO tenantId
            };
          } else {
            this.formModel = {
              ...this.formModel,
              clientCode,
              tenant: '',
              tenantId: null
            };
          }

          // eslint-disable-next-line no-console
          console.log('[ProjectsCrudComponent] Form model prepared for CRUD page:', this.formModel);
        },
        error: (err) => {
          this.formModel = {
            ...this.formModel,
            clientCode,
            tenant: '',
            tenantId: null
          };
          // eslint-disable-next-line no-console
          console.error('[ProjectsCrudComponent] Errore ricerca tenant pointer:', err);
        }
      });
      return;
    }

    // eslint-disable-next-line no-console
    console.warn('[ProjectsCrudComponent] Nessun clientCode selezionato; i campi tenant/clientCode resteranno vuoti.');
  }
}
