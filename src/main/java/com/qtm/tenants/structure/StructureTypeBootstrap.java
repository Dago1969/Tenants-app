package com.qtm.tenants.structure;

import com.qtm.tenants.structure.entity.StructureTypeEntity;
import com.qtm.tenants.structure.repository.StructureTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Bootstrap del catalogo tipi struttura persistito a database.
 */
@Component
@RequiredArgsConstructor
@Order(5)
public class StructureTypeBootstrap implements CommandLineRunner {

    private static final List<SeedStructureType> DEFAULT_TYPES = List.of(
            new SeedStructureType("ASL", "Azienda Sanitaria Locale", "Nodo capofila territoriale: raggruppa ospedali, farmacie e altre strutture, assicurando coerenza dei flussi e visibilita dati multi-tenant.", null, 10),
            new SeedStructureType("HOSPITAL", "Struttura Ospedaliera", "Centro clinico dove si prescrivono e si monitorano i Piani Terapeutici; fa capo a una o piu farmacie ospedaliere.", "ASL", 20),
            new SeedStructureType("HOSPITAL_PHARMACY", "Farmacia Ospedaliera", "Hub logistico interno all'ospedale per preparazione e tracciabilita ordini.", "HOSPITAL", 30),
            new SeedStructureType("RETAIL_PHARMACY", "Farmacia Retail", "Punto di ritiro di prossimita o ultimo-miglio delivery nei progetti territoriali.", "ASL", 40),
            new SeedStructureType("LOGISTICS_WAREHOUSE", "Magazzino Logistica", "Deposito centrale esterno o interno che alimenta FO o FR; collegabile via API o WMS per stock real-time.", "ASL", 50),
            new SeedStructureType("MATERIAL_WAREHOUSE", "Magazzino Materiale", "Distribuzione interna di gadget, volantini e materiale monouso o promozionale.", "ASL", 60),
            new SeedStructureType("PHARMA_COMPANY", "Azienda Farmaceutica", "Ente promotore di progetti PSP, aderenza o delivery con interesse a KPI clinici, logistici e farmacovigilanza.", null, 70),
            new SeedStructureType("SPECIALIST_CLINIC", "Clinica Ambulatorio Specialistica", "Struttura extra-ospedaliera che utilizza gli stessi flussi PT dell'ospedale per progetti cronici o PSP.", "ASL", 80),
            new SeedStructureType("VENDOR", "Fornitore", "Nodo organizzativo per aziende terze che forniscono beni o servizi essenziali alla delivery di un PSP, inclusi dispositivi, logistica, laboratori e personale infermieristico.", null, 90)
    );

    private final StructureTypeRepository structureTypeRepository;

    @Override
    @Transactional
    public void run(String... args) {
        for (SeedStructureType definition : DEFAULT_TYPES) {
            structureTypeRepository.findById(definition.code())
                    .orElseGet(() -> structureTypeRepository.save(toEntity(definition)));
        }
    }

    private StructureTypeEntity toEntity(SeedStructureType definition) {
        StructureTypeEntity entity = new StructureTypeEntity();
        entity.setCode(definition.code());
        entity.setDescription(definition.description());
        entity.setFunctionDescription(definition.functionDescription());
        entity.setParentTypeCode(definition.parentTypeCode());
        entity.setDisplayOrder(definition.displayOrder());
        return entity;
    }

    private record SeedStructureType(
            String code,
            String description,
            String functionDescription,
            String parentTypeCode,
            Integer displayOrder
    ) {
    }
}