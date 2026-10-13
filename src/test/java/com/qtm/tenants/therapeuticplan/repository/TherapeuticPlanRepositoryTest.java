package com.qtm.tenants.therapeuticplan.repository;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.auto_quote_keyword=true"
})
class TherapeuticPlanRepositoryTest {

    @Autowired
    private TherapeuticPlanRepository repository;

    static Stream<Long> patientIds() {
        return Stream.of(1L, 2L, 999L, null);
    }

    @ParameterizedTest
    @MethodSource("patientIds")
    void shouldFilterByExactPatientIdAndKeepExistingFilters(Long patientId) {
        TherapeuticPlanEntity first = repository.save(plan(1L, "PILOTA", "active"));
        TherapeuticPlanEntity second = repository.save(plan(2L, "PILOTA", "active"));
        repository.save(plan(1L, "ALTRO", "active"));
        repository.save(plan(1L, "PILOTA", "completed"));

        List<Long> expectedIds = patientId == null ? List.of(second.getId(), first.getId())
                : patientId.equals(1L) ? List.of(first.getId())
                : patientId.equals(2L) ? List.of(second.getId())
                : List.of();

        assertThat(repository.searchByFilters("PILOTA", "active", "DRUG", patientId))
                .extracting(TherapeuticPlanEntity::getId)
                .containsExactlyElementsOf(expectedIds);
    }

    private TherapeuticPlanEntity plan(Long patientId, String projectCode, String status) {
        return TherapeuticPlanEntity.builder()
                .patientId(patientId)
                .projectCode(projectCode)
                .status(status)
                .drugCode("DRUG")
                .startDate(LocalDate.of(2026, 10, 13))
                .build();
    }
}
