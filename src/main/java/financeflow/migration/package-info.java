/**
 * Migration module (ADR-0005): one-time Money Manager migration. Creates data only through ledger's public API.
 * Nothing may depend on this module, so it can be deleted after cutover.
 */
@ApplicationModule(
        displayName = "Migration",
        allowedDependencies = {"shared", "ledger"})
package financeflow.migration;

import org.springframework.modulith.ApplicationModule;
