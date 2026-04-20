package com.qtm.tenants.therapeuticplan.service;

import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanVisitDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitId;
import com.qtm.tenants.therapeuticplan.mapper.TherapeuticPlanVisitMapper;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanVisitRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TherapeuticPlanVisitService {

    private final TherapeuticPlanVisitRepository repository;
    private final TherapeuticPlanVisitMapper mapper;
    private final TherapeuticPlanRepository therapeuticPlanRepository;
    private final ObjectMapper objectMapper;

    public TherapeuticPlanVisitService(TherapeuticPlanVisitRepository repository, TherapeuticPlanVisitMapper mapper, TherapeuticPlanRepository therapeuticPlanRepository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.mapper = mapper;
        this.therapeuticPlanRepository = therapeuticPlanRepository;
        this.objectMapper = objectMapper;
    }

    public TherapeuticPlanVisitDto save(TherapeuticPlanVisitDto dto) {
        TherapeuticPlanVisitEntity entity = mapper.toEntity(dto);

        // Merge template JSON from therapeutic_plan.json_visit (if present) with DTO values
        try {
            ObjectNode baseNode = objectMapper.createObjectNode();
            if (dto.getTherapeuticPlanId() != null) {
                therapeuticPlanRepository.findById(dto.getTherapeuticPlanId()).ifPresent((TherapeuticPlanEntity plan) -> {
                    String planJson = plan.getJsonVisit();
                    if (planJson != null && !planJson.isBlank()) {
                        try {
                            ObjectNode parsed = (ObjectNode) objectMapper.readTree(planJson);
                            baseNode.setAll(parsed);
                        } catch (Exception ignored) {
                        }
                    }
                });
            }

            // convert DTO to ObjectNode and merge/overwrite baseNode
            ObjectNode dtoNode = objectMapper.valueToTree(dto);
            if (dto.getJsonVisit() != null && !dto.getJsonVisit().isBlank()) {
                try {
                    ObjectNode generatedVisitNode = (ObjectNode) objectMapper.readTree(dto.getJsonVisit());
                    baseNode.setAll(generatedVisitNode);
                } catch (Exception ignored) {
                }
            }

            dtoNode.remove("jsonVisit");
            // Remove null fields from dtoNode to avoid overwriting base with nulls
            dtoNode.fieldNames().forEachRemaining(field -> {
                if (dtoNode.get(field).isNull()) dtoNode.remove(field);
            });
            baseNode.setAll(dtoNode);
            String mergedJson = objectMapper.writeValueAsString(baseNode);
            entity.setJsonVisit(mergedJson);
        } catch (Exception e) {
            // fallback: ignore merge, leave entity.jsonVisit as whatever DTO provided
            entity.setJsonVisit(dto.getJsonVisit());
        }

        TherapeuticPlanVisitEntity saved = repository.save(entity);
        return mapper.toDto(saved);
    }

    public Optional<TherapeuticPlanVisitDto> findById(Long therapeuticPlanId, LocalDate date) {
        TherapeuticPlanVisitId id = new TherapeuticPlanVisitId(therapeuticPlanId, date);
        return repository.findById(id).map(mapper::toDto);
    }

    public List<TherapeuticPlanVisitDto> findByTherapeuticPlanId(Long therapeuticPlanId) {
        return repository.findByTherapeuticPlanId(therapeuticPlanId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public void delete(Long therapeuticPlanId, LocalDate date) {
        TherapeuticPlanVisitId id = new TherapeuticPlanVisitId(therapeuticPlanId, date);
        repository.deleteById(id);
    }
}
