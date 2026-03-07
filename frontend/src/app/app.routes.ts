import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { UsersCrudComponent } from './features/users/users-crud.component';
import { RolesCrudComponent } from './features/roles/roles-crud.component';
import { RolesSearchComponent } from './features/roles-search/roles-search.component';
import { ModulesCrudComponent } from './features/modules/modules-crud.component';
import { ModulesSearchComponent } from './features/modules-search/modules-search.component';
import { FunctionsCrudComponent } from './features/functions/functions-crud.component';
import { FunctionsSearchComponent } from './features/functions-search/functions-search.component';
import { PatientsCrudComponent } from './features/patients/patients-crud.component';
import { PatientsSearchComponent } from './features/patients-search/patients-search.component';
import { MedicsCrudComponent } from './features/medics/medics-crud.component';
import { NursesCrudComponent } from './features/nurses/nurses-crud.component';
import { NotAuthorizedComponent } from './features/not-authorized/not-authorized.component';
import { ForbiddenComponent } from './features/forbidden/forbidden.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UsersSearchComponent } from './features/users-search/users-search.component';
import { MedicsSearchComponent } from './features/medics-search/medics-search.component';
import { NursesSearchComponent } from './features/nurses-search/nurses-search.component';
import { AuthorizationsManagementComponent } from './features/authorizations/authorizations-management.component';
import { ControllerFunctionMappingsComponent } from './features/controller-function-mappings/controller-function-mappings.component';
import { StructureCatalogComponent } from './features/structure-catalog/structure-catalog.component';
import { moduleVisibilityGuard } from './core/module-visibility.guard';

/**
 * Routing applicativo tenants con protezione JWT e pagine CRUD.
 */
export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'users', component: UsersCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('USER')] },
  { path: 'users/search', component: UsersSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('USER')] },
  { path: 'medics/search', component: MedicsSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('MEDIC')] },
  { path: 'nurses/search', component: NursesSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('NURSE')] },
  { path: 'roles', component: RolesSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('ROLE')] },
  { path: 'roles/new', component: RolesCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('ROLE')] },
  { path: 'roles/:id', component: RolesCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('ROLE')] },
  { path: 'authorizations', component: AuthorizationsManagementComponent, canActivate: [authGuard] },
  { path: 'controller-function-mappings', component: ControllerFunctionMappingsComponent, canActivate: [authGuard] },
  { path: 'authorization-functions', loadComponent: () => import('./features/authorization-functions/authorization-functions-crud.component').then(m => m.AuthorizationFunctionsCrudComponent), canActivate: [authGuard] },
  { path: 'authorization-functions/search', loadComponent: () => import('./features/authorization-functions-search/authorization-functions-search.component').then(m => m.AuthorizationFunctionsSearchComponent), canActivate: [authGuard] },
  { path: 'modules', component: ModulesCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('MODULE')] },
  { path: 'modules/search', component: ModulesSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('MODULE')] },
  { path: 'functions', component: FunctionsCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('FUNCTION')] },
  { path: 'functions/search', component: FunctionsSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('FUNCTION')] },
  { path: 'structures', pathMatch: 'full', redirectTo: 'structures/asl' },
  { path: 'structures/asl', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'ASL', titleKey: 'structures.type.asl.title' } },
  { path: 'structures/hospitals', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'HOSPITAL', titleKey: 'structures.type.hospital.title' } },
  { path: 'structures/hospital-pharmacies', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'HOSPITAL_PHARMACY', titleKey: 'structures.type.hospitalPharmacy.title' } },
  { path: 'structures/retail-pharmacies', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'RETAIL_PHARMACY', titleKey: 'structures.type.retailPharmacy.title' } },
  { path: 'structures/logistics-warehouses', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'LOGISTICS_WAREHOUSE', titleKey: 'structures.type.logisticsWarehouse.title' } },
  { path: 'structures/material-warehouses', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'MATERIAL_WAREHOUSE', titleKey: 'structures.type.materialWarehouse.title' } },
  { path: 'structures/pharma-companies', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'PHARMA_COMPANY', titleKey: 'structures.type.pharmaCompany.title' } },
  { path: 'structures/specialist-clinics', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'SPECIALIST_CLINIC', titleKey: 'structures.type.specialistClinic.title' } },
  { path: 'structures/vendors', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'VENDOR', titleKey: 'structures.type.vendor.title' } },
  { path: 'patients', component: PatientsCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('PATIENT')] },
  { path: 'patients/search', component: PatientsSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('PATIENT')] },
  { path: 'medics', component: MedicsCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('MEDIC')] },
  { path: 'nurses', component: NursesCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('NURSE')] },
  { path: 'not-authorized', component: NotAuthorizedComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: '**', redirectTo: 'dashboard' }
];
