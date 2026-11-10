/** Export module (ADR-0005, FR-X-4): full data export, read-only SQL on ledger's schema. */
@ApplicationModule(
        displayName = "Export",
        allowedDependencies = {"shared", "ledger :: schema"})
package financeflow.export;

import org.springframework.modulith.ApplicationModule;
