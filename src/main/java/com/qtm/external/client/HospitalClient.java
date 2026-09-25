package com.qtm.external.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.qtm.commonlib.dto.HospitalDto;

@FeignClient(name = "qtmdb-hospital-client", url = "${NG_APP_API_BASE_URL:http://localhost:8086/api}")
public interface HospitalClient {

    @GetMapping("/hospital/{id}")
    HospitalDto getHospitalById(@PathVariable("id") Long id);
}