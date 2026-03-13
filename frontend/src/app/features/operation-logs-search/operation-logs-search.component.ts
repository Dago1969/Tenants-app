import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';
import { t } from '../../i18n/messages';

/**
 * Pagina di consultazione dei log operativi generati dalle API tenant.
 */
@Component({
  selector: 'app-operation-logs-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [autoSearch]="true"
      [showCreateAction]="false"
      [showEditAction]="false"
      [showViewAction]="false"
      [showDeleteAction]="false"
    />
  `
})
export class OperationLogsSearchComponent {
  titleKey = 'operationLogs.search.title' as const;
  endpoint = 'operation-logs/search';

  filters: SearchField[] = [
    {
      key: 'moduleCode',
      labelKey: 'operationLogs.field.moduleCode',
      type: 'select',
      optionsEndpoint: 'modules',
      optionValueKey: 'code',
      optionLabelKey: 'name'
    },
    {
      key: 'functionCode',
      labelKey: 'operationLogs.field.functionCode',
      type: 'select',
      optionsEndpoint: 'functions',
      optionValueKey: 'code',
      optionLabelKey: 'name'
    },
    {
      key: 'operation',
      labelKey: 'operationLogs.field.operation',
      type: 'select',
      options: [
        { value: 'INSERT', label: t('operationLogs.operation.insert') },
        { value: 'UPDATE', label: t('operationLogs.operation.update') },
        { value: 'DELETE', label: t('operationLogs.operation.delete') }
      ]
    },
    {
      key: 'username',
      labelKey: 'operationLogs.field.username',
      type: 'autocomplete',
      optionsEndpoint: 'users/search',
      optionsQueryParamKey: 'username',
      optionValueKey: 'username',
      optionLabelKey: 'username'
    },
    { key: 'roleId', labelKey: 'operationLogs.field.roleId', type: 'text' },
    { key: 'targetId', labelKey: 'operationLogs.field.targetId', type: 'text' },
    { key: 'description', labelKey: 'operationLogs.field.description', type: 'text' }
  ];

  resultColumns: SearchField[] = [
    { key: 'occurredAt', labelKey: 'operationLogs.field.occurredAt', type: 'text' },
    { key: 'moduleCode', labelKey: 'operationLogs.field.moduleCode', type: 'text' },
    { key: 'functionCode', labelKey: 'operationLogs.field.functionCode', type: 'text' },
    { key: 'operation', labelKey: 'operationLogs.field.operation', type: 'text' },
    { key: 'username', labelKey: 'operationLogs.field.username', type: 'text' },
    { key: 'roleId', labelKey: 'operationLogs.field.roleId', type: 'text' },
    { key: 'targetId', labelKey: 'operationLogs.field.targetId', type: 'text' },
    { key: 'description', labelKey: 'operationLogs.field.description', type: 'text' }
  ];
}