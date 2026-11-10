/**
 * jOOQ classes generated at build time from the Flyway migrations (ADR-0006; sources in
 * {@code target/generated-sources/jooq}). Ledger owns the schema; {@code reporting} and {@code export} may read it
 * (CQRS-lite, ADR-0005 §5).
 */
@NamedInterface("schema")
package financeflow.ledger.schema;

import org.springframework.modulith.NamedInterface;
