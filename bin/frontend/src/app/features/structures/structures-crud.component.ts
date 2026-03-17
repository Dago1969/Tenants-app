import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD strutture tenant.
 */
@Component({
  selector: 'app-structures-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" />`
})
export class StructuresCrudComponent {
  titleKey = 'structures.title' as const;
  endpoint = 'structures';
  fields: CrudField[] = [
    { key: 'name', labelKey: 'structures.field.name', type: 'text' },
    { key: 'address', labelKey: 'structures.field.address', type: 'text' }
  ];
}
