import { Component } from '@angular/core';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD dottori tenant.
 */
@Component({
  selector: 'app-doctors-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" [folders]="folders" [fieldPermissionsEndpoint]="permissionsEndpoint" />`
})
export class DoctorsCrudComponent {
  titleKey = 'doctors.title' as const;
  endpoint = 'doctors';
  permissionsEndpoint = 'doctors/permissions';
  fields: CrudField[] = [
    { key: 'doctorFlyerId', labelKey: 'doctors.field.doctorFlyerId', type: 'text' },
    { key: 'fullName', labelKey: 'doctors.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'doctors.field.email', type: 'text' },
    { key: 'primaryPhone', labelKey: 'doctors.field.primaryPhone', type: 'text' },
    { key: 'secondaryPhone', labelKey: 'doctors.field.secondaryPhone', type: 'text' },
    {
      key: 'regionId',
      labelKey: 'doctors.field.region',
      type: 'select',
      optionsEndpoint: 'geography/regions',
      optionValueKey: 'id',
      optionLabelKey: 'name',
      relatedFields: { region: 'name' },
      resetFieldsOnChange: ['provinceId', 'province', 'cityId', 'city']
    },
    { key: 'region', labelKey: 'doctors.field.region', type: 'text', hidden: true },
    {
      key: 'provinceId',
      labelKey: 'doctors.field.province',
      type: 'select',
      optionsEndpoint: 'geography/provinces/by-region/{regionId}',
      optionValueKey: 'id',
      optionLabelKey: 'name',
      relatedFields: { province: 'name' },
      resetFieldsOnChange: ['cityId', 'city']
    },
    { key: 'province', labelKey: 'doctors.field.province', type: 'text', hidden: true },
    {
      key: 'cityId',
      labelKey: 'doctors.field.city',
      type: 'select',
      optionsEndpoint: 'geography/cities/by-province/{provinceId}',
      optionValueKey: 'id',
      optionLabelKey: 'name',
      relatedFields: { city: 'name' }
    },
    { key: 'city', labelKey: 'doctors.field.city', type: 'text', hidden: true },
    { key: 'deliveryAddress', labelKey: 'doctors.field.deliveryAddress', type: 'text' },
    { key: 'secondaryAddresses', labelKey: 'doctors.field.secondaryAddresses', type: 'text' },
    { key: 'structureId', labelKey: 'doctors.field.structureId', type: 'number' },
    { key: 'specialization', labelKey: 'doctors.field.specialization', type: 'text' },
    { key: 'dataProcessingConsent', labelKey: 'doctors.field.dataProcessingConsent', type: 'checkbox' },
    { key: 'dataProcessingConsentDateTime', labelKey: 'doctors.field.dataProcessingConsentDateTime', type: 'datetime-local' },
    { key: 'dataProcessingConsentRevocationLog', labelKey: 'doctors.field.dataProcessingConsentRevocationLog', type: 'text' },
    { key: 'additionalConsents', labelKey: 'doctors.field.additionalConsents', type: 'text' }
  ];

  folders: CrudFolder[] = [
    {
      key: 'profile',
      titleKey: 'doctors.folder.profile',
      fields: [
        { key: 'doctorFlyerId', labelKey: 'doctors.field.doctorFlyerId', type: 'text' },
        { key: 'fullName', labelKey: 'doctors.field.fullName', type: 'text' },
        { key: 'email', labelKey: 'doctors.field.email', type: 'text' },
        { key: 'primaryPhone', labelKey: 'doctors.field.primaryPhone', type: 'text' },
        { key: 'secondaryPhone', labelKey: 'doctors.field.secondaryPhone', type: 'text' },
        {
          key: 'regionId',
          labelKey: 'doctors.field.region',
          type: 'select',
          optionsEndpoint: 'geography/regions',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { region: 'name' },
          resetFieldsOnChange: ['provinceId', 'province', 'cityId', 'city']
        },
        {
          key: 'provinceId',
          labelKey: 'doctors.field.province',
          type: 'select',
          optionsEndpoint: 'geography/provinces/by-region/{regionId}',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { province: 'name' },
          resetFieldsOnChange: ['cityId', 'city']
        },
        {
          key: 'cityId',
          labelKey: 'doctors.field.city',
          type: 'select',
          optionsEndpoint: 'geography/cities/by-province/{provinceId}',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { city: 'name' }
        },
        { key: 'deliveryAddress', labelKey: 'doctors.field.deliveryAddress', type: 'text' },
        { key: 'secondaryAddresses', labelKey: 'doctors.field.secondaryAddresses', type: 'text' },
        { key: 'structureId', labelKey: 'doctors.field.structureId', type: 'number' },
        { key: 'specialization', labelKey: 'doctors.field.specialization', type: 'text' }
      ]
    },
    {
      key: 'privacy',
      titleKey: 'doctors.folder.privacy',
      fields: [
        { key: 'dataProcessingConsent', labelKey: 'doctors.field.dataProcessingConsent', type: 'checkbox' },
        { key: 'dataProcessingConsentDateTime', labelKey: 'doctors.field.dataProcessingConsentDateTime', type: 'datetime-local' },
        { key: 'dataProcessingConsentRevocationLog', labelKey: 'doctors.field.dataProcessingConsentRevocationLog', type: 'text' },
        { key: 'additionalConsents', labelKey: 'doctors.field.additionalConsents', type: 'text' }
      ]
    }
  ];
}
