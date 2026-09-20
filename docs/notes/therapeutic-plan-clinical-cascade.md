# Tenants-app: Cascata Clinica Regione-ASL-Ospedale-Dipartimento

## Contesto
Questa nota documenta la cascata del passo clinico nel componente Therapeutic Plan CRUD e i fix applicati per allineare TENAPP al comportamento corretto.

## Componenti coinvolti
- frontend/src/app/features/therapeutic-plan/therapeutic-plan-crud.component.ts
- frontend/src/app/features/therapeutic-plan/therapeutic-plan-crud.component.html
- frontend/src/app/core/structure-api.service.ts
- backend: endpoint GET /api/tenants/structures/overview

## Comportamento atteso della cascata
1. Cambio Regione:
- reset selezione ASL
- reset selezione Struttura/Ospedale
- reset selezione Dipartimento
- svuotamento opzioni dipendenti
- chiamata overview con regionCode normalizzato a 2 cifre (esempio 09)

2. Cambio ASL:
- mantiene la Regione selezionata
- reset selezione Struttura/Ospedale
- reset selezione Dipartimento
- svuotamento opzioni Struttura e Dipartimento
- chiamata overview con regionCode + aslCode

3. Cambio Struttura/Ospedale:
- reset selezione Dipartimento
- svuotamento opzioni Dipartimento
- caricamento dipartimenti via endpoint strutture/{id}/departments

## Endpoint overview
- Usare GET /api/tenants/structures/overview
- Query params supportati: regionCode, aslCode
- Evitare l'uso della lista generica /api/tenants/structures per la cascata geografica

## Payload overview richiesto
Le righe overview devono contenere:
- codici lookup: codiceRegione, codiceAsl, codiceStruttura
- descrizioni: regione, asl, struttura
- id database: aslId, strutturaId

## Punto critico risolto (404 dipartimenti)
Errore visto:
- GET /api/tenants/structures/90623/departments
- Risposta: Ospedale non trovato: 90623

Causa:
- veniva passato codiceStruttura (codice ministeriale) invece dell'id primario database della struttura.

Regola corretta:
- la chiamata dipartimenti deve sempre usare structure.id (id DB), oppure overview.strutturaId quando il dato arriva dall'overview.

## Nota implementativa
Quando dal filtro/select si ha solo il codice struttura, bisogna risolvere l'oggetto struttura nell'array opzioni e prelevare il relativo id DB prima della chiamata ai dipartimenti.

## Verifica rapida
- Seleziona Regione: verifica chiamata overview con regionCode a 2 cifre.
- Seleziona ASL: verifica chiamata overview con regionCode + aslCode.
- Seleziona Ospedale: verifica chiamata dipartimenti con id DB (non codice ministeriale).
- Cambiando Regione o ASL, Dipartimento deve sempre tornare vuoto.
