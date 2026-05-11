import { Component } from '@angular/core';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD infermieri tenant.
 */
@Component({
  selector: 'app-nurses-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `
    <app-crud-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [fields]="fields"
      [folders]="folders"
      [initialFormModel]="initialFormModel"
      [fieldPermissionsEndpoint]="permissionsEndpoint"
      [wizardMode]="true"
      [popupMode]="true"
      [closeRoute]="'/nurses/search'"
      [closeOnSave]="true"
    />
  `
})
export class NursesCrudComponent {
  titleKey = 'nurses.title' as const;
  endpoint = 'nurses';
  permissionsEndpoint = 'nurses/permissions';
  initialFormModel = {
    dataProcessingConsent: true,
    dataProcessingConsentDateTime: '',
    nurseConsentOtpCode: ''
  };
  fields: CrudField[] = [
    { key: 'nurseProjectId', labelKey: 'nurses.field.nurseProjectId', type: 'text' },
    { key: 'fullName', labelKey: 'nurses.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'nurses.field.email', type: 'text' },
    { key: 'primaryPhone', labelKey: 'nurses.field.primaryPhone', type: 'text' },
    { key: 'secondaryPhone', labelKey: 'nurses.field.secondaryPhone', type: 'text' },
    {
      key: 'regionId',
      labelKey: 'nurses.field.region',
      type: 'select',
      optionsEndpoint: 'geography/regions',
      optionValueKey: 'id',
      optionLabelKey: 'name',
      relatedFields: { region: 'name' },
      resetFieldsOnChange: ['provinceId', 'province', 'cityId', 'city']
    },
    { key: 'region', labelKey: 'nurses.field.region', type: 'text', hidden: true },
    {
      key: 'provinceId',
      labelKey: 'nurses.field.province',
      type: 'select',
      optionsEndpoint: 'geography/provinces/by-region/{regionId}',
      optionValueKey: 'id',
      optionLabelKey: 'name',
      relatedFields: { province: 'name' },
      resetFieldsOnChange: ['cityId', 'city']
    },
    { key: 'province', labelKey: 'nurses.field.province', type: 'text', hidden: true },
    {
      key: 'cityId',
      labelKey: 'nurses.field.city',
      type: 'select',
      optionsEndpoint: 'geography/cities/by-province/{provinceId}',
      optionValueKey: 'id',
      optionLabelKey: 'name',
      relatedFields: { city: 'name' }
    },
    { key: 'city', labelKey: 'nurses.field.city', type: 'text', hidden: true },
    { key: 'coverageArea', labelKey: 'nurses.field.coverageArea', type: 'text' },
    { key: 'referenceProvider', labelKey: 'nurses.field.referenceProvider', type: 'text' },
    { key: 'professionalRegister', labelKey: 'nurses.field.professionalRegister', type: 'text' },
    { key: 'enabled', labelKey: 'nurses.field.enabled', type: 'checkbox' },
    { key: 'dataProcessingConsent', labelKey: 'nurses.field.dataProcessingConsent', type: 'checkbox', readonly: true, required: true, hidden: true },
    { key: 'dataProcessingConsentDateTime', labelKey: 'nurses.field.dataProcessingConsentDateTime', type: 'datetime-local', readonly: true, required: true },
    {
      key: 'nurseConsentOtpSendAction',
      labelKey: 'nurses.privacy.otp.sendAction',
      type: 'action',
      transient: true,
      actionType: 'send-nurse-consent-otp',
      actionButtonStyle: 'secondary'
    },
    { key: 'nurseConsentOtpCode', labelKey: 'nurses.privacy.otp.code', type: 'text', transient: true },
    {
      key: 'nurseConsentOtpVerifyAction',
      labelKey: 'nurses.privacy.otp.verifyAction',
      type: 'action',
      transient: true,
      actionType: 'verify-nurse-consent-otp'
    }
  ];

  folders: CrudFolder[] = [
    {
      key: 'profile',
      titleKey: 'nurses.folder.profile',
      fields: [
        { key: 'nurseProjectId', labelKey: 'nurses.field.nurseProjectId', type: 'text' },
        { key: 'fullName', labelKey: 'nurses.field.fullName', type: 'text' },
        { key: 'email', labelKey: 'nurses.field.email', type: 'text' },
        { key: 'primaryPhone', labelKey: 'nurses.field.primaryPhone', type: 'text' },
        { key: 'secondaryPhone', labelKey: 'nurses.field.secondaryPhone', type: 'text' },
        {
          key: 'regionId',
          labelKey: 'nurses.field.region',
          type: 'select',
          optionsEndpoint: 'geography/regions',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { region: 'name' },
          resetFieldsOnChange: ['provinceId', 'province', 'cityId', 'city']
        },
        {
          key: 'provinceId',
          labelKey: 'nurses.field.province',
          type: 'select',
          optionsEndpoint: 'geography/provinces/by-region/{regionId}',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { province: 'name' },
          resetFieldsOnChange: ['cityId', 'city']
        },
        {
          key: 'cityId',
          labelKey: 'nurses.field.city',
          type: 'select',
          optionsEndpoint: 'geography/cities/by-province/{provinceId}',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { city: 'name' }
        },
        { key: 'coverageArea', labelKey: 'nurses.field.coverageArea', type: 'text' },
        { key: 'referenceProvider', labelKey: 'nurses.field.referenceProvider', type: 'text' },
        { key: 'professionalRegister', labelKey: 'nurses.field.professionalRegister', type: 'text' }
      ]
    },
    {
      key: 'status',
      titleKey: 'nurses.folder.status',
      fields: [
        { key: 'enabled', labelKey: 'nurses.field.enabled', type: 'checkbox' }
      ]
    },
    {
      key: 'privacy',
      titleKey: 'nurses.folder.privacy',
      fields: [
        { key: 'dataProcessingConsent', labelKey: 'nurses.field.dataProcessingConsent', type: 'checkbox', readonly: true, required: true, hidden: true },
        { key: 'dataProcessingConsentDateTime', labelKey: 'nurses.field.dataProcessingConsentDateTime', type: 'datetime-local', readonly: true, required: true },
        {
          key: 'nurseConsentOtpSendAction',
          labelKey: 'nurses.privacy.otp.sendAction',
          type: 'action',
          transient: true,
          actionType: 'send-nurse-consent-otp',
          actionButtonStyle: 'secondary'
        },
        { key: 'nurseConsentOtpCode', labelKey: 'nurses.privacy.otp.code', type: 'text', transient: true },
        {
          key: 'nurseConsentOtpVerifyAction',
          labelKey: 'nurses.privacy.otp.verifyAction',
          type: 'action',
          transient: true,
          actionType: 'verify-nurse-consent-otp'
        }
      ]
    }
  ];
}
