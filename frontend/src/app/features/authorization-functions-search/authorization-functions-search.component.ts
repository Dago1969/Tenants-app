import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';
import { t } from '../../i18n/messages';

const AUTHORIZATION_LABELS = {
  allow: t('authorizations.scope.allow'),
  deny: t('authorizations.scope.deny')
};

const AUTHORIZATION_OPTIONS = [
  { value: 'allow', label: AUTHORIZATION_LABELS.allow },
  { value: 'deny', label: AUTHORIZATION_LABELS.deny }
];

/**
 * Pagina ricerca autorizzazioni funzioni-modulo-ruolo.
 */
@Component({
  selector: 'app-authorization-functions-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
    />
  `
})
export class AuthorizationFunctionsSearchComponent {
  titleKey = 'authorizationFunctions.search.title' as const;
  endpoint = 'authorization-functions';

  filters: SearchField[] = [
    {
      key: 'roleId',
      labelKey: 'authorizationFunctions.field.roleId',
      type: 'select',
      optionsEndpoint: 'roles',
      optionValueKey: 'id',
      optionLabelKey: 'description'
    },
    {
      key: 'moduleCode',
      labelKey: 'authorizationFunctions.field.moduleCode',
      type: 'select',
      optionsEndpoint: 'modules',
      optionValueKey: 'code',
      optionLabelKey: 'name'
    },
    {
      key: 'functionCode',
      labelKey: 'authorizationFunctions.field.functionCode',
      type: 'select',
      optionsEndpoint: 'functions',
      optionValueKey: 'code',
      optionLabelKey: 'name'
    },
    {
      key: 'authorization',
      labelKey: 'authorizationFunctions.field.authorization',
      type: 'select',
      options: AUTHORIZATION_OPTIONS
    }
  ];

  resultColumns: SearchField[] = [
    { key: 'roleId', labelKey: 'authorizationFunctions.field.roleId', type: 'text' },
    { key: 'roleName', labelKey: 'authorizationFunctions.field.roleName', type: 'text' },
    { key: 'moduleCode', labelKey: 'authorizationFunctions.field.moduleCode', type: 'text' },
    { key: 'moduleName', labelKey: 'authorizationFunctions.field.moduleName', type: 'text' },
    { key: 'functionCode', labelKey: 'authorizationFunctions.field.functionCode', type: 'text' },
    { key: 'functionName', labelKey: 'authorizationFunctions.field.functionName', type: 'text' },
    {
      key: 'authorization',
      labelKey: 'authorizationFunctions.field.authorization',
      type: 'text',
      displayValueMap: AUTHORIZATION_LABELS
    }
  ];
}
