package com.qtm.tenants;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtm.commonlib.dto.DoctorDto;
import com.qtm.commonlib.dto.PatientDto;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanActivityBookingDto;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanContactRequestDto;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanDto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class HospitalIdJsonContractTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void doctorDtoUsesHospitalIdAndAcceptsLegacyStructureId() throws Exception {
        assertHospitalIdContract(DoctorDto.class);
    }

    @Test
    void patientDtoUsesHospitalIdAndAcceptsLegacyStructureId() throws Exception {
        assertHospitalIdContract(PatientDto.class);
    }

    @Test
    void therapeuticPlanDtoUsesHospitalIdAndAcceptsLegacyStructureId() throws Exception {
        assertHospitalIdContract(TherapeuticPlanDto.class);
    }

    @Test
    void therapeuticPlanRelatedDtosUseHospitalIdAndAcceptLegacyStructureId() throws Exception {
        assertHospitalIdContract(TherapeuticPlanActivityBookingDto.class);
        assertHospitalIdContract(TherapeuticPlanContactRequestDto.class);
    }

    private <T> void assertHospitalIdContract(Class<T> dtoType) throws Exception {
        for (String inputField : new String[] {"hospitalId", "structureId"}) {
            T dto = objectMapper.readValue("{\"" + inputField + "\":191}", dtoType);
            JsonNode response = objectMapper.valueToTree(dto);

            assertEquals(191L, response.path("hospitalId").asLong());
            assertFalse(response.has("structureId"));
        }
    }
}