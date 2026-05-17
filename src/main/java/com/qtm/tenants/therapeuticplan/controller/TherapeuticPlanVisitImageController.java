package com.qtm.tenants.therapeuticplan.controller;

import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanVisitImageDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitImageEntity;
import com.qtm.tenants.therapeuticplan.service.TherapeuticPlanVisitImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller per gestire le immagini associate alle visite del piano terapeutico.
 */
@RestController
@RequestMapping("/api/tenants/therapeutic-plans/{planId}/visits/{visitDate}/images")
@RequiredArgsConstructor
public class TherapeuticPlanVisitImageController {

    private final TherapeuticPlanVisitImageService imageService;

    /**
     * Carica un'immagine per una visita.
     *
     * @param planId ID del piano terapeutico
     * @param visitDate data della visita
     * @param file file immagine
     * @param description descrizione dell'immagine (opzionale)
     * @return DTO dell'immagine salvata
     */
    @PostMapping
    public ResponseEntity<TherapeuticPlanVisitImageDto> uploadImage(
            @PathVariable("planId") Long planId,
            @PathVariable("visitDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime visitDate,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description
    ) {
        TherapeuticPlanVisitImageDto saved = imageService.saveImage(planId, visitDate, file, description);
        return ResponseEntity.ok(saved);
    }

    /**
     * Recupera tutte le immagini di una visita.
     *
     * @param planId ID del piano terapeutico
     * @param visitDate data della visita
     * @return lista di DTO delle immagini
     */
    @GetMapping
    public ResponseEntity<List<TherapeuticPlanVisitImageDto>> getVisitImages(
            @PathVariable("planId") Long planId,
            @PathVariable("visitDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime visitDate
    ) {
        List<TherapeuticPlanVisitImageDto> images = imageService.getImagesForVisit(planId, visitDate);
        return ResponseEntity.ok(images);
    }

    /**
     * Scarica un'immagine specifica.
     *
     * @param planId ID del piano terapeutico
     * @param visitDate data della visita
     * @param imageId ID dell'immagine
     * @return immagine come byte array con content-type appropriato
     */
    @GetMapping("/{imageId}/download")
    public ResponseEntity<byte[]> downloadImage(
            @PathVariable("planId") Long planId,
            @PathVariable("visitDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime visitDate,
            @PathVariable("imageId") Long imageId
    ) {
        TherapeuticPlanVisitImageEntity image = imageService.getImageById(imageId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.getImageName() + "\"")
                .contentType(MediaType.parseMediaType(image.getImageType()))
                .body(image.getImageData());
    }

    /**
     * Elimina un'immagine.
     *
     * @param planId ID del piano terapeutico
     * @param visitDate data della visita
     * @param imageId ID dell'immagine
     * @return risposta vuota
     */
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable("planId") Long planId,
            @PathVariable("visitDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime visitDate,
            @PathVariable("imageId") Long imageId
    ) {
        imageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}
