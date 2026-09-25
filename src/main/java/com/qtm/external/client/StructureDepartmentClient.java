package com.qtm.external.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.qtm.commonlib.dto.DepartmentDto;

@FeignClient(name = "qtmdb-department-client", url = "${NG_APP_API_BASE_URL:http://localhost:8086/api}")
public interface StructureDepartmentClient {

    @GetMapping("/structure-departments/{id}")
    DepartmentDto getDepartmentById(@PathVariable("id") Long id);
}