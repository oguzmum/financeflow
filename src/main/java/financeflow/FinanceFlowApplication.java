package financeflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;

/**
 * FinanceFlow: a modular monolith (ADR-0005).
 *
 * <p>Modules are the direct sub-packages of this package: {@code ledger}, {@code reporting}, {@code export},
 * {@code migration} and the shared kernel {@code shared}. Their allowed dependencies are declared in each module's
 * {@code package-info.java} and verified by {@code ModularityTest}.
 */
@SpringBootApplication
@Modulithic(sharedModules = "shared")
public class FinanceFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinanceFlowApplication.class, args);
    }
}
