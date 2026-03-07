import { Component } from '@angular/core';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD pazienti tenant.
 */
@Component({
  selector: 'app-patients-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" [folders]="folders" [fieldPermissionsEndpoint]="permissionsEndpoint" />`
})
export class PatientsCrudComponent {
  titleKey = 'patients.title' as const;
  endpoint = 'patients';
  permissionsEndpoint = 'patients/permissions';

  fields: CrudField[] = [
    { key: 'assistedId', labelKey: 'patients.field.assistedId', type: 'text', readonly: true },
    { key: 'firstName', labelKey: 'patients.field.firstName', type: 'text' },
    { key: 'lastName', labelKey: 'patients.field.lastName', type: 'text' },
    { key: 'email', labelKey: 'patients.field.email', type: 'text' },
    { key: 'primaryPhone', labelKey: 'patients.field.primaryPhone', type: 'text' },
    { key: 'secondaryPhone', labelKey: 'patients.field.secondaryPhone', type: 'text' },
    { key: 'region', labelKey: 'patients.field.region', type: 'text' },
    { key: 'province', labelKey: 'patients.field.province', type: 'text' },
    { key: 'deliveryAddress', labelKey: 'patients.field.deliveryAddress', type: 'text' },
    { key: 'secondaryAddresses', labelKey: 'patients.field.secondaryAddresses', type: 'text' },
    { key: 'communicationChannels', labelKey: 'patients.field.communicationChannels', type: 'text' },
    { key: 'fiscalCode', labelKey: 'patients.field.fiscalCode', type: 'text' },
    { key: 'identificationDocumentReference', labelKey: 'patients.field.identificationDocumentReference', type: 'text' },
    { key: 'dataProcessingConsent', labelKey: 'patients.field.dataProcessingConsent', type: 'checkbox' },
    { key: 'dataProcessingConsentDateTime', labelKey: 'patients.field.dataProcessingConsentDateTime', type: 'datetime-local' },
    { key: 'dataProcessingConsentRevocationLog', labelKey: 'patients.field.dataProcessingConsentRevocationLog', type: 'text' },
    { key: 'additionalConsents', labelKey: 'patients.field.additionalConsents', type: 'text' },
    { key: 'therapyStatus', labelKey: 'patients.field.therapyStatus', type: 'text' },
    { key: 'prescribingSpecialist', labelKey: 'patients.field.prescribingSpecialist', type: 'text' },
    { key: 'referenceHospitalStructure', labelKey: 'patients.field.referenceHospitalStructure', type: 'text' },
    { key: 'referencePharmacy', labelKey: 'patients.field.referencePharmacy', type: 'text' },
    { key: 'preferredPickupPharmacy', labelKey: 'patients.field.preferredPickupPharmacy', type: 'text' },
    { key: 'deliveryMode', labelKey: 'patients.field.deliveryMode', type: 'text' },
    { key: 'reminderEnabled', labelKey: 'patients.field.reminderEnabled', type: 'checkbox' },
    { key: 'caregiverFullName', labelKey: 'patients.field.caregiverFullName', type: 'text' },
    { key: 'caregiverPhone', labelKey: 'patients.field.caregiverPhone', type: 'text' },
    { key: 'preferredContact', labelKey: 'patients.field.preferredContact', type: 'text' },
    { key: 'structureId', labelKey: 'patients.field.structureId', type: 'number' }
  ];

  folders: CrudFolder[] = [
    {
      key: 'identity',
      titleKey: 'patients.folder.identity',
      fields: [
        { key: 'assistedId', labelKey: 'patients.field.assistedId', type: 'text', readonly: true },
        { key: 'firstName', labelKey: 'patients.field.firstName', type: 'text' },
        { key: 'lastName', labelKey: 'patients.field.lastName', type: 'text' },
        { key: 'email', labelKey: 'patients.field.email', type: 'text' },
        { key: 'primaryPhone', labelKey: 'patients.field.primaryPhone', type: 'text' },
        { key: 'secondaryPhone', labelKey: 'patients.field.secondaryPhone', type: 'text' },
        { key: 'region', labelKey: 'patients.field.region', type: 'text' },
        { key: 'province', labelKey: 'patients.field.province', type: 'text' },
        { key: 'deliveryAddress', labelKey: 'patients.field.deliveryAddress', type: 'text' },
        { key: 'secondaryAddresses', labelKey: 'patients.field.secondaryAddresses', type: 'text' },
        { key: 'communicationChannels', labelKey: 'patients.field.communicationChannels', type: 'text' },
        { key: 'fiscalCode', labelKey: 'patients.field.fiscalCode', type: 'text' },
        { key: 'identificationDocumentReference', labelKey: 'patients.field.identificationDocumentReference', type: 'text' }
      ]
    },
    {
      key: 'privacy',
      titleKey: 'patients.folder.privacy',
      fields: [
        { key: 'dataProcessingConsent', labelKey: 'patients.field.dataProcessingConsent', type: 'checkbox' },
        { key: 'dataProcessingConsentDateTime', labelKey: 'patients.field.dataProcessingConsentDateTime', type: 'datetime-local' },
        { key: 'dataProcessingConsentRevocationLog', labelKey: 'patients.field.dataProcessingConsentRevocationLog', type: 'text' },
        { key: 'additionalConsents', labelKey: 'patients.field.additionalConsents', type: 'text' }
      ]
    },
    {
      key: 'medical',
      titleKey: 'patients.folder.medical',
      fields: [
        { key: 'therapyStatus', labelKey: 'patients.field.therapyStatus', type: 'text' },
        { key: 'prescribingSpecialist', labelKey: 'patients.field.prescribingSpecialist', type: 'text' },
        { key: 'referenceHospitalStructure', labelKey: 'patients.field.referenceHospitalStructure', type: 'text' },
        { key: 'referencePharmacy', labelKey: 'patients.field.referencePharmacy', type: 'text' },
        { key: 'preferredPickupPharmacy', labelKey: 'patients.field.preferredPickupPharmacy', type: 'text' },
        { key: 'deliveryMode', labelKey: 'patients.field.deliveryMode', type: 'text' },
        { key: 'reminderEnabled', labelKey: 'patients.field.reminderEnabled', type: 'checkbox' },
        { key: 'caregiverFullName', labelKey: 'patients.field.caregiverFullName', type: 'text' },
        { key: 'caregiverPhone', labelKey: 'patients.field.caregiverPhone', type: 'text' },
        { key: 'preferredContact', labelKey: 'patients.field.preferredContact', type: 'text' },
        { key: 'structureId', labelKey: 'patients.field.structureId', type: 'number' }
      ]
    }
  ];
}
