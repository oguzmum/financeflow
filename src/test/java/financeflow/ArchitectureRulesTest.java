package financeflow;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;

/** Rules from ADR-0005 that Spring Modulith's module check doesn't cover. */
class ArchitectureRulesTest {

    private final JavaClasses classes = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("financeflow");

    @Test
    void ledgerDomainImportsNoSpringAndNoJooq() {
        noClasses()
                .that()
                .resideInAPackage("financeflow.ledger.domain..")
                .should()
                .dependOnClassesThat()
                .resideInAnyPackage("org.springframework..", "org.jooq..", "financeflow.ledger.schema..")
                .allowEmptyShould(true) // the domain is still empty in the skeleton
                .check(classes);
    }

    @Test
    void sharedKernelDependsOnNoModuleAndNoFramework() {
        noClasses()
                .that()
                .resideInAPackage("financeflow.shared..")
                .should()
                .dependOnClassesThat()
                .resideInAnyPackage(
                        "financeflow.ledger..",
                        "financeflow.reporting..",
                        "financeflow.export..",
                        "financeflow.migration..",
                        "org.springframework..",
                        "org.jooq..")
                .allowEmptyShould(true)
                .check(classes);
    }
}
