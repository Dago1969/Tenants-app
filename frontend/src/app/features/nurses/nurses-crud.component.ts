import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD infermieri tenant.
 */
@Component({
  selector: 'app-nurses-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" [fieldPermissionsEndpoint]="permissionsEndpoint" />`
})
export class NursesCrudComponent {
  titleKey = 'nurses.title' as const;
  endpoint = 'nurses';
  permissionsEndpoint = 'nurses/permissions';
  fields: CrudField[] = [
    { key: 'nurseProjectId', labelKey: 'nurses.field.nurseProjectId', type: 'text' },
    { key: 'fullName', labelKey: 'nurses.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'nurses.field.email', type: 'text' },
    { key: 'primaryPhone', labelKey: 'nurses.field.primaryPhone', type: 'text' },
    { key: 'secondaryPhone', labelKey: 'nurses.field.secondaryPhone', type: 'text' },
    { key: 'region', labelKey: 'nurses.field.region', type: 'text' },
    { key: 'province', labelKey: 'nurses.field.province', type: 'text' },
    { key: 'coverageArea', labelKey: 'nurses.field.coverageArea', type: 'text' },
    { key: 'referenceProvider', labelKey: 'nurses.field.referenceProvider', type: 'text' },
    { key: 'professionalRegister', labelKey: 'nurses.field.professionalRegister', type: 'text' },
    { key: 'enabled', labelKey: 'nurses.field.enabled', type: 'checkbox' }
  ];
}
