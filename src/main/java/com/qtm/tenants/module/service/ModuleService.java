package com.qtm.tenants.module.service;

import com.qtm.tenants.module.dto.ModuleDto;
import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.module.mapper.ModuleMapper;
import com.qtm.tenants.module.repository.ModuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD moduli.
 */
@Service
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final ModuleMapper moduleMapper;

    public ModuleService(ModuleRepository moduleRepository, ModuleMapper moduleMapper) {
        this.moduleRepository = moduleRepository;
        this.moduleMapper = moduleMapper;
    }

    @Transactional
    public ModuleDto create(ModuleDto moduleDto) {
        ModuleEntity saved = moduleRepository.save(moduleMapper.toEntity(moduleDto));
        return moduleMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ModuleDto> findAll() {
        return moduleRepository.findAll().stream().map(moduleMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ModuleDto findByCode(String code) {
        return moduleMapper.toDto(findEntityByCode(code));
    }

    @Transactional
    public ModuleDto update(String code, ModuleDto moduleDto) {
        ModuleEntity current = findEntityByCode(code);
        if (!code.equals(moduleDto.getCode())) {
            throw new ResponseStatusException(NOT_FOUND, "Il codice modulo non puo essere modificato");
        }
        current.setCode(moduleDto.getCode());
        current.setName(moduleDto.getName());
        return moduleMapper.toDto(moduleRepository.save(current));
    }

    @Transactional
    public void delete(String code) {
        moduleRepository.delete(findEntityByCode(code));
    }

    private ModuleEntity findEntityByCode(String code) {
        return moduleRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Modulo non trovato"));
    }
}
