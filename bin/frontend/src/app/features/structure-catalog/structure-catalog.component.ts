import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MessageKey, t } from '../../i18n/messages';

interface StructureDto {
  id?: number;
  code: string;
  name: string;
  description: string;
  address: string;
  cityId?: number | null;
  city: string;
  provinceId?: number | null;
  province: string;
  regionId?: number | null;
  region: string;
  phone: string;
  email: string;
  active: boolean;
  structureType: string;
  structureTypeDescription: string;
  functionDescription: string;
  parentStructureId?: number | null;
  parentStructureName?: string;
}

interface StructureTypeDto {
  code: string;
  description: string;
  functionDescription: string;
  parentTypeCode?: string | null;
  parentTypeDescription?: string | null;
}

interface StructureParentOptionDto {
  id: number;
  code: string;
  name: string;
  structureType: string;
  structureTypeDescription: string;
}

interface GeographyOptionDto {
  id: number;
  name: string;
}

@Component({
  selector: 'app-structure-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './structure-catalog.component.html',
  styleUrl: './structure-catalog.component.css'
})
export class StructureCatalogComponent implements OnInit {
  structures: StructureDto[] = [];
  parentOptions: StructureParentOptionDto[] = [];
  regionOptions: GeographyOptionDto[] = [];
  provinceOptions: GeographyOptionDto[] = [];
  cityOptions: GeographyOptionDto[] = [];
  currentType: StructureTypeDto | null = null;
  titleKey = 'structures.title' as MessageKey;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formModel: StructureDto = this.createEmptyForm();
  selectedStructureId: number | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const routeTitleKey = this.route.snapshot.data['titleKey'];
    if (routeTitleKey) {
      this.titleKey = routeTitleKey as MessageKey;
    }

    this.loadRegions();
    this.loadTypeMetadata();
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  isEditMode(): boolean {
    return typeof this.formModel.id === 'number';
  }

  hasParentRequirement(): boolean {
    return !!this.currentType?.parentTypeCode;
  }

  startCreate(): void {
    this.formModel = this.createEmptyForm();
    if (this.currentType) {
      this.formModel.structureType = this.currentType.code;
      this.formModel.active = true;
    }
    this.provinceOptions = [];
    this.cityOptions = [];
    this.errorMessage = '';
    this.successMessage = '';
  }

  edit(structure: StructureDto): void {
    this.formModel = {
      ...structure,
      parentStructureId: structure.parentStructureId ?? null
    };
    this.loadProvinces();
    this.loadCities();
    this.errorMessage = '';
    this.successMessage = '';
  }

  onRegionChange(): void {
    this.formModel.region = this.findOptionName(this.regionOptions, this.formModel.regionId);
    this.formModel.provinceId = null;
    this.formModel.province = '';
    this.formModel.cityId = null;
    this.formModel.city = '';
    this.cityOptions = [];
    this.loadProvinces();
  }

  onProvinceChange(): void {
    this.formModel.province = this.findOptionName(this.provinceOptions, this.formModel.provinceId);
    this.formModel.cityId = null;
    this.formModel.city = '';
    this.loadCities();
  }

  onCityChange(): void {
    this.formModel.city = this.findOptionName(this.cityOptions, this.formModel.cityId);
  }

  delete(structure: StructureDto): void {
    if (typeof structure.id !== 'number') {
      return;
    }

    this.http.delete<void>(`${environment.apiBaseUrl}/structures/${structure.id}`).subscribe({
      next: () => {
        this.successMessage = this.translate('structures.message.deleteSuccess');
        if (this.formModel.id === structure.id) {
          this.startCreate();
        }
        this.loadStructures();
      },
      error: () => {
        this.errorMessage = this.translate('structures.message.deleteError');
      }
    });
  }

