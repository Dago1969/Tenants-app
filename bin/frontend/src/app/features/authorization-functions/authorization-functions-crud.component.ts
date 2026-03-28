import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';
import { t } from '../../i18n/messages';

const AUTHORIZATION_OPTIONS = [
  { value: 'allow', label: t('authorizations.scope.allow') },
  { value: 'deny', label: t('authorizations.scope.deny') }
];

/**
 * Pagina CRUD autorizzazioni funzioni-modulo-ruolo.
 */
@Component({
  selector: 'app-authorization-functions-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" [entityKey]="entityKey" />`
})
export class AuthorizationFunctionsCrudComponent {
  titleKey = 'authorizationFunctions.title' as const;
  endpoint = 'authorization-functions';
  entityKey = 'id';
  fields: CrudField[] = [
    {
      key: 'roleId',
      labelKey: 'authorizationFunctions.field.roleId',
      type: 'select',
      lockOnEdit: true,
      optionsEndpoint: 'roles',
      optionValueKey: 'id',
      optionLabelKey: 'description',
      relatedFields: { roleName: 'description' }
    },
    { key: 'roleName', labelKey: 'authorizationFunctions.field.roleName', type: 'text', readonly: true },
    {
      key: 'moduleCode',
      labelKey: 'authorizationFunctions.field.moduleCode',
      type: 'select',
      lockOnEdit: true,
      optionsEndpoint: 'modules',
      optionValueKey: 'code',
      optionLabelKey: 'name',
      relatedFields: { moduleName: 'name' }
    },
    { key: 'moduleName', labelKey: 'authorizationFunctions.field.moduleName', type: 'text', readonly: true },
    {
      key: 'functionCode',
      labelKey: 'authorizationFunctions.field.functionCode',
      type: 'select',
      lockOnEdit: true,
      optionsEndpoint: 'functions',
      optionValueKey: 'code',
      optionLabelKey: 'name',
      relatedFields: { functionName: 'name' }
    },
    { key: 'functionName', labelKey: 'authorizationFunctions.field.functionName', type: 'text', readonly: true },
    {
      key: 'authorization',
      labelKey: 'authorizationFunctions.field.authorization',
      type: 'select',
      options: AUTHORIZATION_OPTIONS
    }
  ];
}
