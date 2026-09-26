package com.qtm.external.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.qtm.commonlib.dto.ASLDto;
import com.qtm.commonlib.dto.ASLImportRequest;
import com.qtm.commonlib.dto.ASLOverviewDto;

@FeignClient(name = "qtmdb-asl-client", url = "${NG_APP_API_BASE_URL:http://localhost:8086/api}")
public interface AslClient {

	@GetMapping("/asl")
	List<ASLDto> findAll();

	@GetMapping("/asl/overview")
	List<ASLOverviewDto> findAllWithImportStatus(
			@RequestParam(name = "regionCode", required = false) String regionCode);

	@GetMapping("/asl/{id}")
	ASLDto findById(@PathVariable("id") Long id);

	@PostMapping("/asl/import")
	List<ASLDto> importFromSource(@RequestBody ASLImportRequest request);

	@PutMapping("/asl/{id}")
	ASLDto update(@PathVariable("id") Long id, @RequestBody ASLDto dto);

	@DeleteMapping("/asl/{id}")
	void deleteAssociation(@PathVariable("id") Long id);
}