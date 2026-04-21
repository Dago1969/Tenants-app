// ...import e interfacce...
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StructureApiService, StructureDto } from '../../core/structure-api.service';
import { MessageKey, t } from '../../i18n/messages';
import { PatientContactsSearchComponent } from '../patient-contacts-search/patient-contacts-search.component';
import { QtmStepModalComponent } from '../../shared/qtm-step-modal.component';

interface TherapeuticPlanManageResponse {
  id?: number;
  patientId: number | null;
  projectCode: string;
  equipmentIds: number[];
  structureId: number | null;
  nurseId: number | null;
  doctorId: number | null;
  drugCode: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
  // Campo che può contenere un JSON di grandi dimensioni associato al piano terapeutico
  jsonVisit?: string | null;
}

interface TherapeuticPlanPatient {
  id: number;
  assistedId?: string;
  firstName?: string;
  lastName?: string;
  fiscalCode?: string;
  email?: string;
  primaryPhone?: string;
  city?: string;
  province?: string;
  deliveryAddress?: string;
  preferredContact?: string;
  prescribingSpecialist?: string;
  caregiverFullName?: string;
  caregiverPhone?: string;
  gender?: string; // M/F/Altro
  birthDate?: string; // ISO date
}

interface TherapeuticPlanNurse {
  id: number;
  fullName: string;
}

interface TherapeuticPlanDoctor {
  id: number;
  fullName: string;
  specialization?: string;
}

interface TherapeuticPlanEquipment {
  id: number;
  code: string;
  equipmentTypeName?: string;
  status: string;
  serialNumber?: string;
}

interface TherapeuticPlanManageTab {
  key: 'summary' | 'patient' | 'modules' | 'visits' | 'activity-booking' | 'contact-requests';
  titleKey: MessageKey;
}

interface TherapeuticPlanSummarySubTab {
  key: 'notifications' | 'alerts';
  titleKey: MessageKey;
}

interface TherapeuticPlanManageOption {
  value: string;
  titleKey: MessageKey;
}

interface TherapeuticPlanAlert {
  id?: number;
  therapeuticPlanId: number;
  doctorId: number | null;
  doctorName?: string;
  date: string;
  subject: string;
  confirmationRequired: boolean;
  confirmationSent: string;
}

interface TherapeuticPlanAlertForm {
  date: string;
  subject: string;
  confirmationRequired: boolean;
  confirmationSent: 'yes' | 'no' | 'na';
}

type TherapeuticPlanPegReplacementReason = 'complaint' | 'planned';

interface TherapeuticPlanPegHistoryRecord {
  id: number;
  model: string;
  insertionDate: string;
  firstPeg: boolean;
  replacementReason: TherapeuticPlanPegReplacementReason | null;
}

interface TherapeuticPlanPegHistoryForm {
  model: string;
  insertionDate: string;
  firstPeg: boolean;
  replacementReason: '' | TherapeuticPlanPegReplacementReason;
}

type TherapeuticPlanMovementOperation = 'atPatient' | 'pickupFromPatient';

interface TherapeuticPlanMovementRecord {
  id: number;
  pumpNumber: string;
  medicine: string;
  movementDate: string;
  operation: TherapeuticPlanMovementOperation;
  note: string;
  expiryDate: string;
  broken: boolean;
}

interface TherapeuticPlanMovementForm {
  pumpNumber: string;
  medicine: string;
  movementDate: string;
  operation: TherapeuticPlanMovementOperation;
  note: string;
  expiryDate: string;
  broken: boolean;
}

type TherapeuticPlanVisitType = 'outpatient' | 'remote' | 'home' | 'followUpCenter' | 'trainingCenter';

type TherapeuticPlanVisitCaregiver = 'child' | 'spouse' | 'relative' | 'other';

type TherapeuticPlanVisitPriority = 'none' | 'low' | 'medium' | 'high';

interface TherapeuticPlanVisitRecord {
  id: number;
  patientFirstName: string;
  patientLastName: string;
  duodopaTherapyStartDate: string;
  caregiver: TherapeuticPlanVisitCaregiver;
  clinicalCenter: string;
  neurologist: string;
  gastroenterologist: string;
  date: string;
  type: TherapeuticPlanVisitType;
  priority: TherapeuticPlanVisitPriority;
  nurse: string;
  nurseSignature: string;
  stomiaStatus: TherapeuticPlanVisitStomiaStatus;
  stomiaActions: TherapeuticPlanVisitStomiaActions;
  pegjStatus: TherapeuticPlanVisitPegjStatus;
  pegjActions: TherapeuticPlanVisitPegjActions;
  autonomyStatus: TherapeuticPlanVisitAutonomyStatus;
  autonomyActions: TherapeuticPlanVisitAutonomyActions;
}

interface TherapeuticPlanVisitForm {
  patientFirstName: string;
  patientLastName: string;
  duodopaTherapyStartDate: string;
  caregiver: TherapeuticPlanVisitCaregiver;
  clinicalCenter: string;
  neurologist: string;
  gastroenterologist: string;
  date: string;
  type: TherapeuticPlanVisitType;
  priority: TherapeuticPlanVisitPriority;
  stomiaStatus: TherapeuticPlanVisitStomiaStatus;
  stomiaActions: TherapeuticPlanVisitStomiaActions;
  pegjStatus: TherapeuticPlanVisitPegjStatus;
  pegjActions: TherapeuticPlanVisitPegjActions;
  autonomyStatus: TherapeuticPlanVisitAutonomyStatus;
  autonomyActions: TherapeuticPlanVisitAutonomyActions;
}

interface TherapeuticPlanVisitPatientHeader {
  patientFirstName: string;
  patientLastName: string;
  duodopaTherapyStartDate: string;
  caregiver: TherapeuticPlanVisitCaregiver;
  clinicalCenter: string;
  neurologist: string;
  gastroenterologist: string;
}

type TherapeuticPlanVisitStomiaBumperMobilization = 'eq0_5cm' | 'gt1cm' | 'lt0_5cm';

type TherapeuticPlanVisitStomiaSecretionAmount = 'absent' | 'light' | 'abundant';

type TherapeuticPlanVisitStomiaSecretionType = 'clear' | 'purulent' | 'otherMaterial';

type TherapeuticPlanVisitStomiaSkinVisualization = 'normal' | 'l1' | 'l2' | 'l3' | 'l4' | 'lx';

interface TherapeuticPlanVisitStomiaStatus {
  bumperMobilization: TherapeuticPlanVisitStomiaBumperMobilization;
  secretionAmount: TherapeuticPlanVisitStomiaSecretionAmount;
  secretionType: TherapeuticPlanVisitStomiaSecretionType;
  skinVisualization: TherapeuticPlanVisitStomiaSkinVisualization;
  skinPointX: number | null;
  skinPointY: number | null;
  continuousInfusion: string;
  extraDose: string;
  morningDose: string;
  infusion24Hours: boolean;
}

type TherapeuticPlanVisitStomiaBumperAction = 'none' | 'guideBumperReposition' | 'contactCenter';

type TherapeuticPlanVisitStomiaCareAction = 'none' | 'dressingTraining' | 'contactCenter';

interface TherapeuticPlanVisitStomiaActions {
  bumperMobilization: TherapeuticPlanVisitStomiaBumperAction;
  secretionLoss: TherapeuticPlanVisitStomiaCareAction;
  skinVisualization: TherapeuticPlanVisitStomiaCareAction;
}

type TherapeuticPlanVisitPegUsageDuration = '0to6' | '6to12' | 'over12';

type TherapeuticPlanVisitPegType = 'boston' | 'abbvie15' | 'abbvie20' | 'other';

type TherapeuticPlanVisitPegIntegrity = 'normal' | 'swelling' | 'cracks';

type TherapeuticPlanVisitPegColor = 'normal' | 'darkSpots';

type TherapeuticPlanVisitPegPatency = 'normal' | 'partial' | 'total';

type TherapeuticPlanVisitPegConnectorStatus = 'normal' | 'damaged' | 'broken';

type TherapeuticPlanVisitPegExternalBumperStatus = 'normal' | 'broken' | 'missing';

interface TherapeuticPlanVisitPegjStatus {
  usageDuration: TherapeuticPlanVisitPegUsageDuration;
  replacementDate: string;
  pegType: TherapeuticPlanVisitPegType;
  pegTypeOtherDetail: string;
  mobilization: boolean;
  integrity: TherapeuticPlanVisitPegIntegrity;
  color: TherapeuticPlanVisitPegColor;
  pegPatency: TherapeuticPlanVisitPegPatency;
  pejPatency: TherapeuticPlanVisitPegPatency;
  connectorStatus: TherapeuticPlanVisitPegConnectorStatus;
  externalBumperStatus: TherapeuticPlanVisitPegExternalBumperStatus;
}

type TherapeuticPlanVisitPegjSimpleAction = 'none' | 'contactCenter';

type TherapeuticPlanVisitPegjPatencyAction = 'none' | 'washTraining' | 'contactCenter';

type TherapeuticPlanVisitPegjConnectorAction = 'none' | 'tapeMonitoring' | 'supportReplacement';

type TherapeuticPlanVisitPegjBumperAction = 'none' | 'guideBumperReposition' | 'contactCenter';

interface TherapeuticPlanVisitPegjActions {
  mobilization: TherapeuticPlanVisitPegjSimpleAction;
  integrity: TherapeuticPlanVisitPegjSimpleAction;
  color: TherapeuticPlanVisitPegjSimpleAction;
  patency: TherapeuticPlanVisitPegjPatencyAction;
  connectors: TherapeuticPlanVisitPegjConnectorAction;
  externalBumper: TherapeuticPlanVisitPegjBumperAction;
}

type TherapeuticPlanVisitAutonomyLevel = 'insufficient' | 'caregiver' | 'autonomous';

interface TherapeuticPlanVisitAutonomyStatus {
  pumpCassetteConnection: TherapeuticPlanVisitAutonomyLevel;
  pumpPegConnection: TherapeuticPlanVisitAutonomyLevel;
  pumpSwitchOn: TherapeuticPlanVisitAutonomyLevel;
  morningDoseAdministration: TherapeuticPlanVisitAutonomyLevel;
  continuousDoseAdministration: TherapeuticPlanVisitAutonomyLevel;
  extraDoseAdministration: TherapeuticPlanVisitAutonomyLevel;
  pumpSwitchOff: TherapeuticPlanVisitAutonomyLevel;
  pumpPegDisconnection: TherapeuticPlanVisitAutonomyLevel;
  pegCleaning: TherapeuticPlanVisitAutonomyLevel;
  pejCleaning: TherapeuticPlanVisitAutonomyLevel;
  pumpCassetteDisconnection: TherapeuticPlanVisitAutonomyLevel;
}

interface TherapeuticPlanVisitAutonomyActions {
  pumpUsageTraining: boolean;
  pegjWashingTraining: boolean;
}

interface TherapeuticPlanVisitAutonomyItem {
  key: keyof TherapeuticPlanVisitAutonomyStatus;
  titleKey: MessageKey;
}

interface TherapeuticPlanVisitAutonomyActionItem {
  key: keyof TherapeuticPlanVisitAutonomyActions;
  titleKey: MessageKey;
}

interface TherapeuticPlanNotification {
  id?: number;
  therapeuticPlanId: number;
  sentDate: string;
  sentByOperator?: string | null;
  subject: string;
  message: string;
  confirmed: boolean | null;
  confirmationDate?: string | null;
  confirmedByDoctor?: string | null;
  notes?: string | null;
}

interface TherapeuticPlanNotificationForm {
  sentDate: string;
  sentByOperator: string;
  subject: string;
  message: string;
  confirmedChoice: '' | 'yes' | 'no';
  confirmationDate: string;
  confirmedByDoctor: string;
  notes: string;
}

type TherapeuticPlanCriticalityLevel = 'high' | 'medium' | 'low';

interface TherapeuticPlanCriticalityCard {
  titleKey: MessageKey;
  level: TherapeuticPlanCriticalityLevel;
  descriptionKey: MessageKey;
  manual?: boolean;
}

interface TherapeuticPlanMedicalRecordMock {
  title: string;
  patientName: string;
  patientCriticality: TherapeuticPlanCriticalityLevel;
  medicalCenter: string;
  implementationDate: string;
  pegjModel: string;
  pumpCode: string;
  criticalityCards: TherapeuticPlanCriticalityCard[];
}

interface TherapeuticPlanMedicalRecordContentForm {
  dataCartella: string;
  doseMattutinaMl: string;
  doseContinuaF1MlH: string;
  dalleOreF1: string;
  alleOreF1: string;
  doseExtraMl: string;
  riempimentoJTubeMl: string;
  infusioneF2: 'yes' | 'no';
  doseContinuaF2MlH: string;
  dalleOreF2: string;
  alleOreF2: string;
  infusioneF3: 'yes' | 'no';
  doseContinuaF3MlH: string;
  dalleOreF3: string;
  alleOreF3: string;
  totaleLevodopaMgDie: string;
  reportedCriticality: TherapeuticPlanCriticalityLevel;
  patientConditionCriticality: TherapeuticPlanCriticalityLevel;
  patientWeightKg: string;
  patientHeightCm: string;
  patientAgeYears: string;
  wakeMotorCondition: string;
  currentAgeYears: string;
  diagnosisYear: string;
  patientLivesMode: string;
  caregivers: string[];
  travelAutonomy: string;
  clinicalCenterContactEase: string;
  referenceGastroenterologist: string;
  referenceGastroenterologistName: string;
  clinicalCenterDistanceKm: string;
  gastroenterologistContactEase: string;
}

/**
 * Pagina di gestione del piano terapeutico con tab dedicati per riepilogo, paziente e aree operative collegate.
 */
@Component({
  selector: 'app-therapeutic-plan-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, PatientContactsSearchComponent, QtmStepModalComponent],
  templateUrl: './therapeutic-plan-manage.component.html',
  styleUrl: './therapeutic-plan-manage.component.css'
})
export class TherapeuticPlanManageComponent implements OnInit {
  // Proprietà dinamiche estratte dal JSON schema della visita
  visitSchemaProperties: { [key: string]: any } = {};
  visitSchemaRequired: string[] = [];
  visitVisibleSchemaFields: Array<{ key: string; value: any }> = [];
  // Valori dinamici del form visita
  visitFormDynamic: { [key: string]: any } = {};
    /**
     * Calcola l'età del paziente dalla data di nascita (se disponibile), altrimenti mostra "Non disponibile".
     */
    get patientAge(): string {
      if (!this.patient || !(this.patient as any).birthDate) return this.translate('common.notAvailable');
      const birth = new Date((this.patient as any).birthDate);
      if (Number.isNaN(birth.getTime())) return this.translate('common.notAvailable');
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age.toString();
    }
  get patientGenderLabel(): string {
    if (!this.patient?.gender) return this.translate('common.notAvailable');
    switch ((this.patient.gender || '').toUpperCase()) {
      case 'M':
        return this.translate('patients.gender.male');
      case 'F':
        return this.translate('patients.gender.female');
      case 'ALTRO':
      case 'O':
        return this.translate('patients.gender.other');
      default:
        return this.patient.gender;
    }
  }

  get patientBirthDate(): string {
    if (!this.patient?.birthDate) return this.translate('common.notAvailable');
    return this.formatDate(this.patient.birthDate);
  }
  readonly medicalRecordCriticalityCards: TherapeuticPlanCriticalityCard[] = [
    { titleKey: 'therapeuticPlan.medicalRecord.criticality.general', level: 'high', descriptionKey: 'therapeuticPlan.medicalRecord.criticality.general.description' },
    { titleKey: 'therapeuticPlan.medicalRecord.criticality.patient', level: 'medium', descriptionKey: 'therapeuticPlan.medicalRecord.criticality.patient.description' },
    { titleKey: 'therapeuticPlan.medicalRecord.criticality.reported', level: 'low', descriptionKey: 'therapeuticPlan.medicalRecord.criticality.reported.description', manual: true }
  ];

