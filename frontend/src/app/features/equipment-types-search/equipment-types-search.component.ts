import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

@Component({
  selector: 'app-equipment-types-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [createRoute]="createRoute"
      [detailRouteBase]="detailRouteBase"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
      [resultIdKey]="resultIdKey"
      [resultIdLabelKey]="resultIdLabelKey"
      [autoSearch]="true"
    />
  `
})
export class EquipmentTypesSearchComponent {
  titleKey = 'menu.equipmentTypesSearch' as const;
  endpoint = 'equipment-types';
  createRoute = '/equipment-types/manage';
  detailRouteBase = '/equipment-types/manage';
  moduleCode = 'EQUIPMENT_TYPE';
  createFunctionCode = 'CREATE';
  resultIdKey = 'code';
  resultIdLabelKey = 'equipment.types.field.code' as const;

  filters: SearchField[] = [
    { key: 'code', labelKey: 'equipment.types.field.code', type: 'text' },
    { key: 'name', labelKey: 'equipment.types.field.name', type: 'text' },
    { key: 'status', labelKey: 'equipment.types.field.status', type: 'text' }
  ];

  resultColumns: SearchField[] = [
    { key: 'code', labelKey: 'equipment.types.field.code', type: 'text' },
    { key: 'name', labelKey: 'equipment.types.field.name', type: 'text' },
    { key: 'status', labelKey: 'equipment.types.field.status', type: 'text' }
  ];
}
