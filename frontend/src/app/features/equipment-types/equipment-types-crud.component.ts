import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD dei tipi attrezzatura persistiti a database.
 */
@Component({
  selector: 'app-equipment-types-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `
    <app-crud-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [fields]="fields"
      [entityKey]="entityKey"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
    />
  `
})
export class EquipmentTypesCrudComponent {
  titleKey = 'equipment.types.title' as const;
  endpoint = 'equipment-types';
  entityKey = 'code';
  moduleCode = 'EQUIPMENT_TYPE';
  createFunctionCode = 'CREATE';

  fields: CrudField[] = [
    { key: 'code', labelKey: 'equipment.types.field.code', type: 'text', lockOnEdit: true, required: true },
    { key: 'name', labelKey: 'equipment.types.field.name', type: 'text', required: true },
    { key: 'description', labelKey: 'equipment.types.field.description', type: 'text' },
    { key: 'use', labelKey: 'equipment.types.field.use', type: 'text' },
    { key: 'cost', labelKey: 'equipment.types.field.cost', type: 'number' },
    { key: 'supplier', labelKey: 'equipment.types.field.supplier', type: 'text' },
    { key: 'serialNumberRequired', labelKey: 'equipment.types.field.serialNumberRequired', type: 'checkbox' },
    { key: 'principalJsonPresent', labelKey: 'equipment.types.field.principalJsonPresent', type: 'checkbox' },
    { key: 'principalJsonPath', labelKey: 'equipment.types.field.principalJsonPath', type: 'text' },
    { key: 'secondaryJsonPresent', labelKey: 'equipment.types.field.secondaryJsonPresent', type: 'checkbox' },
    { key: 'secondaryJsonPath', labelKey: 'equipment.types.field.secondaryJsonPath', type: 'text' },
    { key: 'purchaseDate', labelKey: 'equipment.types.field.purchaseDate', type: 'date' },
    { key: 'status', labelKey: 'equipment.types.field.status', type: 'text' }
  ];
}