package financeflow;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/** Verifies the module boundaries of ADR-0005 (§3) and writes module docs to target/spring-modulith-docs. */
class ModularityTest {

    private final ApplicationModules modules = ApplicationModules.of(FinanceFlowApplication.class);

    @Test
    void moduleBoundariesAreRespected() {
        modules.verify();
    }

    @Test
    void writesModuleDocumentation() {
        new Documenter(modules).writeModulesAsPlantUml().writeIndividualModulesAsPlantUml();
    }
}
