package com.qtm.tenants.structure.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import com.qtm.external.client.HealthStructureClient;
import com.qtm.external.client.StructureClient;
import com.qtm.tenants.structure.dto.StructureDto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MYSQL;NON_KEYWORDS=AUTHORIZATION",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc(addFilters = false)
@Transactional
public class StructureAssociationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

        @org.springframework.boot.test.mock.mockito.MockBean
        private com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

        @org.springframework.boot.test.mock.mockito.MockBean
        private StructureClient structureClient;

        @org.springframework.boot.test.mock.mockito.MockBean
        private HealthStructureClient healthStructureClient;

    @Test
    void shouldAssociateAndDeactivateExternalStructure() throws Exception {
        org.mockito.Mockito.when(healthStructureClient.findAsl()).thenReturn(java.util.List.of());

        // initially empty
        mockMvc.perform(get("/api/tenants/structures")
                        .param("structureType", "ASL")
                        .param("active", "true")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").doesNotExist());

        StructureDto associatedStructure = new StructureDto();
        associatedStructure.setId(201L);
        associatedStructure.setExternalId(201L);
        associatedStructure.setExternalSource("HEALTH_STRUCTURE");
        associatedStructure.setStructureType("ASL");
        associatedStructure.setName("ASL TEST 201");
        org.mockito.Mockito.when(structureClient.associate(
                org.mockito.ArgumentMatchers.anyMap(),
                org.mockito.ArgumentMatchers.nullable(String.class)))
                .thenReturn(associatedStructure);

        // L'associazione viene inoltrata a Dashboard, mentre il catalogo resta di Health Structure.
        String payload = "{" +
                "\"externalSource\":\"HEALTH_STRUCTURE\"," +
                "\"externalId\":201," +
                "\"structureType\":\"ASL\"," +
                "\"name\":\"ASL TEST 201\"" +
                "}";

        String response = mockMvc.perform(post("/api/tenants/structures/associate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.externalId").value(201))
                .andReturn()
                .getResponse()
                .getContentAsString();

        var node = objectMapper.readTree(response);
        Long createdId = node.get("id").asLong();
        assertThat(createdId).isNotNull();

        String listResponse = mockMvc.perform(get("/api/tenants/structures")
                        .param("structureType", "ASL")
                        .param("active", "true")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").doesNotExist())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var arr = objectMapper.readTree(listResponse);
        assertThat(arr.isArray()).isTrue();
        assertThat(arr.size()).isZero();

        // deactivate
        mockMvc.perform(post("/api/tenants/structures/" + createdId + "/deactivate"))
                .andExpect(status().isNoContent());
        org.mockito.Mockito.verify(structureClient).associate(
                org.mockito.ArgumentMatchers.anyMap(),
                org.mockito.ArgumentMatchers.nullable(String.class));
        org.mockito.Mockito.verify(structureClient).deactivate(201L, null);

        // GET active should be empty again
        mockMvc.perform(get("/api/tenants/structures")
                        .param("structureType", "ASL")
                        .param("active", "true")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").doesNotExist());
    }
}
