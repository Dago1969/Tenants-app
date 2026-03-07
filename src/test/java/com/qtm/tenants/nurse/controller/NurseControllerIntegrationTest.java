package com.qtm.tenants.nurse.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtm.tenants.nurse.dto.NurseDto;
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
 * Test integrativo del controller infermieri con stack Spring reale.
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class NurseControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCreateAndLoadNurseViaRestApi() throws Exception {
        NurseDto payload = new NurseDto();
        payload.setNurseProjectId("QTM-NUR-IT-100");
        payload.setFullName("Giulia Bianchi");
        payload.setEmail("giulia.bianchi@qtm.local");
        payload.setPrimaryPhone("3338881234");
        payload.setCoverageArea("Milano Ovest");
        payload.setReferenceProvider("Provider Centro");
        payload.setProfessionalRegister("MI-12345");
        payload.setEnabled(Boolean.TRUE);

        MvcResult createResult = mockMvc.perform(post("/api/tenants/nurses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.fullName").value("Giulia Bianchi"))
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long createdId = createdJson.get("id").asLong();

        mockMvc.perform(get("/api/tenants/nurses/{id}", createdId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdId))
                .andExpect(jsonPath("$.nurseProjectId").value("QTM-NUR-IT-100"))
                .andExpect(jsonPath("$.referenceProvider").value("Provider Centro"));
    }

    @Test
    void shouldExposeNurseFieldPermissionsEndpoint() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/tenants/nurses/permissions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nurseProjectId").exists())
                .andExpect(jsonPath("$.fullName").exists())
                .andReturn();

        JsonNode permissions = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(permissions.get("nurseProjectId").asText()).isNotBlank();
        assertThat(permissions.get("professionalRegister").asText()).isNotBlank();
    }
}
