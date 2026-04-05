package com.qtm.tenants.structure.service;

import com.qtm.tenants.structure.dto.StructureBulkImportResultDto;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.structure.repository.StructureRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;

/**
 * Service di import massivo delle strutture da file CSV/XLS/XLSX con validazione del formato e dei riferimenti parent.
 */
@Service
@RequiredArgsConstructor
public class StructureBulkImportService {

    private static final Set<String> SUPPORTED_EXTENSIONS = Set.of("csv", "xls", "xlsx");
    private static final Pattern CAMEL_CASE_PATTERN = Pattern.compile("([a-z0-9])([A-Z])");
    private static final String[] REQUIRED_HEADERS = {"code", "name", "address", "structure_type"};

    private final StructureService structureService;
    private final StructureRepository structureRepository;
    private final StructureTypeRegistry structureTypeRegistry;

    @Transactional
    public StructureBulkImportResultDto importStructures(MultipartFile file) {
        validateFilePresence(file);
        List<StructureImportRow> rows = parseRows(file);
        if (rows.size() < 4) {
            throw new ResponseStatusException(BAD_REQUEST, "L'import massivo richiede almeno 4 strutture nel file");
        }

        validateRowCodes(rows);

        Map<String, StructureImportRow> pendingRows = rows.stream()
                .collect(Collectors.toMap(
                        row -> normalizeKey(row.code()),
                        row -> row,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, StructureDto> createdStructuresByCode = new LinkedHashMap<>();
        List<String> importedCodes = new ArrayList<>();

        while (!pendingRows.isEmpty()) {
            boolean progress = false;
            Iterator<Map.Entry<String, StructureImportRow>> iterator = pendingRows.entrySet().iterator();
            while (iterator.hasNext()) {
                StructureImportRow row = iterator.next().getValue();
                Long parentStructureId = resolveParentStructureId(row.parentCode(), createdStructuresByCode);
                if (row.parentCode() != null && !row.parentCode().isBlank() && parentStructureId == null) {
                    continue;
                }

                StructureDto created = structureService.create(toStructureDto(row, parentStructureId));
                createdStructuresByCode.put(normalizeKey(created.getCode()), created);
                importedCodes.add(created.getCode());
                iterator.remove();
                progress = true;
            }

            if (!progress) {
                throw new ResponseStatusException(
                        BAD_REQUEST,
                        "Impossibile risolvere i parentCode delle strutture importate: " + pendingRows.values().stream()
                                .map(row -> row.code() + (row.parentCode() == null || row.parentCode().isBlank() ? "" : " -> " + row.parentCode()))
                                .toList()
                );
            }
        }

        return new StructureBulkImportResultDto(
                rows.size(),
                importedCodes.size(),
                importedCodes,
                "Import massivo completato con successo"
        );
    }

    private void validateFilePresence(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Seleziona un file CSV o Excel da importare");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Nome file non disponibile");
        }

        String extension = getExtension(filename);
        if (!SUPPORTED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(BAD_REQUEST, "Formato file non supportato. Usa CSV, XLS o XLSX");
        }
    }

