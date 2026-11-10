/**
 * Shared kernel (ADR-0005): {@code Money} (WP-21), date helpers, German formatting. No business logic, no dependencies
 * on other modules or frameworks (not even a Spring Modulith annotation here; it's declared shared via
 * {@code @Modulithic(sharedModules)}); checked by {@code ArchitectureRulesTest}.
 */
package financeflow.shared;
