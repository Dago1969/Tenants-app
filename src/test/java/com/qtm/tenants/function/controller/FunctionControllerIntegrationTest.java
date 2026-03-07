package com.qtm.tenants.function.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtm.tenants.function.dto.FunctionDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test integrativo del controller funzioni con stack Spring reale.
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class FunctionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCreateAndLoadFunctionViaRestApi() throws Exception {
        FunctionDto payload = new FunctionDto();
        payload.setCode("FUNC-MENU");
        payload.setName("Menu funzioni");

        mockMvc.perform(post("/api/tenants/functions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("FUNC-MENU"))
                .andExpect(jsonPath("$.name").value("Menu funzioni"));

        mockMvc.perform(get("/api/tenants/functions/{code}", "FUNC-MENU"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("FUNC-MENU"))
                .andExpect(jsonPath("$.name").value("Menu funzioni"));
    }
}
