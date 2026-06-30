import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { GeographyApiService, GeographicOptionDto } from '../../core/geography-api.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
  private routeParamSubscription?: Subscription;

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly geographyApi: GeographyApiService
  ) {}

  ngOnInit(): void {
    const routeStructureType = String(this.route.snapshot.data['structureType'] ?? '');
    if (routeStructureType === 'ASL') {
      void this.router.navigateByUrl('/structures/asl');
      return;
    }

    const routeTitleKey = this.route.snapshot.data['titleKey'];
    if (routeTitleKey) {
      this.titleKey = routeTitleKey as MessageKey;
    }

    this.loadRegions();
    this.subscribeToRouteParams();
    this.loadTypeMetadata();
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  isAslType(): boolean {
    return this.currentType?.code === 'ASL';
  }

  isEditMode(): boolean {
    return typeof this.formModel.id === 'number';
  }

  hasParentRequirement(): boolean {
    return !!this.currentType?.parentTypeCode;
  }

  startCreate(): void {
    if (this.isAslType()) {
      return;
    }

    const manageRouteBase = this.getManageRouteBase();
    if (this.selectedStructureId !== null && manageRouteBase) {
      void this.router.navigateByUrl(manageRouteBase);
      return;
    }

    this.resetForm();
  }

  edit(structure: StructureDto): void {
    if (typeof structure.id !== 'number') {
      return;
    }

    const manageRouteBase = this.getManageRouteBase();
    if (!manageRouteBase) {
      this.applyStructureToForm(structure);
      return;
    }

    void this.router.navigateByUrl(`${manageRouteBase}/${structure.id}`);
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
    if (this.isAslType()) {
      return;
    }

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

    if (this.isAslType() && !this.isEditMode()) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.formModel.structureType = this.currentType.code;
    const editMode = this.isEditMode();

    const request = editMode
      ? this.http.put<StructureDto>(`${environment.apiBaseUrl}/structures/${this.formModel.id}`, this.formModel)
      : this.http.post<StructureDto>(`${environment.apiBaseUrl}/structures`, this.formModel);

    request.subscribe({
      next: () => {
        this.successMessage = this.translate(
          editMode ? 'structures.message.updateSuccess' : 'structures.message.createSuccess'
        );
        this.saving = false;
        if (editMode) {
          const manageRouteBase = this.getManageRouteBase();
          if (manageRouteBase) {
            void this.router.navigateByUrl(manageRouteBase);
          } else {
            this.resetForm();
          }
        } else {
          this.resetForm();
        }
        this.loadStructures();
        this.loadParentOptions();
      },
      error: () => {
        this.errorMessage = this.translate(
          editMode ? 'structures.message.updateError' : 'structures.message.createError'
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
        this.loadParentOptions();
        this.loadStructures();
        this.applyRouteSelection();
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

  private subscribeToRouteParams(): void {
    this.routeParamSubscription?.unsubscribe();
    this.routeParamSubscription = this.route.paramMap.subscribe((paramMap) => {
      this.selectedStructureId = this.parseStructureId(paramMap);
      this.applyRouteSelection();
    });
  }

  private applyRouteSelection(): void {
    if (!this.currentType) {
      return;
    }

    if (this.selectedStructureId === null) {
      this.resetForm();
      return;
    }

    this.http.get<StructureDto>(`${environment.apiBaseUrl}/structures/${this.selectedStructureId}`).subscribe({
      next: (structure) => {
        this.applyStructureToForm(structure);
      },
      error: () => {
        this.errorMessage = this.translate('structures.message.loadError');
      }
    });
  }

  private parseStructureId(paramMap: ParamMap): number | null {
    const idParam = paramMap.get('id');
    if (!idParam) {
      return null;
    }

    const id = Number(idParam);
    return Number.isNaN(id) ? null : id;
  }

  private applyStructureToForm(structure: StructureDto): void {
    this.formModel = {
      ...structure,
      parentStructureId: structure.parentStructureId ?? null
    };
    this.loadProvinces();
    this.loadCities();
    this.errorMessage = '';
    this.successMessage = '';
  }

  private resetForm(): void {
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

  private getManageRouteBase(): string {
    const currentUrl = this.router.url.split('?')[0];
    if (this.selectedStructureId !== null && currentUrl.endsWith(`/${this.selectedStructureId}`)) {
      return currentUrl.slice(0, -(String(this.selectedStructureId).length + 1));
    }

    return currentUrl;
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
    this.geographyApi.getRegions().subscribe({
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
    this.geographyApi.getProvincesByRegion(this.formModel.regionId).subscribe({
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
    this.geographyApi.getCitiesByProvince(this.formModel.provinceId).subscribe({
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
