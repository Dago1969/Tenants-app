package com.qtm.tenants.function.service;

import com.qtm.tenants.function.dto.FunctionDto;
import com.qtm.tenants.function.entity.FunctionEntity;
import com.qtm.tenants.function.mapper.FunctionMapper;
import com.qtm.tenants.function.repository.FunctionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD funzioni.
 */
@Service
@RequiredArgsConstructor
public class FunctionService {

    private final FunctionRepository functionRepository;
    private final FunctionMapper functionMapper;

    @Transactional
    public FunctionDto create(FunctionDto functionDto) {
        FunctionEntity saved = functionRepository.save(functionMapper.toEntity(functionDto));
        return functionMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<FunctionDto> findAll() {
        return functionRepository.findAll().stream().map(functionMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public FunctionDto findByCode(String code) {
        return functionMapper.toDto(findEntityByCode(code));
    }

    @Transactional
    public FunctionDto update(String code, FunctionDto functionDto) {
        FunctionEntity current = findEntityByCode(code);
        if (!code.equals(functionDto.getCode())) {
            throw new ResponseStatusException(NOT_FOUND, "Il codice funzione non puo essere modificato");
        }
        current.setCode(functionDto.getCode());
        current.setName(functionDto.getName());
        return functionMapper.toDto(functionRepository.save(current));
    }

    @Transactional
    public void delete(String code) {
        functionRepository.delete(findEntityByCode(code));
    }

    private FunctionEntity findEntityByCode(String code) {
        return functionRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Funzione non trovata"));
    }
}
