import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina di ricerca delle attrezzature censite a sistema.
 */
@Component({
  selector: 'app-equipment-search',
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
export class EquipmentSearchComponent {
  titleKey = 'menu.equipmentSearch' as const;
  endpoint = 'equipment';
  createRoute = '/equipment/manage';
  detailRouteBase = '/equipment/manage';
  moduleCode = 'EQUIPMENT';
  createFunctionCode = 'CREATE';
  resultIdKey = 'id';
  resultIdLabelKey = 'equipment.field.id' as const;

  filters: SearchField[] = [
    { key: 'code', labelKey: 'equipment.field.code', type: 'text' },
    { key: 'equipmentTypeId', labelKey: 'equipment.field.equipmentType', type: 'select', optionsEndpoint: 'equipment-types', optionValueKey: 'id', optionLabelKey: 'name' },
    {
      key: 'status',
      labelKey: 'equipment.field.status',
      type: 'select',
      options: [
        { value: 'in_magazzino', label: 'status.in_magazzino' },
        { value: 'assegnato', label: 'status.assegnato' },
        { value: 'in_revisione', label: 'status.in_revisione' },
        { value: 'rotto', label: 'status.rotto' }
      ]
    },
    { key: 'serialNumber', labelKey: 'equipment.field.serialNumber', type: 'text' }
  ];

  resultColumns: SearchField[] = [
    { key: 'code', labelKey: 'equipment.field.code', type: 'text' },
    { key: 'equipmentTypeName', labelKey: 'equipment.field.equipmentType', type: 'text' },
    { key: 'serialNumber', labelKey: 'equipment.field.serialNumber', type: 'text' },
    { key: 'status', labelKey: 'equipment.field.status', type: 'text' },
    { key: 'location', labelKey: 'equipment.field.location', type: 'text' }
  ];
}