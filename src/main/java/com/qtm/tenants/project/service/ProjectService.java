package com.qtm.tenants.project.service;

import com.qtm.commonlib.dto.ProjectDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service orchestratore CRUD progetti tramite repository remoto QTMDashboard.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final DashboardProjectClient dashboardProjectClient;

    @Transactional
    public ProjectDto create(ProjectDto projectDto) {
        log.info("[ProjectService] Creating project through remote repository: code={}, tenant={}, tenantId={}",
                projectDto.getCode(), projectDto.getTenant(), projectDto.getTenantId());
        return dashboardProjectClient.create(projectDto);
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> findAll(String code, String tenant) {
        log.info("[ProjectService] Finding projects through remote repository: code={}, tenant={}", code, tenant);
        return dashboardProjectClient.findAll(code, tenant);
    }

    @Transactional(readOnly = true)
    public ProjectDto findById(Long id) {
        log.info("[ProjectService] Finding project by id through remote repository: id={}", id);
        return dashboardProjectClient.findById(id);
    }

    @Transactional
    public ProjectDto update(Long id, ProjectDto projectDto) {
        log.info("[ProjectService] Updating project through remote repository: id={}, code={}, tenant={}, tenantId={}",
                id, projectDto.getCode(), projectDto.getTenant(), projectDto.getTenantId());
        return dashboardProjectClient.update(id, projectDto);
    }

    @Transactional
    public void delete(Long id) {
        log.info("[ProjectService] Deleting project through remote repository: id={}", id);
        dashboardProjectClient.delete(id);
    }
}