    private List<StructureImportRow> parseRows(MultipartFile file) {
        String filename = file.getOriginalFilename();
        String extension = getExtension(filename == null ? "" : filename);
        try {
            return switch (extension) {
                case "csv" -> parseCsv(file);
                case "xls", "xlsx" -> parseSpreadsheet(file);
                default -> throw new ResponseStatusException(BAD_REQUEST, "Formato file non supportato. Usa CSV, XLS o XLSX");
            };
        } catch (IOException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "Impossibile leggere il file caricato");
        }
    }

    private List<StructureImportRow> parseCsv(MultipartFile file) throws IOException {
        byte[] content = file.getBytes();
        char delimiter = detectCsvDelimiter(content);
        try (Reader reader = new InputStreamReader(new ByteArrayInputStream(content), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreEmptyLines(true)
                     .setTrim(true)
                     .setDelimiter(delimiter)
                     .build()
                     .parse(reader)) {

            validateHeaders(parser.getHeaderMap().keySet().stream().map(this::normalizeKey).collect(Collectors.toSet()));

            List<StructureImportRow> rows = new ArrayList<>();
            for (CSVRecord record : parser) {
                if (record == null || record.toMap().values().stream().allMatch(value -> value == null || value.isBlank())) {
                    continue;
                }
                rows.add(parseRow(record.toMap(), (int) record.getRecordNumber() + 1));
            }
            return rows;
        }
    }

    private List<StructureImportRow> parseSpreadsheet(MultipartFile file) throws IOException {
        byte[] content = file.getBytes();
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(content))) {
            if (workbook.getNumberOfSheets() == 0) {
                return List.of();
            }

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                return List.of();
            }

            DataFormatter formatter = new DataFormatter(Locale.ITALY);
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            Map<String, Integer> headerIndexes = extractHeaderIndexes(headerRow, formatter, evaluator);
            validateHeaders(headerIndexes.keySet());

            List<StructureImportRow> rows = new ArrayList<>();
            for (int rowIndex = headerRow.getRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row, formatter, evaluator)) {
                    continue;
                }
                rows.add(parseRow(readRowValues(row, headerIndexes, formatter, evaluator), rowIndex + 1));
            }
            return rows;
        }
    }

    private Map<String, Integer> extractHeaderIndexes(Row headerRow, DataFormatter formatter, FormulaEvaluator evaluator) {
        if (headerRow == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Il file deve contenere una riga di intestazione");
        }

        Map<String, Integer> headerIndexes = new LinkedHashMap<>();
        short lastCellNum = headerRow.getLastCellNum();
        for (int columnIndex = 0; columnIndex < lastCellNum; columnIndex++) {
            Cell cell = headerRow.getCell(columnIndex);
            if (cell == null) {
                continue;
            }
            String headerName = normalizeKey(formatter.formatCellValue(cell, evaluator));
            if (!headerName.isBlank()) {
                headerIndexes.put(headerName, columnIndex);
            }
        }
        return headerIndexes;
    }

    private Map<String, String> readRowValues(Row row, Map<String, Integer> headerIndexes, DataFormatter formatter, FormulaEvaluator evaluator) {
        Map<String, String> values = new HashMap<>();
        for (Map.Entry<String, Integer> entry : headerIndexes.entrySet()) {
            Cell cell = row.getCell(entry.getValue(), Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String value = cell == null ? "" : formatter.formatCellValue(cell, evaluator);
            values.put(entry.getKey(), value == null ? "" : value.trim());
        }
        return values;
    }

    private boolean isBlankRow(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        short firstCellNum = row.getFirstCellNum();
        short lastCellNum = row.getLastCellNum();
        if (firstCellNum < 0 || lastCellNum < 0) {
            return true;
        }

        for (int columnIndex = firstCellNum; columnIndex < lastCellNum; columnIndex++) {
            Cell cell = row.getCell(columnIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (cell != null && !formatter.formatCellValue(cell, evaluator).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private StructureImportRow parseRow(Map<String, String> rawValues, int rowNumber) {
        Map<String, String> normalizedValues = rawValues.entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> normalizeKey(entry.getKey()),
                        entry -> entry.getValue() == null ? "" : entry.getValue().trim(),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        String code = requiredValue(normalizedValues, rowNumber, "code");
        String name = requiredValue(normalizedValues, rowNumber, "name");
        String address = requiredValue(normalizedValues, rowNumber, "address");
        String structureType = requiredValue(normalizedValues, rowNumber, "structure_type").toUpperCase(Locale.ROOT);
        if (structureTypeRegistry.findByCode(structureType).isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Riga " + rowNumber + ": tipo struttura non valido: " + structureType);
        }

        return new StructureImportRow(
                rowNumber,
                code,
                name,
                normalizedValues.getOrDefault("description", ""),
                address,
                normalizedValues.getOrDefault("cap", ""),
                normalizedValues.getOrDefault("city", ""),
                normalizedValues.getOrDefault("province", ""),
                normalizedValues.getOrDefault("region", ""),
                normalizedValues.getOrDefault("phone", ""),
                normalizedValues.getOrDefault("email", ""),
                normalizedValues.getOrDefault("service_calendar_hours", ""),
                parseBoolean(normalizedValues.getOrDefault("active", "true"), rowNumber),
                structureType,
                normalizedValues.getOrDefault("parent_code", "")
        );
    }

    private void validateHeaders(Set<String> headerNames) {
        Set<String> missingHeaders = Arrays.stream(REQUIRED_HEADERS)
                .filter(required -> !headerNames.contains(required))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (!missingHeaders.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Intestazioni mancanti: " + String.join(", ", missingHeaders));
        }
    }

    private void validateRowCodes(List<StructureImportRow> rows) {
        Set<String> seenCodes = new LinkedHashSet<>();
        for (StructureImportRow row : rows) {
            String normalizedCode = normalizeKey(row.code());
            if (!seenCodes.add(normalizedCode)) {
                throw new ResponseStatusException(CONFLICT, "Codice struttura duplicato nel file: " + row.code());
            }
            structureRepository.findByCode(row.code().trim())
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(CONFLICT, "Codice struttura già presente a database: " + row.code());
                    });
            if (row.parentCode() != null && !row.parentCode().isBlank() && normalizeKey(row.parentCode()).equals(normalizedCode)) {
                throw new ResponseStatusException(BAD_REQUEST, "Riga " + row.rowNumber() + ": il parentCode non può coincidere con il codice della struttura");
            }
        }
    }

    private String requiredValue(Map<String, String> values, int rowNumber, String key) {
        String value = values.get(key);
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Riga " + rowNumber + ": campo obbligatorio mancante: " + key);
        }
        return value.trim();
    }

    private boolean parseBoolean(String value, int rowNumber) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return true;
        }
        if (List.of("true", "1", "yes", "si", "sì", "y").contains(normalized)) {
            return true;
        }
        if (List.of("false", "0", "no", "n").contains(normalized)) {
            return false;
        }
        throw new ResponseStatusException(BAD_REQUEST, "Riga " + rowNumber + ": valore active non valido: " + value);
    }

    private Long resolveParentStructureId(String parentCode, Map<String, StructureDto> createdStructuresByCode) {
        if (parentCode == null || parentCode.isBlank()) {
            return null;
        }

        String normalizedParentCode = normalizeKey(parentCode);
        StructureDto createdParent = createdStructuresByCode.get(normalizedParentCode);
        if (createdParent != null) {
            return createdParent.getId();
        }

        return structureRepository.findByCode(parentCode.trim())
                .map(StructureEntity::getId)
                .orElse(null);
    }

    private StructureDto toStructureDto(StructureImportRow row, Long parentStructureId) {
        StructureDto dto = new StructureDto();
        dto.setCode(row.code());
        dto.setName(row.name());
        dto.setDescription(row.description());
        dto.setAddress(row.address());
        dto.setCap(row.cap());
        dto.setCity(row.city());
        dto.setProvince(row.province());
        dto.setRegion(row.region());
        dto.setPhone(row.phone());
        dto.setEmail(row.email());
        dto.setServiceCalendarHours(row.serviceCalendarHours());
        dto.setActive(row.active());
        dto.setStructureType(row.structureType());
        dto.setParentStructureId(parentStructureId);
        return dto;
    }

    private String getExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex < 0 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private char detectCsvDelimiter(byte[] content) {
        String sample = new String(content, StandardCharsets.UTF_8);
        String firstLine = sample.lines().findFirst().orElse("");
        long semicolons = firstLine.chars().filter(character -> character == ';').count();
        long commas = firstLine.chars().filter(character -> character == ',').count();
        return semicolons > commas ? ';' : ',';
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return "";
        }
        String withUnderscores = CAMEL_CASE_PATTERN.matcher(value.trim()).replaceAll("$1_$2");
        return withUnderscores
                .replaceAll("[^A-Za-z0-9]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "")
                .toLowerCase(Locale.ROOT);
    }

    private record StructureImportRow(
            int rowNumber,
            String code,
            String name,
            String description,
            String address,
            String cap,
            String city,
            String province,
            String region,
            String phone,
            String email,
            String serviceCalendarHours,
            boolean active,
            String structureType,
            String parentCode
    ) {
    }
}