package com.qtm.tenants.structure.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

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
        private com.qtm.tenants.structure.client.StructureRemoteClient structureRemoteClient;

    @Test
    void shouldAssociateAndDeactivateExternalStructure() throws Exception {
        // remote client returns empty initially
        org.mockito.Mockito.when(structureRemoteClient.fetchAsl()).thenReturn(java.util.List.of());

        // initially empty
        mockMvc.perform(get("/api/tenants/structures")
                        .param("structureType", "ASL")
                        .param("active", "true")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").doesNotExist());

        // associate external ASL
        String payload = "{" +
                "\"externalSource\":\"QTMTicket\"," +
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

        // now GET should return one active ASL
        // instruct remote client to return the ASL details for externalId 201
        com.qtm.tenants.structure.dto.StructureDto remoteDto = new com.qtm.tenants.structure.dto.StructureDto();
        remoteDto.setExternalId(201L);
        remoteDto.setExternalSource("QTMTicket");
        remoteDto.setStructureType("ASL");
        remoteDto.setName("ASL TEST 201");
        remoteDto.setCode("QTMTicket-201");
        org.mockito.Mockito.when(structureRemoteClient.fetchAsl()).thenReturn(java.util.List.of(remoteDto));

        String listResponse = mockMvc.perform(get("/api/tenants/structures")
                        .param("structureType", "ASL")
                        .param("active", "true")
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var arr = objectMapper.readTree(listResponse);
        assertThat(arr.isArray()).isTrue();
        assertThat(arr.size()).isEqualTo(1);
        assertThat(arr.get(0).get("externalId").asLong()).isEqualTo(201L);

        // deactivate
        mockMvc.perform(post("/api/tenants/structures/" + createdId + "/deactivate"))
                .andExpect(status().isNoContent());

        // GET active should be empty again
        mockMvc.perform(get("/api/tenants/structures")
                        .param("structureType", "ASL")
                        .param("active", "true")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").doesNotExist());
    }
}
