package com.qtm.tenants.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Traduce i messaggi tecnici del database in motivazioni funzionali comprensibili per tutte le entity esposte via REST.
 */
@Component
public class PersistenceErrorMessageResolver {

    private static final Pattern UNIQUE_PATTERN = Pattern.compile("UNIQUE constraint failed: (.+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern NOT_NULL_PATTERN = Pattern.compile("NOT NULL constraint failed: ([\\w]+)\\.([\\w]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern COLUMN_PATTERN = Pattern.compile("([\\w]+)\\.([\\w]+)");

    private static final Map<String, String> COLUMN_LABELS = Map.ofEntries(
            Map.entry("users.username", "username"),
            Map.entry("users.role_id", "ruolo"),
            Map.entry("users.structure_id", "struttura"),
            Map.entry("roles.id", "codice ruolo"),
            Map.entry("roles.name", "nome ruolo"),
            Map.entry("roles.description", "descrizione ruolo"),
            Map.entry("modules.code", "codice modulo"),
            Map.entry("modules.name", "nome modulo"),
            Map.entry("functions.code", "codice funzione"),
            Map.entry("functions.name", "nome funzione"),
            Map.entry("structures.code", "codice struttura"),
            Map.entry("structures.name", "nome struttura"),
            Map.entry("structures.address", "indirizzo struttura"),
            Map.entry("structures.structure_type", "tipologia struttura"),
            Map.entry("structures.parent_structure_id", "struttura parent"),
            Map.entry("structure_types.code", "codice tipo struttura"),
            Map.entry("structure_types.description", "descrizione tipo struttura"),
            Map.entry("structure_types.function_description", "descrizione funzionale"),
            Map.entry("structure_types.parent_type_code", "tipo parent"),
            Map.entry("structure_types.display_order", "ordine di importanza"),
            Map.entry("doctors.doctor_flyer_id", "codice dottore"),
            Map.entry("doctors.email", "email dottore"),
            Map.entry("nurses.nurse_project_id", "codice infermiere"),
            Map.entry("nurses.email", "email infermiere"),
            Map.entry("patients.assisted_id", "codice assistito"),
            Map.entry("patients.fiscal_code", "codice fiscale paziente"),
            Map.entry("patients.email", "email paziente")
    );

    public ResolvedPersistenceError resolve(DataIntegrityViolationException exception) {
        String rawMessage = extractMostSpecificMessage(exception);
        if (rawMessage == null || rawMessage.isBlank()) {
            return new ResolvedPersistenceError(HttpStatus.BAD_REQUEST, "Operazione non valida per vincoli di persistenza");
        }

        Matcher uniqueMatcher = UNIQUE_PATTERN.matcher(rawMessage);
        if (uniqueMatcher.find()) {
            List<String> fields = extractColumns(uniqueMatcher.group(1));
            if (fields.size() == 1) {
                return new ResolvedPersistenceError(HttpStatus.CONFLICT, "Valore gia presente per " + fields.get(0));
            }
            return new ResolvedPersistenceError(HttpStatus.CONFLICT, "Combinazione gia presente per " + String.join(", ", fields));
        }

        Matcher notNullMatcher = NOT_NULL_PATTERN.matcher(rawMessage);
        if (notNullMatcher.find()) {
            String field = resolveFieldLabel(notNullMatcher.group(1), notNullMatcher.group(2));
            return new ResolvedPersistenceError(HttpStatus.BAD_REQUEST, "Campo obbligatorio mancante: " + field);
        }

        if (rawMessage.toLowerCase(Locale.ROOT).contains("foreign key constraint failed")) {
            return new ResolvedPersistenceError(
                    HttpStatus.BAD_REQUEST,
                    "Operazione non consentita: esistono riferimenti collegati oppure uno dei riferimenti richiesti non esiste"
            );
        }

        return new ResolvedPersistenceError(HttpStatus.BAD_REQUEST, sanitizeFallbackMessage(rawMessage));
    }

    private List<String> extractColumns(String rawColumns) {
        Matcher matcher = COLUMN_PATTERN.matcher(rawColumns);
        return matcher.results()
                .map(result -> resolveFieldLabel(result.group(1), result.group(2)))
                .distinct()
                .toList();
    }

    private String resolveFieldLabel(String table, String column) {
        String key = (table + "." + column).toLowerCase(Locale.ROOT);
        String mapped = COLUMN_LABELS.get(key);
        if (mapped != null) {
            return mapped;
        }

        return humanizeColumnName(column);
    }

    private String humanizeColumnName(String column) {
        return switch (column.toLowerCase(Locale.ROOT)) {
            case "id" -> "identificativo";
            case "code" -> "codice";
            case "name" -> "nome";
            case "description" -> "descrizione";
            case "email" -> "email";
            case "phone" -> "telefono";
            case "address" -> "indirizzo";
            case "city_id" -> "comune";
            case "province_id" -> "provincia";
            case "region_id" -> "regione";
            default -> column.replace("_id", "").replace('_', ' ');
        };
    }

    private String sanitizeFallbackMessage(String rawMessage) {
        String sanitized = rawMessage
                .replace("[SQLITE_CONSTRAINT]", "")
                .replace("SQLITE_CONSTRAINT:", "")
                .replace("constraint failed", "vincolo non rispettato")
                .trim();
        return sanitized.isBlank() ? "Operazione non valida per vincoli di persistenza" : sanitized;
    }

    private String extractMostSpecificMessage(DataIntegrityViolationException exception) {
        Throwable mostSpecificCause = exception.getMostSpecificCause();
        if (mostSpecificCause != null && mostSpecificCause.getMessage() != null) {
            return mostSpecificCause.getMessage();
        }

        return exception.getMessage();
    }

    public record ResolvedPersistenceError(HttpStatus status, String detail) {
    }
}