  // Opzioni statiche per le nuove card informative della cartella infermieristica.
  readonly wakeMotorConditionOptions: TherapeuticPlanManageOption[] = [
    { value: 'inactive', titleKey: 'therapeuticPlan.medicalRecord.option.wakeMotorCondition.inactive' },
    { value: 'partiallyInactive', titleKey: 'therapeuticPlan.medicalRecord.option.wakeMotorCondition.partiallyInactive' },
    { value: 'partiallyActive', titleKey: 'therapeuticPlan.medicalRecord.option.wakeMotorCondition.partiallyActive' },
    { value: 'active', titleKey: 'therapeuticPlan.medicalRecord.option.wakeMotorCondition.active' }
  ];

  readonly patientLivesOptions: TherapeuticPlanManageOption[] = [
    { value: 'homeAlone', titleKey: 'therapeuticPlan.medicalRecord.option.patientLives.homeAlone' },
    { value: 'homeWithCaregiver', titleKey: 'therapeuticPlan.medicalRecord.option.patientLives.homeWithCaregiver' },
    { value: 'rsa', titleKey: 'therapeuticPlan.medicalRecord.option.patientLives.rsa' }
  ];

  readonly caregiverOptions: TherapeuticPlanManageOption[] = [
    { value: 'familyMember', titleKey: 'therapeuticPlan.medicalRecord.option.caregiver.familyMember' },
    { value: 'partner', titleKey: 'therapeuticPlan.medicalRecord.option.caregiver.partner' },
    { value: 'professionalCaregiver', titleKey: 'therapeuticPlan.medicalRecord.option.caregiver.professionalCaregiver' },
    { value: 'nurse', titleKey: 'therapeuticPlan.medicalRecord.option.caregiver.nurse' }
  ];

  readonly travelAutonomyOptions: TherapeuticPlanManageOption[] = [
    { value: 'autonomous', titleKey: 'therapeuticPlan.medicalRecord.option.travelAutonomy.autonomous' },
    { value: 'familyManaged', titleKey: 'therapeuticPlan.medicalRecord.option.travelAutonomy.familyManaged' },
    { value: 'ambulanceOther', titleKey: 'therapeuticPlan.medicalRecord.option.travelAutonomy.ambulanceOther' }
  ];

  readonly contactEaseOptions: TherapeuticPlanManageOption[] = [
    { value: 'easy', titleKey: 'therapeuticPlan.medicalRecord.option.contactEase.easy' },
    { value: 'medium', titleKey: 'therapeuticPlan.medicalRecord.option.contactEase.medium' },
    { value: 'difficult', titleKey: 'therapeuticPlan.medicalRecord.option.contactEase.difficult' }
  ];

  readonly referenceGastroenterologistOptions: TherapeuticPlanManageOption[] = [
    { value: 'center', titleKey: 'therapeuticPlan.medicalRecord.option.referenceGastroenterologist.center' },
    { value: 'other', titleKey: 'therapeuticPlan.medicalRecord.option.referenceGastroenterologist.other' }
  ];

  readonly pegHistoryReasonOptions: TherapeuticPlanManageOption[] = [
    { value: 'complaint', titleKey: 'therapeuticPlan.pegHistory.reason.complaint' },
    { value: 'planned', titleKey: 'therapeuticPlan.pegHistory.reason.planned' }
  ];

  readonly movementOperationOptions: TherapeuticPlanManageOption[] = [
    { value: 'atPatient', titleKey: 'therapeuticPlan.movements.operation.atPatient' },
    { value: 'pickupFromPatient', titleKey: 'therapeuticPlan.movements.operation.pickupFromPatient' }
  ];

  readonly visitTypeOptions: TherapeuticPlanManageOption[] = [
    { value: 'outpatient', titleKey: 'therapeuticPlan.visits.type.outpatient' },
    { value: 'remote', titleKey: 'therapeuticPlan.visits.type.remote' },
    { value: 'home', titleKey: 'therapeuticPlan.visits.type.home' },
    { value: 'followUpCenter', titleKey: 'therapeuticPlan.visits.type.followUpCenter' },
    { value: 'trainingCenter', titleKey: 'therapeuticPlan.visits.type.trainingCenter' }
  ];

  readonly visitCaregiverOptions: TherapeuticPlanManageOption[] = [
    { value: 'child', titleKey: 'therapeuticPlan.visits.caregiver.child' },
    { value: 'spouse', titleKey: 'therapeuticPlan.visits.caregiver.spouse' },
    { value: 'relative', titleKey: 'therapeuticPlan.visits.caregiver.relative' },
    { value: 'other', titleKey: 'therapeuticPlan.visits.caregiver.other' }
  ];

  readonly visitPriorityOptions: TherapeuticPlanManageOption[] = [
    { value: 'none', titleKey: 'therapeuticPlan.visits.priority.none' },
    { value: 'low', titleKey: 'therapeuticPlan.visits.priority.low' },
    { value: 'medium', titleKey: 'therapeuticPlan.visits.priority.medium' },
    { value: 'high', titleKey: 'therapeuticPlan.visits.priority.high' }
  ];

  readonly visitStomiaBumperOptions: TherapeuticPlanManageOption[] = [
    { value: 'eq0_5cm', titleKey: 'therapeuticPlan.visits.status.stomia.bumper.eq0_5cm' },
    { value: 'gt1cm', titleKey: 'therapeuticPlan.visits.status.stomia.bumper.gt1cm' },
    { value: 'lt0_5cm', titleKey: 'therapeuticPlan.visits.status.stomia.bumper.lt0_5cm' }
  ];

  readonly visitStomiaSecretionAmountOptions: TherapeuticPlanManageOption[] = [
    { value: 'absent', titleKey: 'therapeuticPlan.visits.status.stomia.secretionAmount.absent' },
    { value: 'light', titleKey: 'therapeuticPlan.visits.status.stomia.secretionAmount.light' },
    { value: 'abundant', titleKey: 'therapeuticPlan.visits.status.stomia.secretionAmount.abundant' }
  ];

  readonly visitStomiaSecretionTypeOptions: TherapeuticPlanManageOption[] = [
    { value: 'clear', titleKey: 'therapeuticPlan.visits.status.stomia.secretionType.clear' },
    { value: 'purulent', titleKey: 'therapeuticPlan.visits.status.stomia.secretionType.purulent' },
    { value: 'otherMaterial', titleKey: 'therapeuticPlan.visits.status.stomia.secretionType.otherMaterial' }
  ];

  readonly visitStomiaSkinOptions: TherapeuticPlanManageOption[] = [
    { value: 'normal', titleKey: 'therapeuticPlan.visits.status.stomia.skin.normal' },
    { value: 'l1', titleKey: 'therapeuticPlan.visits.status.stomia.skin.l1' },
    { value: 'l2', titleKey: 'therapeuticPlan.visits.status.stomia.skin.l2' },
    { value: 'l3', titleKey: 'therapeuticPlan.visits.status.stomia.skin.l3' },
    { value: 'l4', titleKey: 'therapeuticPlan.visits.status.stomia.skin.l4' },
    { value: 'lx', titleKey: 'therapeuticPlan.visits.status.stomia.skin.lx' }
  ];

  readonly visitPegUsageOptions: TherapeuticPlanManageOption[] = [
    { value: '0to6', titleKey: 'therapeuticPlan.visits.status.pegj.usage.0to6' },
    { value: '6to12', titleKey: 'therapeuticPlan.visits.status.pegj.usage.6to12' },
    { value: 'over12', titleKey: 'therapeuticPlan.visits.status.pegj.usage.over12' }
  ];

  readonly visitPegTypeOptions: TherapeuticPlanManageOption[] = [
    { value: 'boston', titleKey: 'therapeuticPlan.visits.status.pegj.type.boston' },
    { value: 'abbvie15', titleKey: 'therapeuticPlan.visits.status.pegj.type.abbvie15' },
    { value: 'abbvie20', titleKey: 'therapeuticPlan.visits.status.pegj.type.abbvie20' },
    { value: 'other', titleKey: 'therapeuticPlan.visits.status.pegj.type.other' }
  ];

  readonly visitPegIntegrityOptions: TherapeuticPlanManageOption[] = [
    { value: 'normal', titleKey: 'therapeuticPlan.visits.status.pegj.integrity.normal' },
    { value: 'swelling', titleKey: 'therapeuticPlan.visits.status.pegj.integrity.swelling' },
    { value: 'cracks', titleKey: 'therapeuticPlan.visits.status.pegj.integrity.cracks' }
  ];

  readonly visitPegColorOptions: TherapeuticPlanManageOption[] = [
    { value: 'normal', titleKey: 'therapeuticPlan.visits.status.pegj.color.normal' },
    { value: 'darkSpots', titleKey: 'therapeuticPlan.visits.status.pegj.color.darkSpots' }
  ];

  readonly visitPegPatencyOptions: TherapeuticPlanManageOption[] = [
    { value: 'normal', titleKey: 'therapeuticPlan.visits.status.pegj.patency.normal' },
    { value: 'partial', titleKey: 'therapeuticPlan.visits.status.pegj.patency.partial' },
    { value: 'total', titleKey: 'therapeuticPlan.visits.status.pegj.patency.total' }
  ];

  readonly visitPegConnectorOptions: TherapeuticPlanManageOption[] = [
    { value: 'normal', titleKey: 'therapeuticPlan.visits.status.pegj.connector.normal' },
    { value: 'damaged', titleKey: 'therapeuticPlan.visits.status.pegj.connector.damaged' },
    { value: 'broken', titleKey: 'therapeuticPlan.visits.status.pegj.connector.broken' }
  ];

  readonly visitPegExternalBumperOptions: TherapeuticPlanManageOption[] = [
    { value: 'normal', titleKey: 'therapeuticPlan.visits.status.pegj.externalBumper.normal' },
    { value: 'broken', titleKey: 'therapeuticPlan.visits.status.pegj.externalBumper.broken' },
    { value: 'missing', titleKey: 'therapeuticPlan.visits.status.pegj.externalBumper.missing' }
  ];

  readonly visitAutonomyLevelOptions: TherapeuticPlanManageOption[] = [
    { value: 'insufficient', titleKey: 'therapeuticPlan.visits.status.autonomy.level.insufficient' },
    { value: 'caregiver', titleKey: 'therapeuticPlan.visits.status.autonomy.level.caregiver' },
    { value: 'autonomous', titleKey: 'therapeuticPlan.visits.status.autonomy.level.autonomous' }
  ];

  readonly visitActionNoneOrContactOptions: TherapeuticPlanManageOption[] = [
    { value: 'none', titleKey: 'therapeuticPlan.visits.actionsTaken.none' },
    { value: 'contactCenter', titleKey: 'therapeuticPlan.visits.actionsTaken.contactCenter' }
  ];

  readonly visitStomiaBumperActionOptions: TherapeuticPlanManageOption[] = [
    { value: 'none', titleKey: 'therapeuticPlan.visits.actionsTaken.none' },
    { value: 'guideBumperReposition', titleKey: 'therapeuticPlan.visits.actionsTaken.stomia.bumper.guideReposition' },
    { value: 'contactCenter', titleKey: 'therapeuticPlan.visits.actionsTaken.contactCenter' }
  ];

  readonly visitStomiaCareActionOptions: TherapeuticPlanManageOption[] = [
    { value: 'none', titleKey: 'therapeuticPlan.visits.actionsTaken.none' },
    { value: 'dressingTraining', titleKey: 'therapeuticPlan.visits.actionsTaken.stomia.dressingTraining' },
    { value: 'contactCenter', titleKey: 'therapeuticPlan.visits.actionsTaken.contactCenter' }
  ];

  readonly visitPegjPatencyActionOptions: TherapeuticPlanManageOption[] = [
    { value: 'none', titleKey: 'therapeuticPlan.visits.actionsTaken.none' },
    { value: 'washTraining', titleKey: 'therapeuticPlan.visits.actionsTaken.pegj.patency.washTraining' },
    { value: 'contactCenter', titleKey: 'therapeuticPlan.visits.actionsTaken.contactCenter' }
  ];

  readonly visitPegjConnectorActionOptions: TherapeuticPlanManageOption[] = [
    { value: 'none', titleKey: 'therapeuticPlan.visits.actionsTaken.none' },
    { value: 'tapeMonitoring', titleKey: 'therapeuticPlan.visits.actionsTaken.pegj.connector.tapeMonitoring' },
    { value: 'supportReplacement', titleKey: 'therapeuticPlan.visits.actionsTaken.pegj.connector.supportReplacement' }
  ];

  readonly visitPegjBumperActionOptions: TherapeuticPlanManageOption[] = [
    { value: 'none', titleKey: 'therapeuticPlan.visits.actionsTaken.none' },
    { value: 'guideBumperReposition', titleKey: 'therapeuticPlan.visits.actionsTaken.stomia.bumper.guideReposition' },
    { value: 'contactCenter', titleKey: 'therapeuticPlan.visits.actionsTaken.contactCenter' }
  ];

  readonly visitAutonomyItems: TherapeuticPlanVisitAutonomyItem[] = [
    { key: 'pumpCassetteConnection', titleKey: 'therapeuticPlan.visits.status.autonomy.item.pumpCassetteConnection' },
    { key: 'pumpPegConnection', titleKey: 'therapeuticPlan.visits.status.autonomy.item.pumpPegConnection' },
    { key: 'pumpSwitchOn', titleKey: 'therapeuticPlan.visits.status.autonomy.item.pumpSwitchOn' },
    { key: 'morningDoseAdministration', titleKey: 'therapeuticPlan.visits.status.autonomy.item.morningDoseAdministration' },
    { key: 'continuousDoseAdministration', titleKey: 'therapeuticPlan.visits.status.autonomy.item.continuousDoseAdministration' },
    { key: 'extraDoseAdministration', titleKey: 'therapeuticPlan.visits.status.autonomy.item.extraDoseAdministration' },
    { key: 'pumpSwitchOff', titleKey: 'therapeuticPlan.visits.status.autonomy.item.pumpSwitchOff' },
    { key: 'pumpPegDisconnection', titleKey: 'therapeuticPlan.visits.status.autonomy.item.pumpPegDisconnection' },
    { key: 'pegCleaning', titleKey: 'therapeuticPlan.visits.status.autonomy.item.pegCleaning' },
    { key: 'pejCleaning', titleKey: 'therapeuticPlan.visits.status.autonomy.item.pejCleaning' },
    { key: 'pumpCassetteDisconnection', titleKey: 'therapeuticPlan.visits.status.autonomy.item.pumpCassetteDisconnection' }
  ];

  readonly visitAutonomyActionItems: TherapeuticPlanVisitAutonomyActionItem[] = [
    { key: 'pumpUsageTraining', titleKey: 'therapeuticPlan.visits.actionsTaken.autonomy.pumpUsage' },
    { key: 'pegjWashingTraining', titleKey: 'therapeuticPlan.visits.actionsTaken.autonomy.pegjWashing' }
  ];

  readonly medicalRecordContentForm: TherapeuticPlanMedicalRecordContentForm = this.createEmptyMedicalRecordContentForm();

  readonly tabs: TherapeuticPlanManageTab[] = [
    { key: 'summary', titleKey: 'therapeuticPlan.manage.tab.summary' },
    { key: 'patient', titleKey: 'therapeuticPlan.manage.tab.patient' },
    { key: 'modules', titleKey: 'therapeuticPlan.manage.tab.modules' },
    { key: 'visits', titleKey: 'therapeuticPlan.manage.tab.visits' },
    { key: 'activity-booking', titleKey: 'therapeuticPlan.manage.tab.activityBooking' },
    { key: 'contact-requests', titleKey: 'therapeuticPlan.manage.tab.contactRequests' }
  ];

