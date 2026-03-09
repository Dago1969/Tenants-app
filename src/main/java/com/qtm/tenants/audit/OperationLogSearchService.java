package com.qtm.tenants.audit;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service dedicato alla ricerca dei log operativi con filtri opzionali.
 */
@Service
@RequiredArgsConstructor
public class OperationLogSearchService {

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "occurredAt");
    private static final List<String> DEFAULT_VISIBLE_OPERATIONS = List.of("INSERT", "UPDATE", "DELETE");

    private final OperationLogRepository operationLogRepository;
    private final OperationLogMapper operationLogMapper;

    @Transactional(readOnly = true)
    public List<OperationLogDto> search(
            String moduleCode,
            String functionCode,
            String operation,
            String username,
            String roleId,
            String targetId,
            String description
    ) {
        return operationLogRepository.findAll(buildSpecification(
                moduleCode,
                functionCode,
                operation,
                username,
                roleId,
                targetId,
                description
        ), DEFAULT_SORT).stream()
                .map(operationLogMapper::toDto)
                .toList();
    }

    private Specification<OperationLogEntity> buildSpecification(
            String moduleCode,
            String functionCode,
            String operation,
            String username,
            String roleId,
            String targetId,
            String description
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            addLikePredicate(predicates, criteriaBuilder, root.get("moduleCode"), moduleCode);
            addLikePredicate(predicates, criteriaBuilder, root.get("functionCode"), functionCode);
            addOperationPredicate(predicates, criteriaBuilder, root.get("operation"), operation);
            addLikePredicate(predicates, criteriaBuilder, root.get("username"), username);
            addLikePredicate(predicates, criteriaBuilder, root.get("roleId"), roleId);
            addLikePredicate(predicates, criteriaBuilder, root.get("targetId"), targetId);
            addLikePredicate(predicates, criteriaBuilder, root.get("description"), description);
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void addOperationPredicate(
            List<Predicate> predicates,
            CriteriaBuilder criteriaBuilder,
            Path<String> path,
            String value
    ) {
        if (value == null || value.isBlank()) {
            predicates.add(criteriaBuilder.upper(path).in(DEFAULT_VISIBLE_OPERATIONS));
            return;
        }

        List<String> requestedOperations = Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(candidate -> !candidate.isBlank())
                .map(String::toUpperCase)
                .toList();

        if (requestedOperations.isEmpty()) {
            predicates.add(criteriaBuilder.upper(path).in(DEFAULT_VISIBLE_OPERATIONS));
            return;
        }

        predicates.add(criteriaBuilder.upper(path).in(requestedOperations));
    }

    private void addLikePredicate(
            List<Predicate> predicates,
            CriteriaBuilder criteriaBuilder,
            Path<String> path,
            String value
    ) {
        if (value == null || value.isBlank()) {
            return;
        }

        predicates.add(criteriaBuilder.like(
                criteriaBuilder.upper(path),
                "%" + value.trim().toUpperCase() + "%"
        ));
    }
}