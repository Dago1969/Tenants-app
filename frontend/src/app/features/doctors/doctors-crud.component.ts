import { Component } from '@angular/core';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD dottori tenant.
 */
@Component({
  selector: 'app-doctors-crud',
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
      [closeRoute]="'/doctors/search'"
      [closeOnSave]="true"
    />
  `
})
export class DoctorsCrudComponent {
  titleKey = 'doctors.title' as const;
  endpoint = 'doctors';
  permissionsEndpoint = 'doctors/permissions';
  initialFormModel = {
    doctorTypeCode: 'MED',
    dataProcessingConsent: true,
    dataProcessingConsentDateTime: '',
    doctorConsentOtpCode: ''
  };
  fields: CrudField[] = [
    { key: 'doctorFlyerId', labelKey: 'doctors.field.doctorFlyerId', type: 'text', readonly: true },
    {
      key: 'doctorTypeCode',
      labelKey: 'doctors.field.doctorTypeCode',
      type: 'select',
      required: true,
      options: [
        { value: 'MED', label: 'doctors.option.type.med' },
        { value: 'INFOSP', label: 'doctors.option.type.infosp' },
        { value: 'STAFF', label: 'doctors.option.type.staff' }
      ]
    },
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
    {
      key: 'structureId',
      labelKey: 'doctors.field.associatedStructure',
      type: 'select',
      columnSpan: 2,
      optionsEndpoint: 'structures?structureType=HOSPITAL&parentStructureName={asl}&active=true',
      optionValueKey: 'id',
      optionLabelKey: 'name',
      resetFieldsOnChange: ['departmentId']
    },
    {
      key: 'aslId',
      labelKey: 'doctors.field.asl',
      type: 'select',
      optionsEndpoint: 'structures?structureType=ASL',
      optionValueKey: 'externalId',
      optionLabelKey: 'name',
      relatedFields: { asl: 'name' },
      resetFieldsOnChange: ['structureId', 'departmentId'],
      transient: true
    },
    { key: 'asl', labelKey: 'doctors.field.asl', type: 'text', hidden: true, transient: true },
    {
      key: 'departmentId',
      labelKey: 'doctors.field.departmentId',
      type: 'select',
      optionsEndpoint: 'structures/{structureId}/departments',
      optionValueKey: 'id',
      optionLabelKey: 'label'
    },
    { key: 'specialization', labelKey: 'doctors.field.specialization', type: 'text' },
    { key: 'dataProcessingConsent', labelKey: 'doctors.field.dataProcessingConsent', type: 'checkbox', readonly: true, required: true, hidden: true },
    { key: 'dataProcessingConsentDateTime', labelKey: 'doctors.field.dataProcessingConsentDateTime', type: 'datetime-local', readonly: true, required: true },
    {
      key: 'doctorConsentOtpSendAction',
      labelKey: 'doctors.privacy.otp.sendAction',
      type: 'action',
      transient: true,
      actionType: 'send-doctor-consent-otp',
      actionButtonStyle: 'secondary'
    },
    { key: 'doctorConsentOtpCode', labelKey: 'doctors.privacy.otp.code', type: 'text', transient: true },
    {
      key: 'doctorConsentOtpVerifyAction',
      labelKey: 'doctors.privacy.otp.verifyAction',
      type: 'action',
      transient: true,
      actionType: 'verify-doctor-consent-otp'
    },
    { key: 'dataProcessingConsentRevocationLog', labelKey: 'doctors.field.dataProcessingConsentRevocationLog', type: 'text' },
    { key: 'additionalConsents', labelKey: 'doctors.field.additionalConsents', type: 'text' }
  ];

  folders: CrudFolder[] = [
    {
      key: 'profile',
      titleKey: 'doctors.folder.profile',
      fields: [
        { key: 'doctorFlyerId', labelKey: 'doctors.field.doctorFlyerId', type: 'text', readonly: true },
        {
          key: 'doctorTypeCode',
          labelKey: 'doctors.field.doctorTypeCode',
          type: 'select',
          required: true,
          options: [
            { value: 'MED', label: 'doctors.option.type.med' },
            { value: 'INFOSP', label: 'doctors.option.type.infosp' },
            { value: 'STAFF', label: 'doctors.option.type.staff' }
          ]
        },
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
        { key: 'specialization', labelKey: 'doctors.field.specialization', type: 'text' }
      ]
    },
    {
      key: 'privacy',
      titleKey: 'doctors.folder.privacy',
      fields: [
        { key: 'dataProcessingConsent', labelKey: 'doctors.field.dataProcessingConsent', type: 'checkbox', readonly: true, required: true, hidden: true },
        { key: 'dataProcessingConsentDateTime', labelKey: 'doctors.field.dataProcessingConsentDateTime', type: 'datetime-local', readonly: true, required: true },
        {
          key: 'doctorConsentOtpSendAction',
          labelKey: 'doctors.privacy.otp.sendAction',
          type: 'action',
          transient: true,
          actionType: 'send-doctor-consent-otp',
          actionButtonStyle: 'secondary'
        },
        { key: 'doctorConsentOtpCode', labelKey: 'doctors.privacy.otp.code', type: 'text', transient: true },
        {
          key: 'doctorConsentOtpVerifyAction',
          labelKey: 'doctors.privacy.otp.verifyAction',
          type: 'action',
          transient: true,
          actionType: 'verify-doctor-consent-otp'
        },
        { key: 'dataProcessingConsentRevocationLog', labelKey: 'doctors.field.dataProcessingConsentRevocationLog', type: 'text' },
        { key: 'additionalConsents', labelKey: 'doctors.field.additionalConsents', type: 'text' }
      ]
    },
    {
      key: 'assignment',
      titleKey: 'doctors.folder.assignment',
      fields: [
        {
          key: 'aslId',
          labelKey: 'doctors.field.asl',
          type: 'select',
          optionsEndpoint: 'structures?structureType=ASL',
          optionValueKey: 'externalId',
          optionLabelKey: 'name',
          relatedFields: { asl: 'name' },
          resetFieldsOnChange: ['structureId', 'departmentId'],
          transient: true
        },
        {
          key: 'structureId',
          labelKey: 'doctors.field.associatedStructure',
          type: 'select',
          columnSpan: 2,
          optionsEndpoint: 'structures?structureType=HOSPITAL&parentStructureName={asl}&active=true',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          resetFieldsOnChange: ['departmentId']
        },
        {
          key: 'departmentId',
          labelKey: 'doctors.field.departmentId',
          type: 'select',
          optionsEndpoint: 'structures/{structureId}/departments',
          optionValueKey: 'id',
          optionLabelKey: 'label'
        }
      ]
    },
    {
      key: 'summary',
      titleKey: 'doctors.folder.summary',
      fields: [
        { key: 'doctorFlyerId', labelKey: 'doctors.field.doctorFlyerId', type: 'text', readonly: true },
        {
          key: 'doctorTypeCode',
          labelKey: 'doctors.field.doctorTypeCode',
          type: 'select',
          readonly: true,
          options: [
            { value: 'MED', label: 'doctors.option.type.med' },
            { value: 'INFOSP', label: 'doctors.option.type.infosp' },
            { value: 'STAFF', label: 'doctors.option.type.staff' }
          ]
        },
        { key: 'fullName', labelKey: 'doctors.field.fullName', type: 'text', readonly: true },
        { key: 'email', labelKey: 'doctors.field.email', type: 'text', readonly: true },
        { key: 'primaryPhone', labelKey: 'doctors.field.primaryPhone', type: 'text', readonly: true },
        { key: 'secondaryPhone', labelKey: 'doctors.field.secondaryPhone', type: 'text', readonly: true },
        {
          key: 'structureId',
          labelKey: 'doctors.field.associatedStructure',
          type: 'select',
          readonly: true,
          columnSpan: 2,
          optionsEndpoint: 'structures?structureType=HOSPITAL&parentStructureName={asl}&active=true',
          optionValueKey: 'id',
          optionLabelKey: 'name'
        },
        { key: 'asl', labelKey: 'doctors.field.asl', type: 'text', readonly: true, transient: true },
        {
          key: 'departmentId',
          labelKey: 'doctors.field.departmentId',
          type: 'select',
          readonly: true,
          optionsEndpoint: 'structures/{structureId}/departments',
          optionValueKey: 'id',
          optionLabelKey: 'label'
        },
        { key: 'specialization', labelKey: 'doctors.field.specialization', type: 'text', readonly: true },
        { key: 'dataProcessingConsentDateTime', labelKey: 'doctors.field.dataProcessingConsentDateTime', type: 'datetime-local', readonly: true }
      ]
    }
  ];
}
