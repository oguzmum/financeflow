package financeflow;

import static org.assertj.core.api.Assertions.assertThat;

import org.jooq.DSLContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Starts the whole app against a real PostgreSQL (Testcontainers): Flyway migrates, jOOQ connects. Skipped
 * automatically when Docker isn't available.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest
class ApplicationIT {

    @TestConfiguration(proxyBeanMethods = false)
    static class Containers {
        @Bean
        @ServiceConnection
        PostgreSQLContainer postgres() {
            return new PostgreSQLContainer(DockerImageName.parse("postgres:18.6-alpine"));
        }
    }

    @Autowired
    private DSLContext dsl;

    @Test
    void startsAndMigrates() {
        Number applied = (Number) dsl.fetchValue("select count(*) from flyway_schema_history where success");
        assertThat(applied.intValue()).isGreaterThanOrEqualTo(1);
    }
}
