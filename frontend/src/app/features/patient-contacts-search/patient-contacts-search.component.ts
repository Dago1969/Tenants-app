import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageKey, t } from '../../i18n/messages';

type PatientContactType = 'phoneCall' | 'homeVisit' | 'message' | 'caregiverUpdate';

interface PatientContactRecord {
  therapeuticPlanId: number;
  date: string;
  type: PatientContactType;
  notesKey: MessageKey;
}

interface PatientContactFilterModel {
  therapeuticPlanId: string;
  date: string;
  type: string;
  notes: string;
  tableSearch: string;
}

/**
 * Search mockata dei contatti paziente associati a un piano terapeutico, costruita con lo stesso layout delle search standard.
 */
@Component({
  selector: 'app-patient-contacts-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-contacts-search.component.html',
  styleUrl: './patient-contacts-search.component.css'
})
export class PatientContactsSearchComponent {
  readonly titleKey = 'therapeuticPlan.patientContacts.search.title' as const;
  readonly subtitleKey = 'therapeuticPlan.patientContacts.search.subtitle' as const;

  readonly typeOptions: Array<{ value: PatientContactType; labelKey: MessageKey }> = [
    { value: 'phoneCall', labelKey: 'therapeuticPlan.patientContacts.type.phoneCall' },
    { value: 'homeVisit', labelKey: 'therapeuticPlan.patientContacts.type.homeVisit' },
    { value: 'message', labelKey: 'therapeuticPlan.patientContacts.type.message' },
    { value: 'caregiverUpdate', labelKey: 'therapeuticPlan.patientContacts.type.caregiverUpdate' }
  ];

  readonly mockContacts: PatientContactRecord[] = [
    {
      therapeuticPlanId: 12041,
      date: '2026-04-03',
      type: 'phoneCall',
      notesKey: 'therapeuticPlan.patientContacts.mock.notes.phoneCall1'
    },
    {
      therapeuticPlanId: 12041,
      date: '2026-04-09',
      type: 'homeVisit',
      notesKey: 'therapeuticPlan.patientContacts.mock.notes.homeVisit1'
    },
    {
      therapeuticPlanId: 12087,
      date: '2026-03-26',
      type: 'message',
      notesKey: 'therapeuticPlan.patientContacts.mock.notes.message1'
    },
    {
      therapeuticPlanId: 12102,
      date: '2026-04-11',
      type: 'caregiverUpdate',
      notesKey: 'therapeuticPlan.patientContacts.mock.notes.caregiverUpdate1'
    },
    {
      therapeuticPlanId: 12102,
      date: '2026-04-16',
      type: 'phoneCall',
      notesKey: 'therapeuticPlan.patientContacts.mock.notes.phoneCall2'
    }
  ];

  filterModel: PatientContactFilterModel = {
    therapeuticPlanId: '',
    date: '',
    type: '',
    notes: '',
    tableSearch: ''
  };

  translate(key: MessageKey | string): string {
    try {
      return t(key as MessageKey);
    } catch {
      return key;
    }
  }

  applyFilters(): void {
    // I filtri sono applicati al volo dai getter, quindi il submit serve solo a mantenere il comportamento da search template.
  }

  resetFilters(): void {
    this.filterModel = {
      therapeuticPlanId: '',
      date: '',
      type: '',
      notes: '',
      tableSearch: ''
    };
  }

  get filteredContacts(): PatientContactRecord[] {
    const planIdFilter = this.filterModel.therapeuticPlanId.trim();
    const dateFilter = this.filterModel.date.trim();
    const typeFilter = this.filterModel.type.trim();
    const notesFilter = this.filterModel.notes.trim().toLowerCase();
    const tableSearchFilter = this.filterModel.tableSearch.trim().toLowerCase();

    return this.mockContacts.filter((contact) => {
      if (planIdFilter && !String(contact.therapeuticPlanId).includes(planIdFilter)) {
        return false;
      }

      if (dateFilter && !contact.date.startsWith(dateFilter)) {
        return false;
      }

      if (typeFilter && contact.type !== typeFilter) {
        return false;
      }

      const notesText = this.getContactNotes(contact).toLowerCase();
      if (notesFilter && !notesText.includes(notesFilter)) {
        return false;
      }

      if (!tableSearchFilter) {
        return true;
      }

      const searchText = [
        String(contact.therapeuticPlanId),
        this.formatDate(contact.date),
        this.getContactTypeLabel(contact.type),
        notesText
      ].join(' ').toLowerCase();

      return searchText.includes(tableSearchFilter);
    });
  }

  getContactTypeLabel(type: PatientContactType): string {
    return this.translate(`therapeuticPlan.patientContacts.type.${type}`);
  }

  getContactNotes(contact: PatientContactRecord): string {
    return this.translate(contact.notesKey);
  }

  formatDate(value: string): string {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(parsedDate);
  }
}