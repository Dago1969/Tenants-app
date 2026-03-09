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
import { StructureSearchComponent } from './features/structure-search/structure-search.component';
import { StructureTypesSearchComponent } from './features/structure-types-search/structure-types-search.component';
import { StructureTypesCrudComponent } from './features/structure-types-crud/structure-types-crud.component';
import { OperationLogsSearchComponent } from './features/operation-logs-search/operation-logs-search.component';
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
  { path: 'operation-logs/search', component: OperationLogsSearchComponent, canActivate: [authGuard] },
  { path: 'authorization-functions', loadComponent: () => import('./features/authorization-functions/authorization-functions-crud.component').then(m => m.AuthorizationFunctionsCrudComponent), canActivate: [authGuard] },
  { path: 'authorization-functions/search', loadComponent: () => import('./features/authorization-functions-search/authorization-functions-search.component').then(m => m.AuthorizationFunctionsSearchComponent), canActivate: [authGuard] },
  { path: 'modules', component: ModulesCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('MODULE')] },
  { path: 'modules/search', component: ModulesSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('MODULE')] },
  { path: 'functions', component: FunctionsCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('FUNCTION')] },
  { path: 'functions/search', component: FunctionsSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('FUNCTION')] },
  { path: 'structure-types/search', component: StructureTypesSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')] },
  { path: 'structure-types/manage', component: StructureTypesCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')] },
  { path: 'structure-types/manage/:code', component: StructureTypesCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')] },
  { path: 'structures', pathMatch: 'full', redirectTo: 'structures/asl' },
  { path: 'structures/asl', component: StructureSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'ASL', titleKey: 'structures.type.asl.search.title', manageRoute: '/structures/asl/manage' } },
  { path: 'structures/asl/manage', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'ASL', titleKey: 'structures.type.asl.title' } },
  { path: 'structures/asl/manage/:id', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'ASL', titleKey: 'structures.type.asl.title' } },
  { path: 'structures/hospitals', component: StructureSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'HOSPITAL', titleKey: 'structures.type.hospital.search.title', manageRoute: '/structures/hospitals/manage' } },
  { path: 'structures/hospitals/manage', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'HOSPITAL', titleKey: 'structures.type.hospital.title' } },
  { path: 'structures/hospitals/manage/:id', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'HOSPITAL', titleKey: 'structures.type.hospital.title' } },
  { path: 'structures/hospital-pharmacies', component: StructureSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'HOSPITAL_PHARMACY', titleKey: 'structures.type.hospitalPharmacy.search.title', manageRoute: '/structures/hospital-pharmacies/manage' } },
  { path: 'structures/hospital-pharmacies/manage', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'HOSPITAL_PHARMACY', titleKey: 'structures.type.hospitalPharmacy.title' } },
  { path: 'structures/hospital-pharmacies/manage/:id', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'HOSPITAL_PHARMACY', titleKey: 'structures.type.hospitalPharmacy.title' } },
  { path: 'structures/retail-pharmacies', component: StructureSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'RETAIL_PHARMACY', titleKey: 'structures.type.retailPharmacy.search.title', manageRoute: '/structures/retail-pharmacies/manage' } },
  { path: 'structures/retail-pharmacies/manage', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'RETAIL_PHARMACY', titleKey: 'structures.type.retailPharmacy.title' } },
  { path: 'structures/retail-pharmacies/manage/:id', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'RETAIL_PHARMACY', titleKey: 'structures.type.retailPharmacy.title' } },
  { path: 'structures/logistics-warehouses', component: StructureSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'LOGISTICS_WAREHOUSE', titleKey: 'structures.type.logisticsWarehouse.search.title', manageRoute: '/structures/logistics-warehouses/manage' } },
  { path: 'structures/logistics-warehouses/manage', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'LOGISTICS_WAREHOUSE', titleKey: 'structures.type.logisticsWarehouse.title' } },
  { path: 'structures/logistics-warehouses/manage/:id', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'LOGISTICS_WAREHOUSE', titleKey: 'structures.type.logisticsWarehouse.title' } },
  { path: 'structures/material-warehouses', component: StructureSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'MATERIAL_WAREHOUSE', titleKey: 'structures.type.materialWarehouse.search.title', manageRoute: '/structures/material-warehouses/manage' } },
  { path: 'structures/material-warehouses/manage', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'MATERIAL_WAREHOUSE', titleKey: 'structures.type.materialWarehouse.title' } },
  { path: 'structures/material-warehouses/manage/:id', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'MATERIAL_WAREHOUSE', titleKey: 'structures.type.materialWarehouse.title' } },
  { path: 'structures/pharma-companies', component: StructureSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'PHARMA_COMPANY', titleKey: 'structures.type.pharmaCompany.search.title', manageRoute: '/structures/pharma-companies/manage' } },
  { path: 'structures/pharma-companies/manage', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'PHARMA_COMPANY', titleKey: 'structures.type.pharmaCompany.title' } },
  { path: 'structures/pharma-companies/manage/:id', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'PHARMA_COMPANY', titleKey: 'structures.type.pharmaCompany.title' } },
  { path: 'structures/specialist-clinics', component: StructureSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'SPECIALIST_CLINIC', titleKey: 'structures.type.specialistClinic.search.title', manageRoute: '/structures/specialist-clinics/manage' } },
  { path: 'structures/specialist-clinics/manage', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'SPECIALIST_CLINIC', titleKey: 'structures.type.specialistClinic.title' } },
  { path: 'structures/specialist-clinics/manage/:id', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'SPECIALIST_CLINIC', titleKey: 'structures.type.specialistClinic.title' } },
  { path: 'structures/vendors', component: StructureSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'VENDOR', titleKey: 'structures.type.vendor.search.title', manageRoute: '/structures/vendors/manage' } },
  { path: 'structures/vendors/manage', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'VENDOR', titleKey: 'structures.type.vendor.title' } },
  { path: 'structures/vendors/manage/:id', component: StructureCatalogComponent, canActivate: [authGuard, moduleVisibilityGuard('STRUCTURE')], data: { structureType: 'VENDOR', titleKey: 'structures.type.vendor.title' } },
  { path: 'patients', component: PatientsCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('PATIENT')] },
  { path: 'patients/search', component: PatientsSearchComponent, canActivate: [authGuard, moduleVisibilityGuard('PATIENT')] },
  { path: 'medics', component: MedicsCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('MEDIC')] },
  { path: 'nurses', component: NursesCrudComponent, canActivate: [authGuard, moduleVisibilityGuard('NURSE')] },
  { path: 'not-authorized', component: NotAuthorizedComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: '**', redirectTo: 'dashboard' }
];
