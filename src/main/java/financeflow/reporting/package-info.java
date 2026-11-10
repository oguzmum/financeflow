/** Reporting module (ADR-0005): read-only SQL on ledger's schema, straight into view models. */
@ApplicationModule(
        displayName = "Reporting",
        allowedDependencies = {"shared", "ledger :: schema"})
package financeflow.reporting;

import org.springframework.modulith.ApplicationModule;
