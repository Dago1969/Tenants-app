package com.qtm.tenants.medic.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtm.tenants.medic.dto.MedicDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test integrativo del controller medici con stack Spring reale (controller/service/repository).
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class MedicControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCreateAndLoadMedicViaRestApi() throws Exception {
        MedicDto payload = new MedicDto();
        payload.setDoctorFlyerId("DOC-IT-100");
        payload.setFullName("Lucia Verdi");
        payload.setEmail("lucia.verdi@qtm.local");
        payload.setPrimaryPhone("3331234567");
        payload.setStructureId(5L);
        payload.setSpecialization("Neurologia");
        payload.setDataProcessingConsent(Boolean.TRUE);

        MvcResult createResult = mockMvc.perform(post("/api/tenants/medics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.fullName").value("Lucia Verdi"))
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long createdId = createdJson.get("id").asLong();

        mockMvc.perform(get("/api/tenants/medics/{id}", createdId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdId))
                .andExpect(jsonPath("$.doctorFlyerId").value("DOC-IT-100"))
                .andExpect(jsonPath("$.specialization").value("Neurologia"));
    }

    @Test
    void shouldExposeMedicFieldPermissionsEndpoint() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/tenants/medics/permissions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doctorFlyerId").exists())
                .andExpect(jsonPath("$.fullName").exists())
                .andReturn();

        JsonNode permissions = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(permissions.get("doctorFlyerId").asText()).isNotBlank();
        assertThat(permissions.get("dataProcessingConsentRevocationLog").asText()).isNotBlank();
    }
}