  // Sotto-sezioni del riepilogo per separare contenuti informativi e segnalazioni operative.
  readonly summarySubTabs: TherapeuticPlanSummarySubTab[] = [
    { key: 'notifications', titleKey: 'therapeuticPlan.manage.subtab.notifications' },
    { key: 'alerts', titleKey: 'therapeuticPlan.manage.subtab.alerts' }
  ];

  // Cartelle disponibili sotto il folder "Paziente"
  readonly patientFolders = [
    { key: 'followup', titleKey: 'therapeuticPlan.manage.patientFolder.followup' },
    { key: 'contatti', titleKey: 'therapeuticPlan.manage.patientFolder.contacts' },
    { key: 'cartella-inf', titleKey: 'therapeuticPlan.manage.patientFolder.medicalRecord' },
    { key: 'storico-peg', titleKey: 'therapeuticPlan.manage.patientFolder.pegHistory' },
    { key: 'movimentazioni', titleKey: 'therapeuticPlan.manage.patientFolder.movements' },
    { key: 'manutenzione', titleKey: 'therapeuticPlan.manage.patientFolder.maintenance' },
    { key: 'moduli', titleKey: 'therapeuticPlan.manage.patientFolder.modules' },
    { key: 'documenti', titleKey: 'therapeuticPlan.manage.patientFolder.documents' }
  ];

  // cartella attiva dentro il tab paziente
  activePatientFolder: string = 'followup';

  loading = true;
  errorMessage = '';
  activeTab: TherapeuticPlanManageTab['key'] = 'summary';
  activeSummarySubTab: TherapeuticPlanSummarySubTab['key'] = 'notifications';
  planId: number | null = null;
  plan: TherapeuticPlanManageResponse | null = null;
  patient: TherapeuticPlanPatient | null = null;
  structure: StructureDto | null = null;
  nurse: TherapeuticPlanNurse | null = null;
  doctor: TherapeuticPlanDoctor | null = null;
  selectedEquipment: TherapeuticPlanEquipment[] = [];
  notifications: TherapeuticPlanNotification[] = [];
  notificationModalOpen = false;
  notificationSaving = false;
  notificationErrorMessage = '';
  editingNotificationId: number | null = null;
  notificationForm: TherapeuticPlanNotificationForm = this.createEmptyNotificationForm();
  alerts: TherapeuticPlanAlert[] = [];
  alertModalOpen = false;
  alertSaving = false;
  alertErrorMessage = '';
  editingAlertId: number | null = null;
  alertForm: TherapeuticPlanAlertForm = this.createEmptyAlertForm();
  pegHistoryEntries: TherapeuticPlanPegHistoryRecord[] = this.createMockPegHistoryEntries();
  pegHistoryModalOpen = false;
  pegHistoryErrorMessage = '';
  pegHistoryForm: TherapeuticPlanPegHistoryForm = this.createEmptyPegHistoryForm();
  movementEntries: TherapeuticPlanMovementRecord[] = this.createMockMovementEntries();
  movementModalOpen = false;
  movementErrorMessage = '';
  movementForm: TherapeuticPlanMovementForm = this.createEmptyMovementForm();
  visitEntries: TherapeuticPlanVisitRecord[] = this.createMockVisitEntries();
  visitModalOpen = false;
  visitModalStep = 1;
  visitErrorMessage = '';
  visitForm: TherapeuticPlanVisitForm = this.createEmptyVisitForm();
  visitSummaryModalOpen = false;
  visitSummaryModalStep = 1;
  visitSummarySelectedVisit: TherapeuticPlanVisitRecord | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly structureApiService: StructureApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const normalizedId = idParam ? Number(idParam) : Number.NaN;
    if (Number.isNaN(normalizedId) || normalizedId <= 0) {
      this.loading = false;
      this.errorMessage = this.translate('therapeuticPlan.manage.error.invalidId');
      return;
    }

