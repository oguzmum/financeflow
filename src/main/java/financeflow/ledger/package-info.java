/**
 * Ledger module (ADR-0005): accounts, categories, bookings, balances and all write rules of ADR-0002 to ADR-0004.
 *
 * <p>Hexagonal inside: {@code domain} (no framework, no SQL), application services, ports, adapters. The base package
 * is the public API (used by {@code migration}). The jOOQ schema classes ({@code schema}) are exposed read-only to
 * {@code reporting} and {@code export}.
 */
@ApplicationModule(displayName = "Ledger", allowedDependencies = "shared")
package financeflow.ledger;

import org.springframework.modulith.ApplicationModule;
