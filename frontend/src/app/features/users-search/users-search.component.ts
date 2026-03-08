import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca utenti con filtri base.
 */
@Component({
  selector: 'app-users-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
    />
  `
})
export class UsersSearchComponent {
  titleKey = 'users.search.title' as const;
  endpoint = 'users/search';
  moduleCode = 'USER';
  createFunctionCode = 'CREATE';

  filters: SearchField[] = [
    { key: 'username', labelKey: 'users.field.username', type: 'text' },
    { key: 'roleId', labelKey: 'users.field.roleId', type: 'text' },
    { key: 'structureId', labelKey: 'users.field.structureId', type: 'number' },
    { key: 'enabled', labelKey: 'users.field.enabled', type: 'boolean' }
  ];

  resultColumns: SearchField[] = [
    { key: 'username', labelKey: 'users.field.username', type: 'text' },
    { key: 'roleId', labelKey: 'users.field.roleId', type: 'text' },
    { key: 'structureId', labelKey: 'users.field.structureId', type: 'number' },
    { key: 'enabled', labelKey: 'users.field.enabled', type: 'boolean' }
  ];
}
