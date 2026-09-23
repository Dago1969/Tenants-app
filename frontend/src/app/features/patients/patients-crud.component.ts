import { Component, OnInit } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';
import { StructureApiService, StructureDto } from '../../core/structure-api.service';

/**
 * Pagina CRUD pazienti tenant con selezione strutture filtrate per tipologia.
 */
@Component({
  selector: 'app-patients-crud',
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
      [closeRoute]="'/patients/search'"
      [closeOnSave]="true"
      [externalLoading]="!optionsReady"
    />
  `
})
export class PatientsCrudComponent implements OnInit {
  titleKey = 'patients.title' as const;
  endpoint = 'patients';
  permissionsEndpoint = 'patients/permissions';
  optionsReady = false;
  initialFormModel = {
    dataProcessingConsent: true,
    dataProcessingConsentDateTime: '',
    patientConsentOtpCode: '',
    otpRecipient: 'primaryPhone'
  };

  fields: CrudField[] = [
	// RIGA 1: assistedId (15 car), fiscalCode, lastName, firstName
		        { key: 'assistedId', labelKey: 'patients.field.assistedId', type: 'text', readonly: true, columnSpan: 1  },
		        { key: 'fiscalCode', labelKey: 'patients.field.fiscalCode', type: 'text' },
		        { key: 'lastName', labelKey: 'patients.field.lastName', type: 'text' },
		        { key: 'firstName', labelKey: 'patients.field.firstName', type: 'text' },

		        // RIGA 2: birthDate, gender
		        { key: 'birthDate', labelKey: 'patients.field.birthDate', type: 'date' },
		        {
		          key: 'gender',
		          labelKey: 'patients.field.gender',
		          type: 'select',
		          options: [
		            { value: 'M', label: 'patients.gender.male' },
		            { value: 'F', label: 'patients.gender.female' },
		            { value: 'OTHER', label: 'patients.gender.other' }
		          ]
		        },

		        // RIGA 3: email, primaryPhone (15 car), secondaryPhone (15 car)
				{ key: 'email', labelKey: 'patients.field.email', type: 'text', columnSpan: 2 },
				    { key: 'primaryPhone', labelKey: 'patients.field.primaryPhone', type: 'text', columnSpan: 1 },
				    { key: 'secondaryPhone', labelKey: 'patients.field.secondaryPhone', type: 'text', columnSpan: 1 },

		        // RIGA 4: caregiverFullName, caregiverPhone (15 car)
		        { key: 'caregiverFullName', labelKey: 'patients.field.caregiverFullName', type: 'text' },
		        { key: 'caregiverPhone', labelKey: 'patients.field.caregiverPhone', type: 'text', columnSpan: 3 },
				
	
    { key: 'deliveryAddress', labelKey: 'patients.field.deliveryAddress', type: 'text', columnSpan: 2 },
    { key: 'secondaryAddresses', labelKey: 'patients.field.secondaryAddresses', type: 'text', columnSpan: 2 , placeholder: 'DA DEFINIRE',  customClass: 'placeholder-red'},
    {
      key: 'communicationChannels',
      labelKey: 'patients.field.communicationChannels',
      type: 'select',
      columnSpan: 1,
      options: [
        { value: 'whatsapp', label: 'patients.communicationChannel.whatsapp' },
        { value: 'SMS', label: 'patients.communicationChannel.sms' },
        { value: 'EMail', label: 'patients.communicationChannel.email' }
      ]
    },
    { key: 'identificationDocumentReference', labelKey: 'patients.field.identificationDocumentReference', type: 'text', columnSpan: 2 ,placeholder: 'DA DEFINIRE' },
    { key: 'dataProcessingConsent', labelKey: 'patients.field.dataProcessingConsent', type: 'checkbox', readonly: true, required: true },
    { key: 'dataProcessingConsentDateTime', labelKey: 'patients.field.dataProcessingConsentDateTime', type: 'datetime-local', readonly: true, required: true },
    { key: 'dataProcessingConsentRevocationLog', labelKey: 'patients.field.dataProcessingConsentRevocationLog', type: 'text' },
    { key: 'additionalConsents', labelKey: 'patients.field.additionalConsents', type: 'text' },
    { key: 'patientConsentOtpCode', labelKey: 'patients.privacy.otp.code', type: 'text', transient: true, columnSpan: 2 },
    {
      key: 'patientConsentOtpSendAction',
      labelKey: 'patients.privacy.otp.sendAction',
      type: 'action',
      transient: true,
      actionType: 'send-patient-consent-otp',
      actionButtonStyle: 'secondary'
    },
    {
      key: 'patientConsentOtpVerifyAction',
      labelKey: 'patients.privacy.otp.verifyAction',
      type: 'action',
      transient: true,
      actionType: 'verify-patient-consent-otp'
    },
    {
      key: 'clinicalRegionCode',
      labelKey: 'patients.field.region',
      type: 'select',
      optionsEndpoint: 'geography/regions',
      optionValueKey: 'id',
      optionLabelKey: 'name',
      relatedFields: { region: 'name' },
      resetFieldsOnChange: ['aslId', 'asl', 'aslCode', 'structureId', 'departmentId', 'ticketStructureCode'],
      transient: true
    },
    {
      key: 'aslId',
      labelKey: 'patients.field.asl',
      type: 'select',
      optionsEndpoint: 'structures/overview?regionCode={clinicalRegionCode}',
      optionValueKey: 'aslId',
      optionLabelKey: 'asl',
      relatedFields: { asl: 'asl', aslCode: 'codiceAsl' },
      resetFieldsOnChange: ['structureId', 'departmentId', 'ticketStructureCode'],
      transient: true
    },
    { key: 'asl', labelKey: 'patients.field.asl', type: 'text', hidden: true, transient: true },
    { key: 'aslCode', labelKey: 'patients.field.asl', type: 'text', hidden: true, transient: true },
    {
      key: 'structureId',
      labelKey: 'patients.field.referenceHospitalStructure',
      type: 'select',
      columnSpan: 2,
      optionsEndpoint: 'structures/overview?regionCode={clinicalRegionCode}&aslCode={aslCode}',
      optionValueKey: 'strutturaId',
      optionLabelKey: 'struttura',
      relatedFields: { ticketStructureCode: 'codiceStruttura' },
      resetFieldsOnChange: ['departmentId']
    },
    {
      key: 'departmentId',
      labelKey: 'patients.field.departmentId',
      type: 'select',
      optionsEndpoint: 'structures/{structureId}/departments',
      optionValueKey: 'id',
      optionLabelKey: 'label',
      resetFieldsOnChange: ['prescribingSpecialist']
    },
    {
      key: 'prescribingSpecialist',
      labelKey: 'patients.field.prescribingSpecialist',
      type: 'select',
      optionsEndpoint: 'doctors?departmentId={departmentId}&structureId={structureId}',
      optionValueKey: 'id',
      optionLabelKey: 'fullName'
    },
	{ key: 'therapyStatus', labelKey: 'patients.field.therapyStatus', type: 'text' },
    { key: 'referencePharmacy', labelKey: 'patients.field.referencePharmacy', type: 'select' },
    { key: 'preferredPickupPharmacy', labelKey: 'patients.field.preferredPickupPharmacy', type: 'select' },
    { key: 'deliveryMode', labelKey: 'patients.field.deliveryMode', type: 'text' },
    { key: 'reminderEnabled', labelKey: 'patients.field.reminderEnabled', type: 'checkbox' },
    { key: 'preferredContact', labelKey: 'patients.field.preferredContact', type: 'text' },
    
  ];

  folders: CrudFolder[] = [
    {
      key: 'identity',
      titleKey: 'patients.folder.identity',
      fields: [
		// RIGA 1: assistedId (15 car), fiscalCode, lastName, firstName
	        { key: 'assistedId', labelKey: 'patients.field.assistedId', type: 'text', readonly: true, columnSpan: 1  },
	        { key: 'fiscalCode', labelKey: 'patients.field.fiscalCode', type: 'text' },
	        { key: 'lastName', labelKey: 'patients.field.lastName', type: 'text' },
	        { key: 'firstName', labelKey: 'patients.field.firstName', type: 'text' },

	        // RIGA 2: birthDate, gender
	        { key: 'birthDate', labelKey: 'patients.field.birthDate', type: 'date' },
	        {
	          key: 'gender',
	          labelKey: 'patients.field.gender',
	          type: 'select',
	          options: [
	            { value: 'M', label: 'patients.gender.male' },
	            { value: 'F', label: 'patients.gender.female' },
	            { value: 'OTHER', label: 'patients.gender.other' }
	          ]
	        },

	        // RIGA 3: email, primaryPhone (15 car), secondaryPhone (15 car)
			{ key: 'email', labelKey: 'patients.field.email', type: 'text', columnSpan: 2 },
			    { key: 'primaryPhone', labelKey: 'patients.field.primaryPhone', type: 'text', columnSpan: 1 },
			    { key: 'secondaryPhone', labelKey: 'patients.field.secondaryPhone', type: 'text', columnSpan: 1 },

	        // RIGA 4: caregiverFullName, caregiverPhone (15 car)
	        { key: 'caregiverFullName', labelKey: 'patients.field.caregiverFullName', type: 'text' },
	        { key: 'caregiverPhone', labelKey: 'patients.field.caregiverPhone', type: 'text' },
			
			
        { key: 'caregiverFullName', labelKey: 'patients.field.caregiverFullName', type: 'text' },
        { key: 'caregiverPhone', labelKey: 'patients.field.caregiverPhone', type: 'text' },
        {
          key: 'regionId',
          labelKey: 'patients.field.region',
          type: 'select',
          optionsEndpoint: 'geography/regions',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { region: 'name' },
          resetFieldsOnChange: ['provinceId', 'province', 'cityId', 'city']
        },
        {
          key: 'provinceId',
          labelKey: 'patients.field.province',
          type: 'select',
          optionsEndpoint: 'geography/provinces/by-region/{regionId}',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { province: 'name' },
          resetFieldsOnChange: ['cityId', 'city']
        },
        {
          key: 'cityId',
          labelKey: 'patients.field.city',
          type: 'select',
          optionsEndpoint: 'geography/cities/by-province/{provinceId}',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { city: 'name' }
        },
		{ 
		  key: 'deliveryAddress', 
		  labelKey: 'patients.field.deliveryAddress', 
		  type: 'text', 
		  columnSpan: 2,
		  placeholder: 'DA DEFINIRE'
		},
        { key: 'secondaryAddresses', labelKey: 'patients.field.secondaryAddresses', type: 'text', columnSpan: 2, placeholder: 'DA DEFINIRE',  customClass: 'placeholder-red'  },
       
        { key: 'identificationDocumentReference', labelKey: 'patients.field.identificationDocumentReference', type: 'text', columnSpan: 2, placeholder: 'DA DEFINIRE',  customClass: 'placeholder-red' }
      ]
    },
    {
      key: 'privacy',
      titleKey: 'patients.folder.privacy',
      fields: [
        { key: 'dataProcessingConsent', labelKey: 'patients.field.dataProcessingConsent', type: 'checkbox', readonly: true, required: true, columnSpan: 1 },
		{
	         key: 'communicationChannels',
	         labelKey: 'patients.field.communicationChannels',
	         type: 'select',
	         columnSpan: 1,
	         options: [
	           { value: 'whatsapp', label: 'patients.communicationChannel.whatsapp' },
	           { value: 'SMS', label: 'patients.communicationChannel.sms' },
	           { value: 'EMail', label: 'patients.communicationChannel.email' }
	         ]
	       },
		 {
          key: 'otpRecipient',
          labelKey: 'patients.field.otpRecipient',
          type: 'select',
		  columnSpan: 2,
          transient: true,
          options: [
            { value: 'primaryPhone', label: 'patients.otp.recipient.primary' },
            { value: 'caregiverPhone', label: 'patients.otp.recipient.caregiver' }
          ]
        },
        {
          key: 'patientConsentOtpSendAction',
          labelKey: 'patients.privacy.otp.sendAction',
          type: 'action',
          transient: true,
          actionType: 'send-patient-consent-otp'
        },
        { key: 'patientConsentOtpCode', labelKey: 'patients.privacy.otp.code', type: 'text', transient: true, columnSpan: 2},
        {
          key: 'patientConsentOtpVerifyAction',
          labelKey: 'patients.privacy.otp.verifyAction',
          type: 'action',
          transient: true,
          actionType: 'verify-patient-consent-otp'
        },
        { key: 'dataProcessingConsentDateTime', labelKey: 'patients.field.dataProcessingConsentDateTime', type: 'datetime-local', readonly: true, required: true },
        { key: 'dataProcessingConsentRevocationLog', labelKey: 'patients.field.dataProcessingConsentRevocationLog', type: 'text' , placeholder: 'DA DEFINIRE',  customClass: 'placeholder-red' },
        { key: 'additionalConsents', labelKey: 'patients.field.additionalConsents', type: 'text', placeholder: 'DA DEFINIRE',  customClass: 'placeholder-red'  }
      ]
    },
    {
      key: 'medical',
      titleKey: 'patients.folder.medical',
      fields: [
        {
          key: 'clinicalRegionCode',
          labelKey: 'patients.field.region',
          type: 'select',
          optionsEndpoint: 'geography/regions',
          optionValueKey: 'id',
          optionLabelKey: 'name',
          relatedFields: { region: 'name' },
          resetFieldsOnChange: ['aslId', 'asl', 'aslCode', 'structureId', 'departmentId', 'ticketStructureCode'],
          transient: true
        },
        {
          key: 'aslId',
          labelKey: 'patients.field.asl',
          type: 'select',
          optionsEndpoint: 'structures/overview?regionCode={clinicalRegionCode}',
          optionValueKey: 'aslId',
          optionLabelKey: 'asl',
          relatedFields: { asl: 'asl', aslCode: 'codiceAsl' },
          resetFieldsOnChange: ['structureId', 'departmentId', 'ticketStructureCode'],
          transient: true
        },
        { key: 'asl', labelKey: 'patients.field.asl', type: 'text', hidden: true, transient: true },
        { key: 'aslCode', labelKey: 'patients.field.asl', type: 'text', hidden: true, transient: true },
        {
          key: 'structureId',
          labelKey: 'patients.field.referenceHospitalStructure',
          type: 'select',
          columnSpan: 2,
          optionsEndpoint: 'structures/overview?regionCode={clinicalRegionCode}&aslCode={aslCode}',
          optionValueKey: 'strutturaId',
          optionLabelKey: 'struttura',
          relatedFields: { ticketStructureCode: 'codiceStruttura' },
          resetFieldsOnChange: ['departmentId']
        },
        {
          key: 'departmentId',
          labelKey: 'patients.field.departmentId',
          type: 'select',
          optionsEndpoint: 'structures/{structureId}/departments',
          optionValueKey: 'id',
          optionLabelKey: 'label',
          resetFieldsOnChange: ['prescribingSpecialist']
        },
		{
		  key: 'prescribingSpecialist',
		  labelKey: 'patients.field.prescribingSpecialist',
		  type: 'select',
		  optionsEndpoint: 'doctors?departmentId={departmentId}&structureId={structureId}',
		  optionValueKey: 'id',
		  optionLabelKey: 'fullName'
		},
		{ key: 'therapyStatus', labelKey: 'patients.field.therapyStatus', type: 'text' },
        { key: 'referencePharmacy', labelKey: 'patients.field.referencePharmacy', type: 'select' },
        { key: 'preferredPickupPharmacy', labelKey: 'patients.field.preferredPickupPharmacy', type: 'select' },
        { key: 'deliveryMode', labelKey: 'patients.field.deliveryMode', type: 'text' , placeholder: 'DA DEFINIRE',  customClass: 'placeholder-red' },
        { key: 'reminderEnabled', labelKey: 'patients.field.reminderEnabled', type: 'checkbox' },
        { key: 'preferredContact', labelKey: 'patients.field.preferredContact', type: 'text' , placeholder: 'DA DEFINIRE',  customClass: 'placeholder-red' }
      ]
    }
  ];

  constructor(private readonly structureApiService: StructureApiService) {}

  ngOnInit(): void {
    forkJoin([
      this.loadStructuresForType('HOSPITAL_PHARMACY'),
      this.loadStructuresForType('RETAIL_PHARMACY')
    ]).subscribe({
      next: ([hospitalPharmacies, retailPharmacies]) => {
        const pharmacyOptions = this.toSelectOptions([...hospitalPharmacies, ...retailPharmacies]);
        this.applySelectOptions('referencePharmacy', pharmacyOptions);
        this.applySelectOptions('preferredPickupPharmacy', pharmacyOptions);
        this.optionsReady = true;
      },
      error: () => {
        this.optionsReady = true;
      }
    });
  }

  private loadStructuresForType(structureType: string): Observable<StructureDto[]> {
    return this.structureApiService.getStructuresByType(structureType, true).pipe(
      catchError(() => of([] as StructureDto[]))
    );
  }

  private toSelectOptions(structures: StructureDto[]): Array<{ value: string; label: string }> {
    return structures
      .map((structure) => ({
        value: structure.selectionLabel?.trim().length ? structure.selectionLabel : structure.name,
        label: structure.selectionLabel?.trim().length ? structure.selectionLabel : structure.name
      }))
      .filter((option) => option.value.trim().length > 0)
      .sort((left, right) => left.label.localeCompare(right.label, 'it', { sensitivity: 'base' }));
  }

  private applySelectOptions(fieldKey: string, options: Array<{ value: string; label: string }>): void {
    for (const field of this.getAllFields().filter((currentField) => currentField.key === fieldKey)) {
      field.options = options;
    }
  }

  private getAllFields(): CrudField[] {
    return [...this.fields, ...this.folders.flatMap((folder) => folder.fields)];
  }
}
