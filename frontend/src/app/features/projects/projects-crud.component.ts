import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD progetti centralizzati da QTMDB.
 */
@Component({
  selector: 'app-projects-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" />`
})
export class ProjectsCrudComponent {
  titleKey = 'projects.title' as const;
  endpoint = 'projects';
  fields: CrudField[] = [
    { key: 'code', labelKey: 'projects.field.code', type: 'text', lockOnEdit: true },
    { key: 'tenantId', labelKey: 'projects.field.tenantId', type: 'number' },
    { key: 'tenant', labelKey: 'projects.field.tenant', type: 'text' },
    { key: 'descrizione', labelKey: 'projects.field.descrizione', type: 'text' },
    { key: 'dataInizio', labelKey: 'projects.field.dataInizio', type: 'date' },
    { key: 'dataFine', labelKey: 'projects.field.dataFine', type: 'date' }
  ];
}