    this.planId = normalizedId;
    this.loadManageData(normalizedId);
  }

  private fetchVisits(planId: number): void {
    const url = `${environment.apiBaseUrl}/therapeutic-plans/${planId}/visits`;
    this.http.get<any[]>(url).pipe(catchError(() => of([]))).subscribe((list) => {
      const mapped: TherapeuticPlanVisitRecord[] = (list || []).map((visitDto, index) =>
        this.mapVisitDtoToRecord(visitDto, index)
      );

      this.visitEntries = this.sortVisitEntries(mapped);
    });
  }

  private mapVisitDtoToRecord(visitDto: any, index: number): TherapeuticPlanVisitRecord {
    const emptyVisitForm = this.createEmptyVisitForm();
    const parsedVisit = this.parseVisitJsonVisit(visitDto?.jsonVisit);
    const operatorLabel = this.getCurrentOperatorDisplayLabel();

    return {
      id: index + 1,
      patientFirstName: this.getFirstNonBlankString(parsedVisit?.['patientFirstName'], visitDto?.patientFirstName, this.patient?.firstName),
      patientLastName: this.getFirstNonBlankString(parsedVisit?.['patientLastName'], visitDto?.patientLastName, this.patient?.lastName),
      duodopaTherapyStartDate: this.getFirstNonBlankString(parsedVisit?.['duodopaTherapyStartDate'], visitDto?.date),
      caregiver: (this.getFirstNonBlankString(parsedVisit?.['caregiver'], visitDto?.caregiver, 'other') as TherapeuticPlanVisitCaregiver),
      clinicalCenter: this.getFirstNonBlankString(parsedVisit?.['clinicalCenter'], visitDto?.clinicalCenter),
      neurologist: this.getFirstNonBlankString(parsedVisit?.['neurologist'], visitDto?.neurologist),
      gastroenterologist: this.getFirstNonBlankString(parsedVisit?.['gastroenterologist'], visitDto?.gastroenterologist),
      date: this.getFirstNonBlankString(parsedVisit?.['date'], visitDto?.date),
      type: (this.getFirstNonBlankString(parsedVisit?.['type'], visitDto?.type, 'outpatient') as TherapeuticPlanVisitType),
      priority: (this.getFirstNonBlankString(parsedVisit?.['priority'], visitDto?.priority, 'none') as TherapeuticPlanVisitPriority),
      nurse: this.getFirstNonBlankString(parsedVisit?.['nurse'], operatorLabel),
      nurseSignature: this.getFirstNonBlankString(parsedVisit?.['nurseSignature'], this.buildOperatorSignature(operatorLabel)),
      stomiaStatus: {
        ...emptyVisitForm.stomiaStatus,
        ...(this.isVisitObject(parsedVisit?.['stomiaStatus']) ? parsedVisit['stomiaStatus'] : {})
      },
      stomiaActions: {
        ...emptyVisitForm.stomiaActions,
        ...(this.isVisitObject(parsedVisit?.['stomiaActions']) ? parsedVisit['stomiaActions'] : {})
      },
      pegjStatus: {
        ...emptyVisitForm.pegjStatus,
        ...(this.isVisitObject(parsedVisit?.['pegjStatus']) ? parsedVisit['pegjStatus'] : {})
      },
      pegjActions: {
        ...emptyVisitForm.pegjActions,
        ...(this.isVisitObject(parsedVisit?.['pegjActions']) ? parsedVisit['pegjActions'] : {})
      },
      autonomyStatus: {
        ...emptyVisitForm.autonomyStatus,
        ...(this.isVisitObject(parsedVisit?.['autonomyStatus']) ? parsedVisit['autonomyStatus'] : {})
      },
      autonomyActions: {
        ...emptyVisitForm.autonomyActions,
        ...(this.isVisitObject(parsedVisit?.['autonomyActions']) ? parsedVisit['autonomyActions'] : {})
      }
    };
  }

  translate(key: MessageKey | string): string {
    try {
      return t(key as MessageKey);
    } catch {
      return key;
    }
  }

  setActiveTab(tabKey: TherapeuticPlanManageTab['key']): void {
    this.activeTab = tabKey;
  }

  setActiveSummarySubTab(tabKey: TherapeuticPlanSummarySubTab['key']): void {
    this.activeSummarySubTab = tabKey;
  }

  goBack(): void {
    void this.router.navigateByUrl('/therapeutic-plans/search');
  }

  setActivePatientFolder(folderKey: string): void {
    this.activePatientFolder = folderKey;
    // se l'utente seleziona "visite" come cartella, apriamo il tab visite
    if (folderKey === 'visite') {
      this.setActiveTab('visits');
    }
  }

  /**
   * Restituisce l'età del paziente alla data fornita (yyyy-mm-dd) oppure 'not available'.
   */
  getAgeAt(dateIso?: string): string {
    if (!this.patient || !(this.patient as any).birthDate || !dateIso) return this.translate('common.notAvailable');
    const birth = new Date((this.patient as any).birthDate);
    const when = new Date(dateIso);
    if (Number.isNaN(birth.getTime()) || Number.isNaN(when.getTime())) return this.translate('common.notAvailable');
    let age = when.getFullYear() - birth.getFullYear();
    const m = when.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && when.getDate() < birth.getDate())) age--;
    return String(age);
  }

  get patientDisplayName(): string {
    if (!this.patient) {
      return this.translate('common.notAvailable');
    }

    const fullName = `${this.patient.firstName ?? ''} ${this.patient.lastName ?? ''}`.trim();
    return fullName || this.translate('common.notAvailable');
  }

  get patientCode(): string {
    return this.patient?.assistedId?.trim() || this.translate('common.notAvailable');
  }

  get structureLabel(): string {
    if (!this.structure) {
      return this.translate('common.notAvailable');
    }

    return this.structure.selectionLabel?.trim().length ? this.structure.selectionLabel : this.structure.name;
  }

  get nurseLabel(): string {
    return this.nurse?.fullName?.trim() || this.translate('common.notAvailable');
  }

  get doctorLabel(): string {
    return this.doctor?.fullName?.trim() || this.translate('common.notAvailable');
  }

  get medicalCenterLabel(): string {
    return this.structureLabel;
  }

  get patientCriticalityLabel(): string {
    return this.translate(this.getCriticalityLabelKey(this.getMockMedicalRecord().patientCriticality));
  }

  get medicalRecord(): TherapeuticPlanMedicalRecordMock {
    return this.getMockMedicalRecord();
  }

  get medicalRecordTitle(): string {
    const implementationDate = this.formatDate(this.plan?.startDate || this.getTodayDateInputValue());
    return this.translate('therapeuticPlan.medicalRecord.title').replace('{0}', implementationDate);
  }

  get statusLabelKey(): string {
    return `status.${this.plan?.status ?? 'unknown'}`;
  }

  get statusClass(): string {
    return `status-${this.plan?.status ?? 'unknown'}`;
  }

  get selectedEquipmentCount(): string {
    return String(this.selectedEquipment.length);
  }

  get canCreateAlert(): boolean {
    return !!this.planId && !!this.plan?.doctorId;
  }

  get isEditingNotification(): boolean {
    return this.editingNotificationId !== null;
  }

  get notificationModalTitleKey(): MessageKey {
    return this.isEditingNotification
      ? 'therapeuticPlan.notification.modal.titleEdit'
      : 'therapeuticPlan.notification.modal.title';
  }

  get notificationSubmitLabelKey(): MessageKey {
    return this.isEditingNotification ? 'crud.actions.update' : 'crud.actions.create';
  }

  get notificationConfirmationSelected(): boolean {
    return this.notificationForm.confirmedChoice !== '';
  }

  get notificationNotesRequired(): boolean {
    return this.notificationForm.confirmedChoice === 'no';
  }

  get alertConfirmationSentVisible(): boolean {
    return this.alertForm.confirmationRequired;
  }

  get isEditingAlert(): boolean {
    return this.editingAlertId !== null;
  }

  get alertModalTitleKey(): MessageKey {
    return this.isEditingAlert
      ? 'therapeuticPlan.alert.modal.titleEdit'
      : 'therapeuticPlan.alert.modal.title';
  }

  get alertSubmitLabelKey(): MessageKey {
    return this.isEditingAlert ? 'crud.actions.update' : 'crud.actions.create';
  }

  get pegHistoryResultCountLabel(): string {
    return `${this.pegHistoryEntries.length} ${this.translate('therapeuticPlan.pegHistory.results')}`;
  }

  get movementResultCountLabel(): string {
    return `${this.movementEntries.length} ${this.translate('therapeuticPlan.movements.results')}`;
  }

  get visitResultCountLabel(): string {
    return `${this.visitEntries.length} ${this.translate('therapeuticPlan.visits.results')}`;
  }

  get visitPatientHeader(): TherapeuticPlanVisitPatientHeader {
    return {
      patientFirstName: this.patient?.firstName?.trim() || 'Mario',
      patientLastName: this.patient?.lastName?.trim() || 'Rossi',
      duodopaTherapyStartDate: this.plan?.startDate || '2018-11-26',
      caregiver: this.patient?.caregiverFullName?.trim() ? 'relative' : 'other',
      clinicalCenter: this.structureLabel,
      neurologist: this.doctorLabel,
      gastroenterologist: 'Dr. Stefano Conti'
    };
  }

  get visitPatientFullName(): string {
    return `${this.visitPatientHeader.patientFirstName} ${this.visitPatientHeader.patientLastName}`.trim() || this.translate('common.notAvailable');
  }

  get visitModalStepTitleKey(): MessageKey {
    switch (this.visitModalStep) {
      case 2:
        return 'therapeuticPlan.visits.modal.step2.title';
      case 3:
        return 'therapeuticPlan.visits.modal.step3.title';
      case 4:
        return 'therapeuticPlan.visits.modal.step4.title';
      case 5:
        return 'therapeuticPlan.visits.modal.step5.title';
      case 6:
        return 'therapeuticPlan.visits.modal.step6.title';
      case 7:
        return 'therapeuticPlan.visits.modal.step7.title';
      default:
        return 'therapeuticPlan.visits.modal.step1.title';
    }
  }

  get visitModalStepDescriptionKey(): MessageKey {
    switch (this.visitModalStep) {
      case 2:
        return 'therapeuticPlan.visits.modal.step2.description';
      case 3:
        return 'therapeuticPlan.visits.modal.step3.description';
      case 4:
        return 'therapeuticPlan.visits.modal.step4.description';
      case 5:
        return 'therapeuticPlan.visits.modal.step5.description';
      case 6:
        return 'therapeuticPlan.visits.modal.step6.description';
      case 7:
        return 'therapeuticPlan.visits.modal.step7.description';
      default:
        return 'therapeuticPlan.visits.modal.step1.description';
    }
  }

  get isLastVisitModalStep(): boolean {
    return this.visitModalStep === 7;
  }

  get confirmationSentLabel(): string {
    if (!this.alertConfirmationSentVisible) {
      return this.translate('therapeuticPlan.alert.confirmationSent.na');
    }

    return this.translate(this.alertForm.confirmationSent === 'yes'
      ? 'common.yes'
      : this.alertForm.confirmationSent === 'no'
        ? 'common.no'
        : 'therapeuticPlan.alert.confirmationSent.na');
  }

  formatDate(value?: string): string {
    if (!value?.trim()) {
      return this.translate('common.notAvailable');
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    const includeTime = value.includes('T') || /\d{2}:\d{2}/.test(value);

    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    }).format(parsedDate);
  }

  openAlertModal(): void {
    if (!this.canCreateAlert) {
      return;
    }

    this.alertErrorMessage = '';
    this.editingAlertId = null;
    this.alertForm = this.createEmptyAlertForm();
    this.alertModalOpen = true;
  }

  openAlertEditModal(alert: TherapeuticPlanAlert): void {
    if (!this.canCreateAlert || alert.id == null) {
      return;
    }

    this.alertErrorMessage = '';
    this.editingAlertId = alert.id;
    this.alertForm = {
      date: alert.date ?? '',
      subject: alert.subject ?? '',
      confirmationRequired: alert.confirmationRequired,
      confirmationSent: alert.confirmationRequired
        ? this.normalizeConfirmationSent(alert.confirmationSent)
        : 'na'
    };
    this.alertModalOpen = true;
  }

  closeAlertModal(): void {
    if (this.alertSaving) {
      return;
    }

    this.alertModalOpen = false;
    this.alertErrorMessage = '';
    this.editingAlertId = null;
    this.alertForm = this.createEmptyAlertForm();
  }

  onConfirmationRequiredChange(): void {
    if (!this.alertForm.confirmationRequired) {
      this.alertForm.confirmationSent = 'na';
    }
  }

  saveAlert(): void {
    if (!this.planId || !this.plan?.doctorId || this.alertSaving) {
      return;
    }

    this.alertErrorMessage = '';
    if (!this.alertForm.date.trim()) {
      this.alertErrorMessage = this.translate('therapeuticPlan.alert.validation.dateRequired');
      return;
    }
    if (!this.alertForm.subject.trim()) {
      this.alertErrorMessage = this.translate('therapeuticPlan.alert.validation.subjectRequired');
      return;
    }
    if (this.alertForm.confirmationRequired && !['yes', 'no'].includes(this.alertForm.confirmationSent)) {
      this.alertErrorMessage = this.translate('therapeuticPlan.alert.validation.confirmationSentRequired');
      return;
    }

    this.alertSaving = true;
    const payload: TherapeuticPlanAlert = {
      therapeuticPlanId: this.planId,
      doctorId: this.plan.doctorId,
      date: this.alertForm.date,
      subject: this.alertForm.subject.trim(),
      confirmationRequired: this.alertForm.confirmationRequired,
      confirmationSent: this.alertForm.confirmationRequired ? this.alertForm.confirmationSent : 'na'
    };

    const request = this.isEditingAlert && this.editingAlertId !== null
      ? this.http.put<TherapeuticPlanAlert>(
          `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/alerts/${this.editingAlertId}`,
          payload
        )
      : this.http.post<TherapeuticPlanAlert>(`${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/alerts`, payload);

    request.subscribe({
      next: (savedAlert) => {
        this.alertSaving = false;
        this.alerts = this.sortAlerts([
          savedAlert,
          ...this.alerts.filter((currentAlert) => currentAlert.id !== savedAlert.id)
        ]);
        this.closeAlertModal();
      },
      error: (error: HttpErrorResponse) => {
        this.alertSaving = false;
        this.alertErrorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  getConfirmationRequiredLabel(value: boolean): string {
    return this.translate(value ? 'common.yes' : 'common.no');
  }

  getConfirmedDisplayValue(value: boolean | null | undefined): string {
    if (value === true) {
      return this.translate('common.yes');
    }

    if (value === false) {
      return this.translate('common.no');
    }

    return this.translate('therapeuticPlan.notification.confirmed.pending');
  }

  getConfirmationSentDisplayValue(value?: string): string {
    if (!value?.trim()) {
      return this.translate('common.notAvailable');
    }

    switch (value.trim().toLowerCase()) {
      case 'yes':
        return this.translate('common.yes');
      case 'no':
        return this.translate('common.no');
      default:
        return this.translate('therapeuticPlan.alert.confirmationSent.na');
    }
  }

  getCriticalityLabelKey(level: TherapeuticPlanCriticalityLevel): MessageKey {
    switch (level) {
      case 'high':
        return 'therapeuticPlan.medicalRecord.level.high';
      case 'medium':
        return 'therapeuticPlan.medicalRecord.level.medium';
      default:
        return 'therapeuticPlan.medicalRecord.level.low';
    }
  }

  getCriticalityBadgeClass(level: TherapeuticPlanCriticalityLevel): string {
    return `criticality-badge criticality-${level}`;
  }

  getCriticalityCardLevel(card: TherapeuticPlanCriticalityCard): TherapeuticPlanCriticalityLevel {
    return card.manual ? this.medicalRecordContentForm.reportedCriticality : card.level;
  }

  openNotificationModal(): void {
    if (!this.planId || this.notificationSaving) {
      return;
    }

    this.notificationErrorMessage = '';
    this.editingNotificationId = null;
    this.notificationForm = this.createEmptyNotificationForm();
    this.notificationModalOpen = true;
  }

  openNotificationEditModal(notification: TherapeuticPlanNotification): void {
    if (!this.planId || notification.id == null || this.notificationSaving) {
      return;
    }

    this.notificationErrorMessage = '';
    this.editingNotificationId = notification.id;
    this.notificationForm = {
      sentDate: notification.sentDate ?? '',
      sentByOperator: notification.sentByOperator?.trim() || this.getCurrentOperatorDisplayLabel(),
      subject: notification.subject ?? '',
      message: notification.message ?? '',
      confirmedChoice: this.normalizeConfirmedChoice(notification.confirmed),
      confirmationDate: notification.confirmationDate ?? '',
      confirmedByDoctor: notification.confirmedByDoctor ?? '',
      notes: notification.notes ?? ''
    };
    this.notificationModalOpen = true;
  }

  closeNotificationModal(): void {
    if (this.notificationSaving) {
      return;
    }

    this.notificationModalOpen = false;
    this.notificationErrorMessage = '';
    this.editingNotificationId = null;
    this.notificationForm = this.createEmptyNotificationForm();
  }

  onNotificationConfirmedChange(): void {
    if (!this.notificationConfirmationSelected) {
      this.notificationForm.confirmationDate = '';
      this.notificationForm.notes = '';
      return;
    }

    if (this.notificationForm.confirmedChoice === 'yes') {
      this.notificationForm.notes = '';
    }
  }

  openPegHistoryModal(): void {
    this.pegHistoryErrorMessage = '';
    this.pegHistoryForm = this.createEmptyPegHistoryForm();
    this.pegHistoryModalOpen = true;
  }

  closePegHistoryModal(): void {
    this.pegHistoryModalOpen = false;
    this.pegHistoryErrorMessage = '';
    this.pegHistoryForm = this.createEmptyPegHistoryForm();
  }

  onPegHistoryFirstPegChange(value: boolean): void {
    if (value) {
      this.pegHistoryForm.replacementReason = '';
    }
  }

  savePegHistory(): void {
    this.pegHistoryErrorMessage = '';

    if (!this.pegHistoryForm.model.trim()) {
      this.pegHistoryErrorMessage = this.translate('therapeuticPlan.pegHistory.validation.modelRequired');
      return;
    }

    if (!this.pegHistoryForm.insertionDate.trim()) {
      this.pegHistoryErrorMessage = this.translate('therapeuticPlan.pegHistory.validation.insertionDateRequired');
      return;
    }

    if (!this.pegHistoryForm.firstPeg && !this.pegHistoryForm.replacementReason) {
      this.pegHistoryErrorMessage = this.translate('therapeuticPlan.pegHistory.validation.replacementReasonRequired');
      return;
    }

    const newEntry: TherapeuticPlanPegHistoryRecord = {
      id: this.getNextPegHistoryId(),
      model: this.pegHistoryForm.model.trim(),
      insertionDate: this.pegHistoryForm.insertionDate,
      firstPeg: this.pegHistoryForm.firstPeg,
      replacementReason: this.pegHistoryForm.firstPeg ? null : this.pegHistoryForm.replacementReason || null
    };

    this.pegHistoryEntries = this.sortPegHistoryEntries([newEntry, ...this.pegHistoryEntries]);
    this.closePegHistoryModal();
  }

  getPegHistoryFirstPegLabel(value: boolean): string {
    return this.translate(value ? 'common.yes' : 'common.no');
  }

  getPegHistoryReplacementReasonLabel(value: TherapeuticPlanPegReplacementReason | null): string {
    if (!value) {
      return this.translate('common.notAvailable');
    }

    return this.translate(`therapeuticPlan.pegHistory.reason.${value}`);
  }

  openMovementModal(): void {
    this.movementErrorMessage = '';
    this.movementForm = this.createEmptyMovementForm();
    this.movementModalOpen = true;
  }

  closeMovementModal(): void {
    this.movementModalOpen = false;
    this.movementErrorMessage = '';
    this.movementForm = this.createEmptyMovementForm();
  }

  saveMovement(): void {
    this.movementErrorMessage = '';

    if (!this.movementForm.pumpNumber.trim()) {
      this.movementErrorMessage = this.translate('therapeuticPlan.movements.validation.pumpNumberRequired');
      return;
    }

    if (!this.movementForm.movementDate.trim()) {
      this.movementErrorMessage = this.translate('therapeuticPlan.movements.validation.movementDateRequired');
      return;
    }

    if (!this.movementForm.expiryDate.trim()) {
      this.movementErrorMessage = this.translate('therapeuticPlan.movements.validation.expiryDateRequired');
      return;
    }

    const newEntry: TherapeuticPlanMovementRecord = {
      id: this.getNextMovementId(),
      pumpNumber: this.movementForm.pumpNumber.trim(),
      medicine: this.movementForm.medicine.trim() || this.plan?.drugCode || this.translate('common.notAvailable'),
      movementDate: this.movementForm.movementDate,
      operation: this.movementForm.operation,
      note: this.movementForm.note.trim(),
      expiryDate: this.movementForm.expiryDate,
      broken: this.movementForm.broken
    };

    this.movementEntries = this.sortMovementEntries([newEntry, ...this.movementEntries]);
    this.closeMovementModal();
  }

  getMovementOperationLabel(value: TherapeuticPlanMovementOperation): string {
    return this.translate(`therapeuticPlan.movements.operation.${value}`);
  }

  getMovementBrokenLabel(value: boolean): string {
    return this.translate(value ? 'common.yes' : 'common.no');
  }

  openVisitModal(): void {
    this.visitErrorMessage = '';
    this.visitModalStep = 1;
    // Recupera il JSON schema dal piano terapeutico corrente (esempio: this.plan?.jsonVisit)
    let schema: any = null;
    try {
      if (this.plan && typeof this.plan.jsonVisit === 'string' && this.plan.jsonVisit.trim().length > 0) {
        const parsed = JSON.parse(this.plan.jsonVisit);
        if (parsed && typeof parsed === 'object' && parsed.properties) {
          schema = parsed;
        }
      }
    } catch {
      schema = null;
    }
    this.visitSchemaProperties = schema && schema.properties ? schema.properties : {};
    this.visitVisibleSchemaFields = Object.entries(this.visitSchemaProperties)
      .filter(([, property]) => this.isVisitSchemaEditableProperty(property))
      .map(([key, value]) => ({ key, value }));
    this.visitSchemaRequired = Array.isArray(schema?.required)
      ? schema.required.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
          .filter((entry: string) => this.visitVisibleSchemaFields.some((field) => field.key === entry))
      : [];
    // Inizializza i valori del form dinamico
    this.visitFormDynamic = {};
    for (const key of this.visitVisibleSchemaFields.map((field) => field.key)) {
      this.visitFormDynamic[key] = this.getInitialVisitSchemaFieldValue(key);
    }
    this.syncVisitFormFromDynamic();
    this.visitModalOpen = true;
  }

  closeVisitModal(): void {
    this.visitModalOpen = false;
    this.visitModalStep = 1;
    this.visitErrorMessage = '';
    this.visitForm = this.createEmptyVisitForm();
  }

  goToNextVisitModalStep(): void {
    this.visitErrorMessage = '';
    if (this.visitModalStep === 1 && !this.validateVisitBaseStep()) {
      return;
    }

    this.visitModalStep = Math.min(7, this.visitModalStep + 1);
  }

  goToPreviousVisitModalStep(): void {
    this.visitErrorMessage = '';
    this.visitModalStep = Math.max(1, this.visitModalStep - 1);
  }

  saveVisit(): void {
    this.visitErrorMessage = '';
    this.syncVisitFormFromDynamic();
    if (!this.validateVisitBaseStep()) {
      return;
    }

    const visitRecord = this.createVisitRecordFromForm();

    const payload = {
      therapeuticPlanId: this.planId,
      date: this.visitForm.duodopaTherapyStartDate,
      // duodopa not present in visitForm; leave null so backend template controls it
      duodopa: null,
      caregiver: this.visitForm.caregiver,
      clinicalCenter: this.visitForm.clinicalCenter.trim(),
      neurologist: this.visitForm.neurologist.trim(),
      gastroenterologist: this.visitForm.gastroenterologist.trim(),
      type: this.visitForm.type,
      priority: this.visitForm.priority,
      jsonVisit: JSON.stringify(visitRecord)
    };

    const url = `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/visits`;
    this.http.post<any>(url, payload).subscribe({
      next: (saved) => {
        // after successful persist, reload visits from DB
        if (this.planId != null) {
          this.fetchVisits(this.planId);
        }
        this.closeVisitModal();
      },
      error: (err) => {
        this.visitErrorMessage = this.translate('therapeuticPlan.visits.saveError') || 'Errore durante il salvataggio della visita';
      }
    });
  }

  getVisitTypeLabel(value: TherapeuticPlanVisitType): string {
    return this.translate(`therapeuticPlan.visits.type.${value}`);
  }

  getVisitPatientFullName(visit: TherapeuticPlanVisitRecord): string {
    return `${visit.patientFirstName} ${visit.patientLastName}`.trim() || this.visitPatientFullName;
  }

  getVisitCaregiverLabel(value: TherapeuticPlanVisitCaregiver): string {
    return this.translate(`therapeuticPlan.visits.caregiver.${value}`);
  }

  getVisitPriorityLabel(value: TherapeuticPlanVisitPriority): string {
    return this.translate(`therapeuticPlan.visits.priority.${value}`);
  }

  getVisitAutonomyLevelLabel(value: TherapeuticPlanVisitAutonomyLevel): string {
    return this.translate(`therapeuticPlan.visits.status.autonomy.level.${value}`);
  }

  printVisitDocument(visit?: TherapeuticPlanVisitRecord): void {
    if (typeof window === 'undefined') {
      return;
    }

    const visitsToPrint = visit ? [visit] : this.visitEntries;
    if (visitsToPrint.length === 0) {
      return;
    }

    const iframe = window.document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    window.document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) {
      iframe.remove();
      return;
    }

    const cleanup = (): void => {
      window.setTimeout(() => iframe.remove(), 0);
    };

    iframeWindow.onafterprint = cleanup;
    iframeWindow.document.open();
    iframeWindow.document.write(this.buildVisitPrintDocument(visitsToPrint));
    iframeWindow.document.close();

    window.setTimeout(() => {
      iframeWindow.focus();
      iframeWindow.print();
    }, 300);
  }

  openVisitSummaryModal(visit: TherapeuticPlanVisitRecord): void {
    this.visitSummarySelectedVisit = visit;
    this.visitSummaryModalStep = 1;
    this.visitSummaryModalOpen = true;
  }

  closeVisitSummaryModal(): void {
    this.visitSummaryModalOpen = false;
    this.visitSummaryModalStep = 1;
    this.visitSummarySelectedVisit = null;
  }

  goToNextVisitSummaryModalStep(): void {
    this.visitSummaryModalStep = Math.min(3, this.visitSummaryModalStep + 1);
  }

  goToPreviousVisitSummaryModalStep(): void {
    this.visitSummaryModalStep = Math.max(1, this.visitSummaryModalStep - 1);
  }

  get visitSummaryModalStepTitleKey(): MessageKey {
    switch (this.visitSummaryModalStep) {
      case 2:
        return 'therapeuticPlan.visits.preview.step2.title';
      case 3:
        return 'therapeuticPlan.visits.preview.step3.title';
      default:
        return 'therapeuticPlan.visits.preview.step1.title';
    }
  }

  get visitSummaryModalStepDescriptionKey(): MessageKey {
    switch (this.visitSummaryModalStep) {
      case 2:
        return 'therapeuticPlan.visits.preview.step2.description';
      case 3:
        return 'therapeuticPlan.visits.preview.step3.description';
      default:
        return 'therapeuticPlan.visits.preview.step1.description';
    }
  }

  get isLastVisitSummaryModalStep(): boolean {
    return this.visitSummaryModalStep === 3;
  }

  getOptionLabel(options: TherapeuticPlanManageOption[], value: string | null | undefined): string {
    if (!value) {
      return this.translate('common.notAvailable');
    }

    const option = options.find((entry) => entry.value === value);
    return option ? this.translate(option.titleKey) : value;
  }

  hasVisitActionSelection(selectedValue: string, optionValue: string): boolean {
    return selectedValue === optionValue;
  }

  saveNotification(): void {
    if (!this.planId || this.notificationSaving) {
      return;
    }

    this.notificationErrorMessage = '';
    if (!this.notificationForm.sentDate.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.sentDateRequired');
      return;
    }
    if (!this.notificationForm.subject.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.subjectRequired');
      return;
    }
    if (!this.notificationForm.message.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.messageRequired');
      return;
    }
    if (this.notificationConfirmationSelected && !this.notificationForm.confirmationDate.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.confirmationDateRequired');
      return;
    }
    if (this.notificationNotesRequired && !this.notificationForm.notes.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.notesRequiredWhenRejected');
      return;
    }

    this.notificationSaving = true;
    const payload: TherapeuticPlanNotification = {
      therapeuticPlanId: this.planId,
      sentDate: this.notificationForm.sentDate,
      sentByOperator: this.notificationForm.sentByOperator.trim() || undefined,
      subject: this.notificationForm.subject.trim(),
      message: this.notificationForm.message.trim(),
      confirmed: this.notificationForm.confirmedChoice === '' ? null : this.notificationForm.confirmedChoice === 'yes',
      confirmationDate: this.notificationConfirmationSelected ? this.notificationForm.confirmationDate.trim() : null,
      notes: this.notificationForm.notes.trim() || null
    };

    const request = this.isEditingNotification && this.editingNotificationId !== null
      ? this.http.put<TherapeuticPlanNotification>(
          `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/notifications/${this.editingNotificationId}`,
          payload
        )
      : this.http.post<TherapeuticPlanNotification>(
          `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/notifications`,
          payload
        );

    request.subscribe({
      next: (savedNotification) => {
        this.notificationSaving = false;
        this.notifications = this.sortNotifications([
          savedNotification,
          ...this.notifications.filter((currentNotification) => currentNotification.id !== savedNotification.id)
        ]);
        this.closeNotificationModal();
      },
      error: (error: HttpErrorResponse) => {
        this.notificationSaving = false;
        this.notificationErrorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private loadManageData(planId: number): void {
    forkJoin({
      plan: this.http.get<TherapeuticPlanManageResponse>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}`),
      notifications: this.http.get<TherapeuticPlanNotification[]>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}/notifications`).pipe(catchError(() => of([] as TherapeuticPlanNotification[]))),
      alerts: this.http.get<TherapeuticPlanAlert[]>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}/alerts`).pipe(catchError(() => of([] as TherapeuticPlanAlert[]))),
      patients: this.http.get<TherapeuticPlanPatient[]>(`${environment.apiBaseUrl}/patients`).pipe(catchError(() => of([] as TherapeuticPlanPatient[]))),
      hospitals: this.structureApiService.getStructuresByType('HOSPITAL', true).pipe(catchError(() => of([] as StructureDto[]))),
      specialistClinics: this.structureApiService.getStructuresByType('SPECIALIST_CLINIC', true).pipe(catchError(() => of([] as StructureDto[]))),
      nurses: this.http.get<TherapeuticPlanNurse[]>(`${environment.apiBaseUrl}/nurses`).pipe(catchError(() => of([] as TherapeuticPlanNurse[]))),
      doctors: this.http.get<TherapeuticPlanDoctor[]>(`${environment.apiBaseUrl}/doctors`).pipe(catchError(() => of([] as TherapeuticPlanDoctor[]))),
      equipment: this.http.get<TherapeuticPlanEquipment[]>(`${environment.apiBaseUrl}/equipment`).pipe(catchError(() => of([] as TherapeuticPlanEquipment[])))
    }).subscribe({
      next: ({ plan, notifications, alerts, patients, hospitals, specialistClinics, nurses, doctors, equipment }) => {
        // Controllo progetto
        const currentProject = this.authService.getSelectedProject();
        if (plan.projectCode !== currentProject) {
          this.router.navigateByUrl('/forbidden');
          return;
        }
        this.plan = plan;
        this.patient = patients.find((currentPatient) => currentPatient.id === plan.patientId) ?? null;
        this.structure = [...hospitals, ...specialistClinics].find((currentStructure) => currentStructure.id === plan.structureId) ?? null;
        this.nurse = nurses.find((currentNurse) => currentNurse.id === plan.nurseId) ?? null;
        this.doctor = doctors.find((currentDoctor) => currentDoctor.id === plan.doctorId) ?? null;
        this.selectedEquipment = (equipment ?? []).filter((currentEquipment) => plan.equipmentIds?.includes(currentEquipment.id));
        this.notifications = this.sortNotifications(notifications ?? []);
        this.alerts = this.sortAlerts(alerts ?? []);
        this.loading = false;
        // load visits from backend
        this.fetchVisits(planId);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const detail = typeof error.error?.detail === 'string' ? error.error.detail.trim() : '';
    if (detail) {
      return detail;
    }

    const message = typeof error.error?.message === 'string' ? error.error.message.trim() : '';
    if (message) {
      return message;
    }

    return this.translate('crud.error.load');
  }

  private createEmptyAlertForm(): TherapeuticPlanAlertForm {
    return {
      date: this.getTodayDateInputValue(),
      subject: '',
      confirmationRequired: true,
      confirmationSent: 'no'
    };
  }

  private createEmptyNotificationForm(): TherapeuticPlanNotificationForm {
    return {
      sentDate: this.getTodayDateInputValue(),
      sentByOperator: this.getCurrentOperatorDisplayLabel(),
      subject: '',
      message: '',
      confirmedChoice: '',
      confirmationDate: '',
      confirmedByDoctor: '',
      notes: ''
    };
  }

  /**
   * Inizializza uno storico PEG mockato per popolare la sottocartella paziente in assenza di backend dedicato.
   */
  private createMockPegHistoryEntries(): TherapeuticPlanPegHistoryRecord[] {
    return this.sortPegHistoryEntries([
      {
        id: 1,
        model: 'PEG 20 Fr - Standard',
        insertionDate: '2026-04-14',
        firstPeg: false,
        replacementReason: 'planned'
      },
      {
        id: 2,
        model: 'PEG 20 Fr - Balloon',
        insertionDate: '2025-11-03',
        firstPeg: false,
        replacementReason: 'complaint'
      },
      {
        id: 3,
        model: 'PEG 15 Fr - Initial kit',
        insertionDate: '2025-02-18',
        firstPeg: true,
        replacementReason: null
      }
    ]);
  }

  private createEmptyPegHistoryForm(): TherapeuticPlanPegHistoryForm {
    return {
      model: '',
      insertionDate: this.getTodayDateInputValue(),
      firstPeg: false,
      replacementReason: ''
    };
  }

  /**
   * Prepara una cronistoria mockata delle movimentazioni pompa per la nuova tab Movimentazioni.
   */
  private createMockMovementEntries(): TherapeuticPlanMovementRecord[] {
    const medicine = this.plan?.drugCode || 'Duodopa';
    return this.sortMovementEntries([
      {
        id: 1,
        pumpNumber: 'PMP-2026-0148',
        medicine,
        movementDate: '2026-04-16',
        operation: 'atPatient',
        note: 'Nuova pompa consegnata durante visita domiciliare.',
        expiryDate: '2027-04-16',
        broken: false
      },
      {
        id: 2,
        pumpNumber: 'PMP-2025-0987',
        medicine,
        movementDate: '2026-04-16',
        operation: 'pickupFromPatient',
        note: 'Pompa precedente ritirata per sostituzione programmata.',
        expiryDate: '2026-05-01',
        broken: false
      },
      {
        id: 3,
        pumpNumber: 'PMP-2024-0312',
        medicine,
        movementDate: '2026-01-09',
        operation: 'pickupFromPatient',
        note: 'Ritiro urgente per segnalazione guasto motore.',
        expiryDate: '2026-01-31',
        broken: true
      }
    ]);
  }

  private createEmptyMovementForm(): TherapeuticPlanMovementForm {
    return {
      pumpNumber: '',
      medicine: this.plan?.drugCode || '',
      movementDate: this.getTodayDateInputValue(),
      operation: 'atPatient',
      note: '',
      expiryDate: '',
      broken: false
    };
  }

  /**
   * Inizializza un riepilogo mockato delle visite del centro per popolare il tab Visite.
   */
  private createMockVisitEntries(): TherapeuticPlanVisitRecord[] {
    return this.sortVisitEntries([
      {
        id: 1,
        patientFirstName: this.patient?.firstName || 'Mario',
        patientLastName: this.patient?.lastName || 'Rossi',
        duodopaTherapyStartDate: '2018-11-26',
        caregiver: 'child',
        clinicalCenter: this.structureLabel,
        neurologist: this.doctorLabel,
        gastroenterologist: 'Dr. Stefano Conti',
        date: '2026-04-18',
        type: 'home',
        priority: 'medium',
        nurse: this.nurseLabel,
        nurseSignature: 'Firma Paziente',
        stomiaStatus: this.createMockVisitStomiaStatus({ skinPointX: 67, skinPointY: 36 }),
        stomiaActions: this.createMockVisitStomiaActions(),
        pegjStatus: this.createMockVisitPegjStatus(),
        pegjActions: this.createMockVisitPegjActions(),
        autonomyStatus: this.createMockVisitAutonomyStatus(),
        autonomyActions: this.createMockVisitAutonomyActions()
      },
      {
        id: 2,
        patientFirstName: 'Giulia',
        patientLastName: 'Bernardi',
        duodopaTherapyStartDate: '2019-09-14',
        caregiver: 'spouse',
        clinicalCenter: 'Centro Clinico Milano Nord',
        neurologist: 'Dr.ssa Elena Valli',
        gastroenterologist: 'Dr. Marco Bruni',
        date: '2026-04-15',
        type: 'followUpCenter',
        priority: 'low',
        nurse: 'Infermiera Carla Bianchi',
        nurseSignature: 'C. Bianchi',
        stomiaStatus: this.createMockVisitStomiaStatus({ skinVisualization: 'l1', secretionAmount: 'light', skinPointX: 41, skinPointY: 62 }),
        stomiaActions: this.createMockVisitStomiaActions({ secretionLoss: 'dressingTraining' }),
        pegjStatus: this.createMockVisitPegjStatus({ usageDuration: '6to12', mobilization: false, color: 'darkSpots' }),
        pegjActions: this.createMockVisitPegjActions({ mobilization: 'contactCenter', color: 'contactCenter' }),
        autonomyStatus: this.createMockVisitAutonomyStatus({ morningDoseAdministration: 'caregiver', extraDoseAdministration: 'autonomous' }),
        autonomyActions: this.createMockVisitAutonomyActions({ pumpUsageTraining: true })
      },
      {
        id: 3,
        patientFirstName: 'Matteo',
        patientLastName: 'De Luca',
        duodopaTherapyStartDate: '2020-02-03',
        caregiver: 'relative',
        clinicalCenter: 'Centro Clinico Monza',
        neurologist: 'Dr. Paolo Ricci',
        gastroenterologist: 'Dr.ssa Chiara Magri',
        date: '2026-04-12',
        type: 'remote',
        priority: 'none',
        nurse: 'Infermiera Marta Fusi',
        nurseSignature: 'M. Fusi',
        stomiaStatus: this.createMockVisitStomiaStatus({ secretionType: 'clear', skinPointX: 24, skinPointY: 28 }),
        stomiaActions: this.createMockVisitStomiaActions({ bumperMobilization: 'guideBumperReposition' }),
        pegjStatus: this.createMockVisitPegjStatus({ pegPatency: 'partial', pejPatency: 'partial', connectorStatus: 'damaged' }),
        pegjActions: this.createMockVisitPegjActions({ patency: 'washTraining', connectors: 'tapeMonitoring' }),
        autonomyStatus: this.createMockVisitAutonomyStatus({ pumpSwitchOn: 'autonomous', continuousDoseAdministration: 'autonomous' }),
        autonomyActions: this.createMockVisitAutonomyActions({ pegjWashingTraining: true })
      },
      {
        id: 4,
        patientFirstName: 'Lucia',
        patientLastName: 'Ferri',
        duodopaTherapyStartDate: '2017-06-21',
        caregiver: 'other',
        clinicalCenter: 'Centro Clinico Bergamo',
        neurologist: 'Dr. Luca Vitali',
        gastroenterologist: 'Dr. Davide Sala',
        date: '2026-04-08',
        type: 'trainingCenter',
        priority: 'high',
        nurse: 'Infermiera Elena Bassi',
        nurseSignature: 'E. Bassi',
        stomiaStatus: this.createMockVisitStomiaStatus({ skinVisualization: 'l2', secretionAmount: 'abundant', secretionType: 'purulent', skinPointX: 53, skinPointY: 74 }),
        stomiaActions: this.createMockVisitStomiaActions({ secretionLoss: 'contactCenter', skinVisualization: 'contactCenter' }),
        pegjStatus: this.createMockVisitPegjStatus({ integrity: 'swelling', externalBumperStatus: 'broken' }),
        pegjActions: this.createMockVisitPegjActions({ integrity: 'contactCenter', externalBumper: 'guideBumperReposition' }),
        autonomyStatus: this.createMockVisitAutonomyStatus({ pumpCassetteConnection: 'caregiver', pumpPegConnection: 'caregiver', pumpCassetteDisconnection: 'caregiver' }),
        autonomyActions: this.createMockVisitAutonomyActions({ pumpUsageTraining: true, pegjWashingTraining: true })
      },
      {
        id: 5,
        patientFirstName: 'Andrea',
        patientLastName: 'Rinaldi',
        duodopaTherapyStartDate: '2021-01-10',
        caregiver: 'child',
        clinicalCenter: 'Centro Clinico Brescia',
        neurologist: 'Dr.ssa Laura Neri',
        gastroenterologist: 'Dr. Pietro Galli',
        date: '2026-04-03',
        type: 'outpatient',
        priority: 'medium',
        nurse: 'Infermiera Sonia Riva',
        nurseSignature: 'S. Riva',
        stomiaStatus: this.createMockVisitStomiaStatus({ bumperMobilization: 'lt0_5cm', skinVisualization: 'normal', skinPointX: 79, skinPointY: 57 }),
        stomiaActions: this.createMockVisitStomiaActions(),
        pegjStatus: this.createMockVisitPegjStatus({ usageDuration: '0to6', pegType: 'boston' }),
        pegjActions: this.createMockVisitPegjActions(),
        autonomyStatus: this.createMockVisitAutonomyStatus({ pegCleaning: 'autonomous', pejCleaning: 'autonomous' }),
        autonomyActions: this.createMockVisitAutonomyActions()
      }
    ]);
  }

  private createEmptyVisitForm(): TherapeuticPlanVisitForm {
    return {
      patientFirstName: this.patient?.firstName || '',
      patientLastName: this.patient?.lastName || '',
      duodopaTherapyStartDate: this.plan?.startDate || '',
      caregiver: this.patient?.caregiverFullName?.trim() ? 'relative' : 'other',
      clinicalCenter: this.structureLabel === this.translate('common.notAvailable') ? '' : this.structureLabel,
      neurologist: this.doctorLabel === this.translate('common.notAvailable') ? '' : this.doctorLabel,
      gastroenterologist: '',
      date: this.getTodayDateInputValue(),
      type: 'outpatient',
      priority: 'none',
      stomiaStatus: this.createMockVisitStomiaStatus(),
      stomiaActions: this.createMockVisitStomiaActions(),
      pegjStatus: this.createMockVisitPegjStatus(),
      pegjActions: this.createMockVisitPegjActions(),
      autonomyStatus: this.createMockVisitAutonomyStatus(),
      autonomyActions: this.createMockVisitAutonomyActions()
    };
  }

  private createVisitRecordFromForm(): TherapeuticPlanVisitRecord {
    const operatorLabel = this.getCurrentOperatorDisplayLabel();

    return {
      id: 0,
      patientFirstName: this.visitForm.patientFirstName.trim(),
      patientLastName: this.visitForm.patientLastName.trim(),
      duodopaTherapyStartDate: this.visitForm.duodopaTherapyStartDate.trim(),
      caregiver: this.visitForm.caregiver,
      clinicalCenter: this.visitForm.clinicalCenter.trim(),
      neurologist: this.visitForm.neurologist.trim(),
      gastroenterologist: this.visitForm.gastroenterologist.trim(),
      date: this.visitForm.date,
      type: this.visitForm.type,
      priority: this.visitForm.priority,
      nurse: operatorLabel,
      nurseSignature: this.buildOperatorSignature(operatorLabel),
      stomiaStatus: { ...this.visitForm.stomiaStatus },
      stomiaActions: { ...this.visitForm.stomiaActions },
      pegjStatus: { ...this.visitForm.pegjStatus },
      pegjActions: { ...this.visitForm.pegjActions },
      autonomyStatus: { ...this.visitForm.autonomyStatus },
      autonomyActions: { ...this.visitForm.autonomyActions }
    };
  }

  private validateVisitBaseStep(): boolean {
    this.syncVisitFormFromDynamic();

    for (const key of this.visitSchemaRequired) {
      if (this.isVisitSchemaFieldEmpty(key)) {
        this.visitErrorMessage = `${this.getVisitSchemaFieldLabel(key)}: ${this.translate('crud.validation.required')}`;
        return false;
      }
    }

    return true;
  }

  getVisitSchemaFieldLabel(key: string): string {
    const schemaProperty = this.visitSchemaProperties[key];
    if (schemaProperty && typeof schemaProperty.title === 'string' && schemaProperty.title.trim().length > 0) {
      return schemaProperty.title.trim();
    }

    if (schemaProperty && typeof schemaProperty.label === 'string' && schemaProperty.label.trim().length > 0) {
      return schemaProperty.label.trim();
    }

    return key;
  }

  getVisitSchemaOptionLabel(key: string, option: unknown): string {
    const schemaProperty = this.visitSchemaProperties[key];
    const optionIndex = Array.isArray(schemaProperty?.enum)
      ? schemaProperty.enum.findIndex((entry: unknown) => entry === option)
      : -1;

    if (optionIndex >= 0 && Array.isArray(schemaProperty?.enumTitles) && typeof schemaProperty.enumTitles[optionIndex] === 'string') {
      return schemaProperty.enumTitles[optionIndex];
    }

    if (optionIndex >= 0 && Array.isArray(schemaProperty?.enumNames) && typeof schemaProperty.enumNames[optionIndex] === 'string') {
      return schemaProperty.enumNames[optionIndex];
    }

    return typeof option === 'string' || typeof option === 'number'
      ? String(option)
      : '';
  }

  getVisitSchemaInputType(key: string): string {
    const schemaProperty = this.visitSchemaProperties[key];
    if (schemaProperty?.type === 'number') {
      return 'number';
    }

    if (schemaProperty?.format === 'date-time') {
      return 'datetime-local';
    }

    if (schemaProperty?.format === 'date') {
      return 'date';
    }

    return 'text';
  }

  onVisitDynamicFieldChange(key: string, value: unknown): void {
    this.visitFormDynamic[key] = value;
    this.assignVisitFormValue(key, value);
  }

  private syncVisitFormFromDynamic(): void {
    for (const key of Object.keys(this.visitFormDynamic)) {
      this.assignVisitFormValue(key, this.visitFormDynamic[key]);
    }
  }

  private getVisitFormValue(key: string): unknown {
    const visitFormRecord = this.visitForm as unknown as Record<string, unknown>;
    return this.normalizeVisitSchemaFieldValue(key, visitFormRecord[key] ?? '');
  }

  private getInitialVisitSchemaFieldValue(key: string): unknown {
    const currentValue = this.getVisitFormValue(key);
    const schemaProperty = this.visitSchemaProperties[key];

    if (key === 'duodopaTherapyStartDate' && schemaProperty?.format === 'date-time') {
      if (typeof currentValue === 'string' && currentValue.trim().length > 0 && currentValue.includes('T')) {
        return currentValue;
      }

      return this.getCurrentDateTimeLocalInputValue();
    }

    return currentValue;
  }

  private assignVisitFormValue(key: string, value: unknown): void {
    if (!Object.prototype.hasOwnProperty.call(this.visitForm, key)) {
      return;
    }

    const visitFormRecord = this.visitForm as unknown as Record<string, unknown>;
    visitFormRecord[key] = value;
  }

  private isVisitSchemaFieldEmpty(key: string): boolean {
    const value = this.visitFormDynamic[key];

    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string') {
      return value.trim().length === 0;
    }

    return false;
  }

  private isVisitSchemaEditableProperty(property: any): boolean {
    if (!property || typeof property !== 'object') {
      return false;
    }

    if (Array.isArray(property.enum) && property.enum.length > 0) {
      return true;
    }

    return !property.type || property.type === 'string' || property.type === 'number';
  }

  private normalizeVisitSchemaFieldValue(key: string, value: unknown): unknown {
    const schemaProperty = this.visitSchemaProperties[key];
    if (typeof value !== 'string') {
      return value;
    }

    if (schemaProperty?.format === 'date-time') {
      return this.toDateTimeLocalInputValue(value);
    }

    return value;
  }

  private toDateTimeLocalInputValue(value: string): string {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmedValue)) {
      return trimmedValue;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
      return `${trimmedValue}T00:00`;
    }

    const parsedDate = new Date(trimmedValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return trimmedValue;
    }

    const timezoneOffset = parsedDate.getTimezoneOffset() * 60_000;
    return new Date(parsedDate.getTime() - timezoneOffset).toISOString().slice(0, 16);
  }

  private createMockVisitStomiaStatus(overrides: Partial<TherapeuticPlanVisitStomiaStatus> = {}): TherapeuticPlanVisitStomiaStatus {
    return {
      bumperMobilization: 'gt1cm',
      secretionAmount: 'absent',
      secretionType: 'otherMaterial',
      skinVisualization: 'normal',
      skinPointX: null,
      skinPointY: null,
      continuousInfusion: '1,1 (14h)',
      extraDose: '1,3',
      morningDose: '4,1',
      infusion24Hours: false,
      ...overrides
    };
  }

  private createMockVisitStomiaActions(overrides: Partial<TherapeuticPlanVisitStomiaActions> = {}): TherapeuticPlanVisitStomiaActions {
    return {
      bumperMobilization: 'none',
      secretionLoss: 'none',
      skinVisualization: 'none',
      ...overrides
    };
  }

  private createMockVisitPegjStatus(overrides: Partial<TherapeuticPlanVisitPegjStatus> = {}): TherapeuticPlanVisitPegjStatus {
    return {
      usageDuration: 'over12',
      replacementDate: '2023-06-16',
      pegType: 'abbvie15',
      pegTypeOtherDetail: '',
      mobilization: true,
      integrity: 'normal',
      color: 'normal',
      pegPatency: 'normal',
      pejPatency: 'normal',
      connectorStatus: 'normal',
      externalBumperStatus: 'normal',
      ...overrides
    };
  }

  private createMockVisitPegjActions(overrides: Partial<TherapeuticPlanVisitPegjActions> = {}): TherapeuticPlanVisitPegjActions {
    return {
      mobilization: 'none',
      integrity: 'none',
      color: 'none',
      patency: 'none',
      connectors: 'none',
      externalBumper: 'none',
      ...overrides
    };
  }

  setVisitStomiaSkinPoint(event: MouseEvent): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const bounds = target.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return;
    }

    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    this.visitForm.stomiaStatus.skinPointX = Math.min(100, Math.max(0, Number(x.toFixed(2))));
    this.visitForm.stomiaStatus.skinPointY = Math.min(100, Math.max(0, Number(y.toFixed(2))));
  }

  private createMockVisitAutonomyStatus(overrides: Partial<TherapeuticPlanVisitAutonomyStatus> = {}): TherapeuticPlanVisitAutonomyStatus {
    return {
      pumpCassetteConnection: 'caregiver',
      pumpPegConnection: 'caregiver',
      pumpSwitchOn: 'caregiver',
      morningDoseAdministration: 'caregiver',
      continuousDoseAdministration: 'caregiver',
      extraDoseAdministration: 'caregiver',
      pumpSwitchOff: 'caregiver',
      pumpPegDisconnection: 'caregiver',
      pegCleaning: 'caregiver',
      pejCleaning: 'caregiver',
      pumpCassetteDisconnection: 'caregiver',
      ...overrides
    };
  }

  private createMockVisitAutonomyActions(overrides: Partial<TherapeuticPlanVisitAutonomyActions> = {}): TherapeuticPlanVisitAutonomyActions {
    return {
      pumpUsageTraining: false,
      pegjWashingTraining: false,
      ...overrides
    };
  }

  private buildVisitPrintDocument(visits: TherapeuticPlanVisitRecord[]): string {
    const coverPages = this.paginateVisitPrintPages(visits);
    const patientHeader = this.visitPatientHeader;
    const detailVisit = visits[0] ?? null;
    const detailPagesCount = detailVisit ? 6 : 0;
    const totalPages = coverPages.length + detailPagesCount;
    const coverMarkup = coverPages
      .map((pageVisits, pageIndex) => this.buildVisitPrintPage(pageVisits, patientHeader, pageIndex + 1, totalPages, pageIndex === 0))
      .join('');
    const statusMarkup = detailVisit
      ? [
          this.buildVisitStomiaStatusPrintPage(detailVisit, coverPages.length + 1, totalPages),
          this.buildVisitPegjStatusPrintPage(detailVisit, coverPages.length + 2, totalPages),
          this.buildVisitAutonomyStatusPrintPage(detailVisit, coverPages.length + 3, totalPages),
          this.buildVisitStomiaActionsPrintPage(detailVisit, coverPages.length + 4, totalPages),
          this.buildVisitPegjActionsPrintPage(detailVisit, coverPages.length + 5, totalPages),
          this.buildVisitAutonomyActionsPrintPage(detailVisit, coverPages.length + 6, totalPages)
        ].join('')
      : '';
    const printMarkup = `${coverMarkup}${statusMarkup}`;

    return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <title>${this.escapeHtml(this.translate('therapeuticPlan.visits.print.documentTitle'))}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #111; margin: 0; }
      .page { min-height: 272mm; page-break-after: always; padding: 7mm; border: 1px solid #d7d7d7; }
      .page:last-child { page-break-after: auto; }
      .title { font-size: 30px; font-weight: 700; margin: 0 0 14px; }
      .subtitle { font-size: 17px; color: #444; margin: 0 0 20px; }
      .page-meta { display: flex; justify-content: space-between; gap: 12px; margin: 0 0 20px; color: #4a4a4a; font-size: 14px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }
      .field { border: 1px solid #cfcfcf; padding: 12px 14px; min-height: 80px; }
      .field-label { display: block; font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
      .field-value { font-size: 20px; font-weight: 600; }
      .full { grid-column: 1 / -1; }
      .visit-patient-card { border: 1px solid #d89a9a; padding: 16px 18px; margin-bottom: 20px; }
      .visit-patient-row { display: grid; grid-template-columns: minmax(240px, 1.3fr) minmax(180px, 0.8fr) minmax(200px, 0.9fr); gap: 12px; align-items: end; margin-bottom: 10px; }
      .visit-patient-row:last-child { margin-bottom: 0; }
      .visit-patient-field { min-height: 36px; }
      .visit-patient-field-full { grid-column: 1 / -1; }
      .visit-patient-label { display: inline-block; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-right: 6px; }
      .visit-patient-value { display: inline-block; min-width: 90px; border-bottom: 1px solid #111; padding: 0 4px 2px; font-size: 15px; }
      .visit-caregiver-group { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
      .visit-caregiver-option { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; }
      .visit-caregiver-box { width: 14px; height: 14px; border: 1px solid #111; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; line-height: 1; }
      .visit-list-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      .visit-list-table th, .visit-list-table td { border: 1px solid #cfcfcf; padding: 12px 14px; text-align: left; vertical-align: top; font-size: 14px; }
      .visit-list-table th { background: #f3f3f3; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
      .status-page-title { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; margin: 0 0 16px; }
      .status-page-title h2 { margin: 0; font-size: 30px; font-weight: 800; }
      .status-page-subtitle { margin: 0 0 4px; color: #444; font-size: 15px; }
      .status-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
      .status-panel { border: 2px solid #de9090; min-height: 100%; }
      .status-panel-header { padding: 10px 12px; color: #fff; font-size: 15px; font-weight: 800; text-align: center; text-transform: uppercase; }
      .status-panel-header.blue { background: #2d4f91; }
      .status-panel-header.red { background: #d85d5d; }
      .status-panel-body { padding: 10px 12px 12px; }
      .status-group { margin-bottom: 14px; }
      .status-group:last-child { margin-bottom: 0; }
      .status-group-title { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 800; text-align: center; }
      .status-options { display: grid; gap: 8px; }
      .status-options.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .status-options.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .status-options.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .status-skin-layout { display: grid; grid-template-columns: minmax(0, 1.35fr) 120px; gap: 16px; align-items: start; }
      .status-skin-figure { position: relative; width: 120px; height: 120px; border: 1.5px solid #d2c5a2; border-radius: 16px; background:
        radial-gradient(circle at center, transparent 0 42%, rgba(196, 171, 123, 0.18) 42% 44%, transparent 44% 100%),
        linear-gradient(90deg, transparent calc(50% - 0.5px), rgba(196, 171, 123, 0.72) calc(50% - 0.5px), rgba(196, 171, 123, 0.72) calc(50% + 0.5px), transparent calc(50% + 0.5px)),
        linear-gradient(transparent calc(50% - 0.5px), rgba(196, 171, 123, 0.72) calc(50% - 0.5px), rgba(196, 171, 123, 0.72) calc(50% + 0.5px), transparent calc(50% + 0.5px)); }
      .status-skin-point { display: block; position: absolute; width: 10px; height: 10px; border-radius: 999px; background: #d84d4d; border: 1px solid #fff; transform: translate(-50%, -50%); box-shadow: 0 0 0 1px rgba(216, 77, 77, 0.35); }
      .status-option { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
      .status-action-block { margin-top: 0; }
      .status-action-title { display: block; margin-bottom: 10px; color: #284983; font-size: 14px; font-weight: 800; text-align: center; text-transform: uppercase; }
      .status-box { width: 17px; height: 17px; border: 1px solid #777; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; line-height: 1; }
      .status-line-field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
      .status-line-field:last-child { margin-bottom: 0; }
      .status-line-label { font-weight: 700; white-space: nowrap; }
      .status-line-value { flex: 1; border-bottom: 1px solid #666; min-height: 18px; padding-bottom: 2px; }
      .status-autonomy-row { display: flex; flex-direction: column; gap: 5px; margin-bottom: 8px; }
      .status-autonomy-row:last-child { margin-bottom: 0; }
      .status-autonomy-label { display: block; width: 100%; padding: 5px 0 0; color: #1d3158; font-weight: 800; font-size: 13px; line-height: 1.2; text-align: center; white-space: normal; overflow-wrap: anywhere; }
      .status-autonomy-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; width: 100%; }
      .status-autonomy-choice { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 2px; min-height: 34px; padding: 2px 4px; font-size: 11px; text-align: center; white-space: normal; overflow-wrap: anywhere; }
      .status-autonomy-choice-label { line-height: 1.1; }
      @media print {
        .page { border: none; }
      }
    </style>
  </head>
  <body>
    ${printMarkup}
  </body>
</html>`;
  }

  private buildVisitPrintPage(
    visits: TherapeuticPlanVisitRecord[],
    patientHeader: TherapeuticPlanVisitPatientHeader,
    pageNumber: number,
    totalPages: number,
    includePatientHeader: boolean
  ): string {
    return `<section class="page">
      <h1 class="title">${this.escapeHtml(this.translate('therapeuticPlan.visits.print.coverTitle'))}</h1>
      <div class="page-meta">
        <span>${this.escapeHtml(this.translate('therapeuticPlan.visits.print.pageLabel'))} ${pageNumber} / ${totalPages}</span>
        <span>${this.escapeHtml(this.translate('therapeuticPlan.visits.print.generatedOn'))}: ${this.escapeHtml(this.formatDate(this.getTodayDateInputValue()))}</span>
      </div>
      <p class="subtitle">${this.escapeHtml(this.translate('therapeuticPlan.visits.print.coverSubtitle'))}</p>
      ${includePatientHeader ? this.buildVisitPatientPrintHeader(patientHeader) : ''}
      <table class="visit-list-table">
        <thead>
          <tr>
            <th>${this.escapeHtml(this.translate('therapeuticPlan.visits.field.date'))}</th>
            <th>${this.escapeHtml(this.translate('therapeuticPlan.visits.field.type'))}</th>
            <th>${this.escapeHtml(this.translate('therapeuticPlan.visits.field.priority'))}</th>
            <th>${this.escapeHtml(this.translate('therapeuticPlan.visits.field.nurse'))}</th>
            <th>${this.escapeHtml(this.translate('therapeuticPlan.visits.field.nurseSignature'))}</th>
          </tr>
        </thead>
        <tbody>
          ${visits.map((visit) => this.buildVisitPrintRow(visit)).join('')}
        </tbody>
      </table>
    </section>`;
  }

  private buildVisitStomiaStatusPrintPage(visit: TherapeuticPlanVisitRecord, pageNumber: number, totalPages: number): string {
    return `<section class="page">
      <div class="status-page-title">
        <h2>${this.escapeHtml(this.translate('therapeuticPlan.visits.status.reportTitle'))}</h2>
        <span>${this.escapeHtml(this.translate('therapeuticPlan.visits.print.pageLabel'))} ${pageNumber} / ${totalPages}</span>
      </div>
      <p class="status-page-subtitle">${this.escapeHtml(this.getVisitPatientFullName(visit))} - ${this.escapeHtml(this.formatDate(visit.date))} - ${this.escapeHtml(this.getVisitTypeLabel(visit.type))}</p>
      ${this.buildVisitStatusStomiaPrintPanel(visit.stomiaStatus)}
    </section>`;
  }

  private buildVisitStomiaActionsPrintPage(visit: TherapeuticPlanVisitRecord, pageNumber: number, totalPages: number): string {
    return `<section class="page">
      <div class="status-page-title">
        <h2>${this.escapeHtml(this.translate('therapeuticPlan.visits.actionsTaken.title'))}</h2>
        <span>${this.escapeHtml(this.translate('therapeuticPlan.visits.print.pageLabel'))} ${pageNumber} / ${totalPages}</span>
      </div>
      <p class="status-page-subtitle">${this.escapeHtml(this.getVisitPatientFullName(visit))} - ${this.escapeHtml(this.formatDate(visit.date))} - ${this.escapeHtml(this.getVisitTypeLabel(visit.type))}</p>
      ${this.buildVisitStomiaActionsPanel(visit.stomiaActions)}
    </section>`;
  }

  private buildVisitPegjStatusPrintPage(visit: TherapeuticPlanVisitRecord, pageNumber: number, totalPages: number): string {
    return `<section class="page">
      <div class="status-page-title">
        <h2>${this.escapeHtml(this.translate('therapeuticPlan.visits.status.reportTitle'))}</h2>
        <span>${this.escapeHtml(this.translate('therapeuticPlan.visits.print.pageLabel'))} ${pageNumber} / ${totalPages}</span>
      </div>
      <p class="status-page-subtitle">${this.escapeHtml(this.getVisitPatientFullName(visit))} - ${this.escapeHtml(this.formatDate(visit.date))} - ${this.escapeHtml(this.getVisitTypeLabel(visit.type))}</p>
      ${this.buildVisitStatusPegjPrintPanel(visit.pegjStatus)}
    </section>`;
  }

  private buildVisitPegjActionsPrintPage(visit: TherapeuticPlanVisitRecord, pageNumber: number, totalPages: number): string {
    return `<section class="page">
      <div class="status-page-title">
        <h2>${this.escapeHtml(this.translate('therapeuticPlan.visits.actionsTaken.title'))}</h2>
        <span>${this.escapeHtml(this.translate('therapeuticPlan.visits.print.pageLabel'))} ${pageNumber} / ${totalPages}</span>
      </div>
      <p class="status-page-subtitle">${this.escapeHtml(this.getVisitPatientFullName(visit))} - ${this.escapeHtml(this.formatDate(visit.date))} - ${this.escapeHtml(this.getVisitTypeLabel(visit.type))}</p>
      ${this.buildVisitPegjActionsPanel(visit.pegjActions)}
    </section>`;
  }

  private buildVisitAutonomyStatusPrintPage(visit: TherapeuticPlanVisitRecord, pageNumber: number, totalPages: number): string {
    return `<section class="page">
      <div class="status-page-title">
        <h2>${this.escapeHtml(this.translate('therapeuticPlan.visits.status.reportTitle'))}</h2>
        <span>${this.escapeHtml(this.translate('therapeuticPlan.visits.print.pageLabel'))} ${pageNumber} / ${totalPages}</span>
      </div>
      <p class="status-page-subtitle">${this.escapeHtml(this.getVisitPatientFullName(visit))} - ${this.escapeHtml(this.formatDate(visit.date))} - ${this.escapeHtml(this.getVisitTypeLabel(visit.type))}</p>
      ${this.buildVisitStatusAutonomyPrintPanel(visit.autonomyStatus)}
    </section>`;
  }

  private buildVisitAutonomyActionsPrintPage(visit: TherapeuticPlanVisitRecord, pageNumber: number, totalPages: number): string {
    return `<section class="page">
      <div class="status-page-title">
        <h2>${this.escapeHtml(this.translate('therapeuticPlan.visits.actionsTaken.title'))}</h2>
        <span>${this.escapeHtml(this.translate('therapeuticPlan.visits.print.pageLabel'))} ${pageNumber} / ${totalPages}</span>
      </div>
      <p class="status-page-subtitle">${this.escapeHtml(this.getVisitPatientFullName(visit))} - ${this.escapeHtml(this.formatDate(visit.date))} - ${this.escapeHtml(this.getVisitTypeLabel(visit.type))}</p>
      ${this.buildVisitAutonomyActionsPanel(visit.autonomyActions)}
    </section>`;
  }

  private buildVisitPatientPrintHeader(patientHeader: TherapeuticPlanVisitPatientHeader): string {
    const caregiverOptions: TherapeuticPlanVisitCaregiver[] = ['child', 'spouse', 'relative', 'other'];

    return `<section class="visit-patient-card">
      <div class="visit-patient-row">
        ${this.buildVisitInlinePrintField('therapeuticPlan.visits.field.patientFirstName', patientHeader.patientFirstName)}
        ${this.buildVisitInlinePrintField('therapeuticPlan.visits.field.patientLastName', patientHeader.patientLastName)}
        ${this.buildVisitInlinePrintField('therapeuticPlan.visits.field.duodopaTherapyStartDate', this.formatDate(patientHeader.duodopaTherapyStartDate))}
      </div>
      <div class="visit-patient-row">
        <div class="visit-patient-field visit-patient-field-full">
          <span class="visit-patient-label">${this.escapeHtml(this.translate('therapeuticPlan.visits.field.caregiver'))}</span>
          <span class="visit-caregiver-group">
            ${caregiverOptions.map((option) => this.buildVisitCaregiverPrintOption(option, patientHeader.caregiver)).join('')}
          </span>
        </div>
      </div>
      <div class="visit-patient-row">
        ${this.buildVisitInlinePrintField('therapeuticPlan.visits.field.clinicalCenter', patientHeader.clinicalCenter, true)}
      </div>
      <div class="visit-patient-row">
        ${this.buildVisitInlinePrintField('therapeuticPlan.visits.field.neurologist', patientHeader.neurologist, true)}
      </div>
      <div class="visit-patient-row">
        ${this.buildVisitInlinePrintField('therapeuticPlan.visits.field.gastroenterologist', patientHeader.gastroenterologist, true)}
      </div>
    </section>`;
  }

  private buildVisitInlinePrintField(labelKey: MessageKey | string, value: string, fullWidth = false): string {
    return `<div class="visit-patient-field${fullWidth ? ' visit-patient-field-full' : ''}">
      <span class="visit-patient-label">${this.escapeHtml(this.translate(labelKey))}</span>
      <span class="visit-patient-value">${this.escapeHtml(value || this.translate('common.notAvailable'))}</span>
    </div>`;
  }

  private buildVisitCaregiverPrintOption(
    option: TherapeuticPlanVisitCaregiver,
    selected: TherapeuticPlanVisitCaregiver
  ): string {
    const marker = option === selected ? 'X' : '&nbsp;';
    return `<span class="visit-caregiver-option">
      <span class="visit-caregiver-box">${marker}</span>
      <span>${this.escapeHtml(this.getVisitCaregiverLabel(option))}</span>
    </span>`;
  }

  private buildVisitPrintRow(visit: TherapeuticPlanVisitRecord): string {
    const signatureLabel = visit.type === 'home'
      ? this.translate('therapeuticPlan.visits.field.patientSignature')
      : this.translate('therapeuticPlan.visits.field.nurseSignature');

    return `<tr>
      <td>${this.escapeHtml(this.formatDate(visit.date))}</td>
      <td>${this.escapeHtml(this.getVisitTypeLabel(visit.type))}</td>
      <td>${this.escapeHtml(this.getVisitPriorityLabel(visit.priority))}</td>
      <td>${this.escapeHtml(visit.nurse)}</td>
      <td>${this.escapeHtml(`${signatureLabel}: ${visit.nurseSignature}`)}</td>
    </tr>`;
  }

  private buildVisitStatusStomiaPrintPanel(status: TherapeuticPlanVisitStomiaStatus): string {
    return `<section class="status-panel">
      <div class="status-panel-header blue">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.stomia.title'))}</div>
      <div class="status-panel-body">
        <div class="status-group">
          <span class="status-group-title">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.stomia.bumperMobilization'))}</span>
          <div class="status-options cols-3">
            ${this.buildVisitStatusOption(status.bumperMobilization === 'eq0_5cm', 'therapeuticPlan.visits.status.stomia.bumper.eq0_5cm')}
            ${this.buildVisitStatusOption(status.bumperMobilization === 'gt1cm', 'therapeuticPlan.visits.status.stomia.bumper.gt1cm')}
            ${this.buildVisitStatusOption(status.bumperMobilization === 'lt0_5cm', 'therapeuticPlan.visits.status.stomia.bumper.lt0_5cm')}
          </div>
        </div>
        <div class="status-group">
          <span class="status-group-title">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.stomia.secretionLoss'))}</span>
          <div class="status-options cols-3">
            ${this.buildVisitStatusOption(status.secretionAmount === 'absent', 'therapeuticPlan.visits.status.stomia.secretionAmount.absent')}
            ${this.buildVisitStatusOption(status.secretionAmount === 'light', 'therapeuticPlan.visits.status.stomia.secretionAmount.light')}
            ${this.buildVisitStatusOption(status.secretionAmount === 'abundant', 'therapeuticPlan.visits.status.stomia.secretionAmount.abundant')}
          </div>
          <div class="status-options cols-3" style="margin-top: 8px;">
            ${this.buildVisitStatusOption(status.secretionType === 'clear', 'therapeuticPlan.visits.status.stomia.secretionType.clear')}
            ${this.buildVisitStatusOption(status.secretionType === 'purulent', 'therapeuticPlan.visits.status.stomia.secretionType.purulent')}
            ${this.buildVisitStatusOption(status.secretionType === 'otherMaterial', 'therapeuticPlan.visits.status.stomia.secretionType.otherMaterial')}
          </div>
        </div>
        <div class="status-group">
          <span class="status-group-title">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.stomia.skinVisualization'))}</span>
          <div class="status-skin-layout">
            <div class="status-options">
              ${this.buildVisitStatusOption(status.skinVisualization === 'normal', 'therapeuticPlan.visits.status.stomia.skin.normal')}
              ${this.buildVisitStatusOption(status.skinVisualization === 'l1', 'therapeuticPlan.visits.status.stomia.skin.l1')}
              ${this.buildVisitStatusOption(status.skinVisualization === 'l2', 'therapeuticPlan.visits.status.stomia.skin.l2')}
              ${this.buildVisitStatusOption(status.skinVisualization === 'l3', 'therapeuticPlan.visits.status.stomia.skin.l3')}
              ${this.buildVisitStatusOption(status.skinVisualization === 'l4', 'therapeuticPlan.visits.status.stomia.skin.l4')}
              ${this.buildVisitStatusOption(status.skinVisualization === 'lx', 'therapeuticPlan.visits.status.stomia.skin.lx')}
            </div>
            <div class="status-skin-figure">${this.buildVisitStatusSkinPoint(status.skinPointX, status.skinPointY)}</div>
          </div>
        </div>
        <div class="status-group" style="margin-top: 16px;">
          <div class="status-panel-header red">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.stomia.infusionalDosages'))}</div>
          <div style="padding-top: 12px;">
            ${this.buildVisitStatusLineField('therapeuticPlan.visits.status.stomia.continuousInfusion', status.continuousInfusion)}
            ${this.buildVisitStatusLineField('therapeuticPlan.visits.status.stomia.extraDose', status.extraDose)}
            ${this.buildVisitStatusLineField('therapeuticPlan.visits.status.stomia.morningDose', status.morningDose)}
            <div class="status-line-field">
              <span class="status-line-label">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.stomia.infusion24Hours'))}</span>
              <span class="status-options cols-2" style="flex: 1;">
                ${this.buildVisitStatusOption(status.infusion24Hours, 'common.yes')}
                ${this.buildVisitStatusOption(!status.infusion24Hours, 'common.no')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }

  private buildVisitStatusPegjPrintPanel(status: TherapeuticPlanVisitPegjStatus): string {
    return `<section class="status-panel">
      <div class="status-panel-header red">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.pegj.title'))}</div>
      <div class="status-panel-body">
        <div class="status-group">
          <span class="status-group-title">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.pegj.usageDuration'))}</span>
          <div class="status-options cols-3">
            ${this.buildVisitStatusOption(status.usageDuration === '0to6', 'therapeuticPlan.visits.status.pegj.usage.0to6')}
            ${this.buildVisitStatusOption(status.usageDuration === '6to12', 'therapeuticPlan.visits.status.pegj.usage.6to12')}
            ${this.buildVisitStatusOption(status.usageDuration === 'over12', 'therapeuticPlan.visits.status.pegj.usage.over12')}
          </div>
        </div>
        ${this.buildVisitStatusLineField('therapeuticPlan.visits.status.pegj.replacementDate', this.formatDate(status.replacementDate))}
        <div class="status-group">
          <span class="status-group-title">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.pegj.typeLabel'))}</span>
          <div class="status-options cols-4">
            ${this.buildVisitStatusOption(status.pegType === 'boston', 'therapeuticPlan.visits.status.pegj.type.boston')}
            ${this.buildVisitStatusOption(status.pegType === 'abbvie15', 'therapeuticPlan.visits.status.pegj.type.abbvie15')}
            ${this.buildVisitStatusOption(status.pegType === 'abbvie20', 'therapeuticPlan.visits.status.pegj.type.abbvie20')}
            ${this.buildVisitStatusOption(status.pegType === 'other', 'therapeuticPlan.visits.status.pegj.type.other')}
          </div>
          ${status.pegType === 'other'
            ? this.buildVisitStatusLineField('therapeuticPlan.visits.status.pegj.type.otherDetail', status.pegTypeOtherDetail)
            : ''}
        </div>
        <div class="status-group">
          <span class="status-group-title">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.pegj.mobilization'))}</span>
          <div class="status-options cols-2">
            ${this.buildVisitStatusOption(status.mobilization, 'common.yes')}
            ${this.buildVisitStatusOption(!status.mobilization, 'common.no')}
          </div>
        </div>
        ${this.buildVisitStatusOptionGroup('therapeuticPlan.visits.status.pegj.integrity', status.integrity, this.visitPegIntegrityOptions)}
        ${this.buildVisitStatusOptionGroup('therapeuticPlan.visits.status.pegj.colorLabel', status.color, this.visitPegColorOptions)}
        ${this.buildVisitStatusOptionGroup('therapeuticPlan.visits.status.pegj.pegPatency', status.pegPatency, this.visitPegPatencyOptions)}
        ${this.buildVisitStatusOptionGroup('therapeuticPlan.visits.status.pegj.pejPatency', status.pejPatency, this.visitPegPatencyOptions)}
        ${this.buildVisitStatusOptionGroup('therapeuticPlan.visits.status.pegj.connectorStatus', status.connectorStatus, this.visitPegConnectorOptions)}
        ${this.buildVisitStatusOptionGroup('therapeuticPlan.visits.status.pegj.externalBumperStatus', status.externalBumperStatus, this.visitPegExternalBumperOptions)}
      </div>
    </section>`;
  }

  private buildVisitStatusAutonomyPrintPanel(status: TherapeuticPlanVisitAutonomyStatus): string {
    return `<section class="status-panel">
      <div class="status-panel-header blue">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.autonomy.title'))}</div>
      <div class="status-panel-body">
        ${this.visitAutonomyItems.map((item) => this.buildVisitStatusAutonomyRow(item, status[item.key])).join('')}
      </div>
    </section>`;
  }

  private buildVisitStomiaActionsPanel(actions: TherapeuticPlanVisitStomiaActions): string {
    return `<section class="status-panel">
      <div class="status-panel-header blue">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.stomia.title'))}</div>
      <div class="status-panel-body">
      <section class="status-action-block">
      ${this.buildVisitStatusActionGroup('therapeuticPlan.visits.status.stomia.bumperMobilization', actions.bumperMobilization, this.visitStomiaBumperActionOptions)}
      ${this.buildVisitStatusActionGroup('therapeuticPlan.visits.status.stomia.secretionLoss', actions.secretionLoss, this.visitStomiaCareActionOptions)}
      ${this.buildVisitStatusActionGroup('therapeuticPlan.visits.status.stomia.skinVisualization', actions.skinVisualization, this.visitStomiaCareActionOptions)}
    </section>
    </div>
    </section>`;
  }

  private buildVisitPegjActionsPanel(actions: TherapeuticPlanVisitPegjActions): string {
    return `<section class="status-panel">
      <div class="status-panel-header red">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.pegj.title'))}</div>
      <div class="status-panel-body">
      <section class="status-action-block">
      ${this.buildVisitStatusActionGroup('therapeuticPlan.visits.status.pegj.mobilization', actions.mobilization, this.visitActionNoneOrContactOptions)}
      ${this.buildVisitStatusActionGroup('therapeuticPlan.visits.status.pegj.integrity', actions.integrity, this.visitActionNoneOrContactOptions)}
      ${this.buildVisitStatusActionGroup('therapeuticPlan.visits.status.pegj.colorLabel', actions.color, this.visitActionNoneOrContactOptions)}
      ${this.buildVisitStatusActionGroup('therapeuticPlan.visits.status.pegj.pegPatency', actions.patency, this.visitPegjPatencyActionOptions)}
      ${this.buildVisitStatusActionGroup('therapeuticPlan.visits.status.pegj.connectorStatus', actions.connectors, this.visitPegjConnectorActionOptions)}
      ${this.buildVisitStatusActionGroup('therapeuticPlan.visits.status.pegj.externalBumperStatus', actions.externalBumper, this.visitPegjBumperActionOptions)}
    </section>
    </div>
    </section>`;
  }

  private buildVisitAutonomyActionsPanel(actions: TherapeuticPlanVisitAutonomyActions): string {
    return `<section class="status-panel">
      <div class="status-panel-header blue">${this.escapeHtml(this.translate('therapeuticPlan.visits.status.autonomy.title'))}</div>
      <div class="status-panel-body">
      <section class="status-action-block">
      <div class="status-group">
        <span class="status-group-title">${this.escapeHtml(this.translate('therapeuticPlan.visits.actionsTaken.autonomy.training'))}</span>
        <div class="status-options">
          ${this.visitAutonomyActionItems.map((item) => this.buildVisitStatusOption(actions[item.key], item.titleKey)).join('')}
        </div>
      </div>
    </section>
    </div>
    </section>`;
  }

  private buildVisitStatusActionGroup(labelKey: MessageKey | string, selectedValue: string, options: TherapeuticPlanManageOption[]): string {
    return `<div class="status-group">
      <span class="status-group-title">${this.escapeHtml(this.translate(labelKey))}</span>
      <div class="status-options">
        ${options.map((option) => this.buildVisitStatusOption(selectedValue === option.value, option.titleKey)).join('')}
      </div>
    </div>`;
  }

  private buildVisitStatusSkinPoint(x: number | null, y: number | null): string {
    if (x == null || y == null) {
      return '';
    }

    return `<span class="status-skin-point" style="left:${x}%; top:${y}%;"></span>`;
  }

  private buildVisitStatusAutonomyRow(item: TherapeuticPlanVisitAutonomyItem, selected: TherapeuticPlanVisitAutonomyLevel): string {
    return `<div class="status-autonomy-row">
      <span class="status-autonomy-label">${this.escapeHtml(this.translate(item.titleKey))}</span>
      <div class="status-autonomy-options">
        ${this.visitAutonomyLevelOptions.map((option) => `<span class="status-autonomy-choice">${this.buildVisitStatusBox(selected === option.value)}<span class="status-autonomy-choice-label">${this.escapeHtml(this.translate(option.titleKey))}</span></span>`).join('')}
      </div>
    </div>`;
  }

  private buildVisitStatusOptionGroup(labelKey: MessageKey | string, selectedValue: string, options: TherapeuticPlanManageOption[]): string {
    const columnClass = options.length > 2 ? 'cols-3' : 'cols-2';
    return `<div class="status-group">
      <span class="status-group-title">${this.escapeHtml(this.translate(labelKey))}</span>
      <div class="status-options ${columnClass}">
        ${options.map((option) => this.buildVisitStatusOption(selectedValue === option.value, option.titleKey)).join('')}
      </div>
    </div>`;
  }

  private buildVisitStatusLineField(labelKey: MessageKey | string, value: string): string {
    return `<div class="status-line-field">
      <span class="status-line-label">${this.escapeHtml(this.translate(labelKey))}</span>
      <span class="status-line-value">${this.escapeHtml(value || this.translate('common.notAvailable'))}</span>
    </div>`;
  }

  private buildVisitStatusOption(selected: boolean, labelKey: MessageKey | string): string {
    return `<span class="status-option">${this.buildVisitStatusBox(selected)}<span>${this.escapeHtml(this.translate(labelKey))}</span></span>`;
  }

  private buildVisitStatusBox(selected: boolean): string {
    return `<span class="status-box">${selected ? 'X' : '&nbsp;'}</span>`;
  }

  private chunkArray<T>(items: T[], size: number): T[][] {
    if (size <= 0) {
      return [items];
    }

    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }

    return chunks;
  }

  private paginateVisitPrintPages(items: TherapeuticPlanVisitRecord[]): TherapeuticPlanVisitRecord[][] {
    if (items.length === 0) {
      return [];
    }

    const firstPageSize = 8;
    const otherPagesSize = 12;
    const pages: TherapeuticPlanVisitRecord[][] = [];
    const firstPage = items.slice(0, firstPageSize);
    pages.push(firstPage);

    const remainingItems = items.slice(firstPageSize);
    if (remainingItems.length > 0) {
      pages.push(...this.chunkArray(remainingItems, otherPagesSize));
    }

    return pages;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private getTodayDateInputValue(): string {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60_000;
    return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
  }

  private getCurrentDateTimeLocalInputValue(): string {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
  }

  private normalizeConfirmationSent(value?: string): 'yes' | 'no' | 'na' {
    switch (value?.trim().toLowerCase()) {
      case 'yes':
        return 'yes';
      case 'no':
        return 'no';
      default:
        return 'na';
    }
  }

  private normalizeConfirmedChoice(value: boolean | null | undefined): '' | 'yes' | 'no' {
    if (value === true) {
      return 'yes';
    }

    if (value === false) {
      return 'no';
    }

    return '';
  }

  private getCurrentOperatorDisplayLabel(): string {
    return this.authService.getUsername()?.trim() || this.translate('common.notAvailable');
  }

  private buildOperatorSignature(operatorLabel: string): string {
    const trimmedOperatorLabel = operatorLabel.trim();
    if (!trimmedOperatorLabel || trimmedOperatorLabel === this.translate('common.notAvailable')) {
      return trimmedOperatorLabel;
    }

    const initials = trimmedOperatorLabel
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase());

    return initials.length > 0 ? `${initials.join('. ')}.` : trimmedOperatorLabel;
  }

  private parseVisitJsonVisit(jsonVisit?: string): Record<string, any> | null {
    if (typeof jsonVisit !== 'string' || jsonVisit.trim().length === 0) {
      return null;
    }

    try {
      const parsed = JSON.parse(jsonVisit);
      if (!this.isVisitObject(parsed)) {
        return null;
      }

      if (typeof parsed['jsonVisit'] === 'string' && parsed['jsonVisit'].trim().length > 0) {
        try {
          const nestedParsed = JSON.parse(parsed['jsonVisit']);
          if (this.isVisitObject(nestedParsed)) {
            return { ...parsed, ...nestedParsed };
          }
        } catch {
          return parsed;
        }
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private isVisitObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private getFirstNonBlankString(...values: Array<unknown>): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return '';
  }

  private sortNotifications(notifications: TherapeuticPlanNotification[]): TherapeuticPlanNotification[] {
    return [...notifications].sort((left, right) => {
      const leftDate = left.sentDate ?? '';
      const rightDate = right.sentDate ?? '';
      return rightDate.localeCompare(leftDate) || (right.id ?? 0) - (left.id ?? 0);
    });
  }

  private sortAlerts(alerts: TherapeuticPlanAlert[]): TherapeuticPlanAlert[] {
    return [...alerts].sort((left, right) => {
      const leftDate = left.date ?? '';
      const rightDate = right.date ?? '';
      return rightDate.localeCompare(leftDate) || (right.id ?? 0) - (left.id ?? 0);
    });
  }

  private sortPegHistoryEntries(entries: TherapeuticPlanPegHistoryRecord[]): TherapeuticPlanPegHistoryRecord[] {
    return [...entries].sort((left, right) => {
      const leftDate = left.insertionDate ?? '';
      const rightDate = right.insertionDate ?? '';
      return rightDate.localeCompare(leftDate) || right.id - left.id;
    });
  }

  private getNextPegHistoryId(): number {
    return this.pegHistoryEntries.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1;
  }

  private sortMovementEntries(entries: TherapeuticPlanMovementRecord[]): TherapeuticPlanMovementRecord[] {
    return [...entries].sort((left, right) => {
      const leftDate = left.movementDate ?? '';
      const rightDate = right.movementDate ?? '';
      return rightDate.localeCompare(leftDate) || right.id - left.id;
    });
  }

  private getNextMovementId(): number {
    return this.movementEntries.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1;
  }

  private sortVisitEntries(entries: TherapeuticPlanVisitRecord[]): TherapeuticPlanVisitRecord[] {
    return [...entries].sort((left, right) => {
      const leftDate = left.date ?? '';
      const rightDate = right.date ?? '';
      return rightDate.localeCompare(leftDate) || right.id - left.id;
    });
  }

  private getNextVisitId(): number {
    return this.visitEntries.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1;
  }

  private getMockMedicalRecord(): TherapeuticPlanMedicalRecordMock {
    const implementationDate = this.plan?.startDate || this.getTodayDateInputValue();
    const patientName = this.patientDisplayName;
    const centerLabel = this.medicalCenterLabel;
    return {
      title: this.medicalRecordTitle,
      patientName,
      patientCriticality: 'high',
      medicalCenter: centerLabel,
      implementationDate,
      pegjModel: 'PEGJ 20 Fr - standard',
      pumpCode: this.selectedEquipment[0]?.code || this.translate('common.notAvailable'),
      criticalityCards: this.medicalRecordCriticalityCards
    };
  }

  /**
   * Inizializza i campi editabili della cartella infermieristica con valori mock coerenti per la UI.
   */
  private createEmptyMedicalRecordContentForm(): TherapeuticPlanMedicalRecordContentForm {
    return {
      dataCartella: this.getTodayDateInputValue(),
      doseMattutinaMl: '5',
      doseContinuaF1MlH: '1.5',
      dalleOreF1: '08:00',
      alleOreF1: '12:00',
      doseExtraMl: '2',
      riempimentoJTubeMl: '15',
      infusioneF2: 'yes',
      doseContinuaF2MlH: '1.2',
      dalleOreF2: '13:00',
      alleOreF2: '18:00',
      infusioneF3: 'no',
      doseContinuaF3MlH: '',
      dalleOreF3: '',
      alleOreF3: '',
      totaleLevodopaMgDie: '650',
      reportedCriticality: 'low',
      patientConditionCriticality: 'medium',
      patientWeightKg: '72',
      patientHeightCm: '175',
      patientAgeYears: '68',
      wakeMotorCondition: 'partiallyActive',
      currentAgeYears: '69',
      diagnosisYear: '2018',
      patientLivesMode: 'homeWithCaregiver',
      caregivers: ['familyMember', 'professionalCaregiver'],
      travelAutonomy: 'familyManaged',
      clinicalCenterContactEase: 'medium',
      referenceGastroenterologist: 'center',
      referenceGastroenterologistName: this.doctorLabel === this.translate('common.notAvailable') ? '' : this.doctorLabel,
      clinicalCenterDistanceKm: '28',
      gastroenterologistContactEase: 'easy'
    };
  }

  onMedicalRecordInfusionChange(section: 'F2' | 'F3', value: 'yes' | 'no'): void {
    if (value === 'yes') {
      return;
    }

    if (section === 'F2') {
      this.medicalRecordContentForm.doseContinuaF2MlH = '';
      this.medicalRecordContentForm.dalleOreF2 = '';
      this.medicalRecordContentForm.alleOreF2 = '';
      return;
    }

    this.medicalRecordContentForm.doseContinuaF3MlH = '';
    this.medicalRecordContentForm.dalleOreF3 = '';
    this.medicalRecordContentForm.alleOreF3 = '';
  }
}