  save(): void {
    if (!this.currentType || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.formModel.structureType = this.currentType.code;

    const request = this.isEditMode()
      ? this.http.put<StructureDto>(`${environment.apiBaseUrl}/structures/${this.formModel.id}`, this.formModel)
      : this.http.post<StructureDto>(`${environment.apiBaseUrl}/structures`, this.formModel);

    request.subscribe({
      next: () => {
        this.successMessage = this.translate(
          this.isEditMode() ? 'structures.message.updateSuccess' : 'structures.message.createSuccess'
        );
        this.saving = false;
        this.startCreate();
        this.loadStructures();
        this.loadParentOptions();
      },
      error: () => {
        this.errorMessage = this.translate(
          this.isEditMode() ? 'structures.message.updateError' : 'structures.message.createError'
        );
        this.saving = false;
      }
    });
  }

  parentLabel(parentOption: StructureParentOptionDto): string {
    return `${parentOption.code} - ${parentOption.name}`;
  }

  trackByStructure(_: number, structure: StructureDto): number | undefined {
    return structure.id;
  }

  private loadTypeMetadata(): void {
    this.http.get<StructureTypeDto[]>(`${environment.apiBaseUrl}/structures/types`).subscribe({
      next: (types) => {
        const structureTypeCode = String(this.route.snapshot.data['structureType'] ?? 'ASL');
        this.currentType = (types ?? []).find((type) => type.code === structureTypeCode) ?? null;
        this.startCreate();
        this.loadParentOptions();
        this.loadStructures();
        this.loadStructureFromRoute();
      },
      error: () => {
        this.currentType = null;
        this.errorMessage = this.translate('structures.message.loadError');
      }
    });
  }

  private loadStructures(): void {
    if (!this.currentType) {
      this.structures = [];
      return;
    }

    this.loading = true;
    const params = new HttpParams().set('structureType', this.currentType.code);
    this.http.get<StructureDto[]>(`${environment.apiBaseUrl}/structures`, { params }).subscribe({
      next: (structures) => {
        this.structures = structures ?? [];
        this.loading = false;
      },
      error: () => {
        this.structures = [];
        this.loading = false;
        this.errorMessage = this.translate('structures.message.loadError');
      }
    });
  }

  private loadStructureFromRoute(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const id = Number(idParam);
    if (Number.isNaN(id)) {
      return;
    }

    this.selectedStructureId = id;
    this.http.get<StructureDto>(`${environment.apiBaseUrl}/structures/${id}`).subscribe({
      next: (structure) => {
        this.edit(structure);
      },
      error: () => {
        this.errorMessage = this.translate('structures.message.loadError');
      }
    });
  }

  private loadParentOptions(): void {
    if (!this.currentType?.parentTypeCode) {
      this.parentOptions = [];
      return;
    }

    const params = new HttpParams().set('structureType', this.currentType.code);
    this.http.get<StructureParentOptionDto[]>(`${environment.apiBaseUrl}/structures/parent-options`, { params }).subscribe({
      next: (options) => {
        this.parentOptions = options ?? [];
      },
      error: () => {
        this.parentOptions = [];
      }
    });
  }

  private loadRegions(): void {
    this.http.get<GeographyOptionDto[]>(`${environment.apiBaseUrl}/geography/regions`).subscribe({
      next: (options) => {
        this.regionOptions = options ?? [];
      },
      error: () => {
        this.regionOptions = [];
      }
    });
  }

  private loadProvinces(): void {
    if (typeof this.formModel.regionId !== 'number') {
      this.provinceOptions = [];
      return;
    }

    this.http.get<GeographyOptionDto[]>(`${environment.apiBaseUrl}/geography/provinces/by-region/${this.formModel.regionId}`).subscribe({
      next: (options) => {
        this.provinceOptions = options ?? [];
      },
      error: () => {
        this.provinceOptions = [];
      }
    });
  }

  private loadCities(): void {
    if (typeof this.formModel.provinceId !== 'number') {
      this.cityOptions = [];
      return;
    }

    this.http.get<GeographyOptionDto[]>(`${environment.apiBaseUrl}/geography/cities/by-province/${this.formModel.provinceId}`).subscribe({
      next: (options) => {
        this.cityOptions = options ?? [];
      },
      error: () => {
        this.cityOptions = [];
      }
    });
  }

  private findOptionName(options: GeographyOptionDto[], optionId?: number | null): string {
    if (typeof optionId !== 'number') {
      return '';
    }

    return options.find((option) => option.id === optionId)?.name ?? '';
  }

  private createEmptyForm(): StructureDto {
    return {
      code: '',
      name: '',
      description: '',
      address: '',
      cityId: null,
      city: '',
      provinceId: null,
      province: '',
      regionId: null,
      region: '',
      phone: '',
      email: '',
      active: true,
      structureType: '',
      structureTypeDescription: '',
      functionDescription: '',
      parentStructureId: null,
      parentStructureName: ''
    };
  }
}
