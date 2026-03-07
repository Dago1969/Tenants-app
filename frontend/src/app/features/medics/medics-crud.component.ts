import { Component } from '@angular/core';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD medici tenant.
 */
@Component({
  selector: 'app-medics-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" [folders]="folders" [fieldPermissionsEndpoint]="permissionsEndpoint" />`
})
export class MedicsCrudComponent {
  titleKey = 'medics.title' as const;
  endpoint = 'medics';
  permissionsEndpoint = 'medics/permissions';
  fields: CrudField[] = [
    { key: 'doctorFlyerId', labelKey: 'medics.field.doctorFlyerId', type: 'text' },
    { key: 'fullName', labelKey: 'medics.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'medics.field.email', type: 'text' },
    { key: 'primaryPhone', labelKey: 'medics.field.primaryPhone', type: 'text' },
    { key: 'secondaryPhone', labelKey: 'medics.field.secondaryPhone', type: 'text' },
    { key: 'region', labelKey: 'medics.field.region', type: 'text' },
    { key: 'province', labelKey: 'medics.field.province', type: 'text' },
    { key: 'deliveryAddress', labelKey: 'medics.field.deliveryAddress', type: 'text' },
    { key: 'secondaryAddresses', labelKey: 'medics.field.secondaryAddresses', type: 'text' },
    { key: 'structureId', labelKey: 'medics.field.structureId', type: 'number' },
    { key: 'specialization', labelKey: 'medics.field.specialization', type: 'text' },
    { key: 'dataProcessingConsent', labelKey: 'medics.field.dataProcessingConsent', type: 'checkbox' },
    { key: 'dataProcessingConsentDateTime', labelKey: 'medics.field.dataProcessingConsentDateTime', type: 'datetime-local' },
    { key: 'dataProcessingConsentRevocationLog', labelKey: 'medics.field.dataProcessingConsentRevocationLog', type: 'text' },
    { key: 'additionalConsents', labelKey: 'medics.field.additionalConsents', type: 'text' }
  ];

  folders: CrudFolder[] = [
    {
      key: 'profile',
      titleKey: 'medics.folder.profile',
      fields: [
        { key: 'doctorFlyerId', labelKey: 'medics.field.doctorFlyerId', type: 'text' },
        { key: 'fullName', labelKey: 'medics.field.fullName', type: 'text' },
        { key: 'email', labelKey: 'medics.field.email', type: 'text' },
        { key: 'primaryPhone', labelKey: 'medics.field.primaryPhone', type: 'text' },
        { key: 'secondaryPhone', labelKey: 'medics.field.secondaryPhone', type: 'text' },
        { key: 'region', labelKey: 'medics.field.region', type: 'text' },
        { key: 'province', labelKey: 'medics.field.province', type: 'text' },
        { key: 'deliveryAddress', labelKey: 'medics.field.deliveryAddress', type: 'text' },
        { key: 'secondaryAddresses', labelKey: 'medics.field.secondaryAddresses', type: 'text' },
        { key: 'structureId', labelKey: 'medics.field.structureId', type: 'number' },
        { key: 'specialization', labelKey: 'medics.field.specialization', type: 'text' }
      ]
    },
    {
      key: 'privacy',
      titleKey: 'medics.folder.privacy',
      fields: [
        { key: 'dataProcessingConsent', labelKey: 'medics.field.dataProcessingConsent', type: 'checkbox' },
        { key: 'dataProcessingConsentDateTime', labelKey: 'medics.field.dataProcessingConsentDateTime', type: 'datetime-local' },
        { key: 'dataProcessingConsentRevocationLog', labelKey: 'medics.field.dataProcessingConsentRevocationLog', type: 'text' },
        { key: 'additionalConsents', labelKey: 'medics.field.additionalConsents', type: 'text' }
      ]
    }
  ];
}
