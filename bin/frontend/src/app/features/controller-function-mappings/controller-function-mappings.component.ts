import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { MessageKey, t } from '../../i18n/messages';

interface FunctionOptionDto {
  code: string;
  name: string;
}

interface ControllerMethodFunctionDto {
  id: number | null;
  moduleCode: string;
  methodName: string;
  functionCode: string;
  functionName: string;
  commonFunction: boolean;
}

interface ControllerMethodFunctionModuleDto {
  moduleCode: string;
  moduleName: string;
  commonMethods: ControllerMethodFunctionDto[];
  customMethods: ControllerMethodFunctionDto[];
}

@Component({
  selector: 'app-controller-function-mappings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './controller-function-mappings.component.html',
  styleUrl: './controller-function-mappings.component.css'
})
export class ControllerFunctionMappingsComponent implements OnInit {
  modules: ControllerMethodFunctionModuleDto[] = [];
  functionOptions: FunctionOptionDto[] = [];
  loading = false;
  savingModuleCode = '';
  errorMessage = '';
  successMessage = '';

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadPageData();
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  hasAnyMethods(module: ControllerMethodFunctionModuleDto): boolean {
    return this.getAllMethods(module).length > 0;
  }

  getAllMethods(module: ControllerMethodFunctionModuleDto): ControllerMethodFunctionDto[] {
    return [...(module.commonMethods ?? []), ...(module.customMethods ?? [])];
  }

  saveModule(module: ControllerMethodFunctionModuleDto): void {
    if (this.savingModuleCode) {
      return;
    }

    this.savingModuleCode = module.moduleCode;
    this.errorMessage = '';
    this.successMessage = '';

    this.http
      .put<ControllerMethodFunctionModuleDto>(
        `${environment.apiBaseUrl}/controller-function-mappings/modules/${module.moduleCode}`,
        { methods: this.getAllMethods(module) }
      )
      .subscribe({
        next: (updatedModule) => {
          this.modules = this.modules.map((currentModule) =>
            currentModule.moduleCode === updatedModule.moduleCode ? updatedModule : currentModule
          );
          this.successMessage = `${this.translate('controllerFunctionMappings.success.save')} ${module.moduleCode}`;
          this.savingModuleCode = '';
        },
        error: () => {
          this.errorMessage = `${this.translate('controllerFunctionMappings.error.save')} ${module.moduleCode}`;
          this.savingModuleCode = '';
        }
      });
  }

  isSavingModule(moduleCode: string): boolean {
    return this.savingModuleCode === moduleCode;
  }

  resolveFunctionLabel(functionCode: string): string {
    const option = this.functionOptions.find((currentOption) => currentOption.code === functionCode);
    return option ? `${option.code} - ${option.name}` : functionCode;
  }

  trackByMethod(_: number, method: ControllerMethodFunctionDto): string {
    return `${method.moduleCode}:${method.methodName}`;
  }

  private loadPageData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.get<FunctionOptionDto[]>(`${environment.apiBaseUrl}/functions`).subscribe({
      next: (functions) => {
        this.functionOptions = [...(functions ?? [])].sort((left, right) => left.code.localeCompare(right.code));
        this.loadModules();
      },
      error: () => {
        this.functionOptions = [];
        this.loadModules();
      }
    });
  }

  private loadModules(): void {
    this.http.get<ControllerMethodFunctionModuleDto[]>(`${environment.apiBaseUrl}/controller-function-mappings`).subscribe({
      next: (modules) => {
        this.modules = modules ?? [];
        this.loading = false;
      },
      error: () => {
        this.modules = [];
        this.loading = false;
        this.errorMessage = this.translate('controllerFunctionMappings.error.load');
      }
    });
  }
}
