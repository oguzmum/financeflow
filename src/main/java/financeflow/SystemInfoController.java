package financeflow;

import generated.financeflow.api.SystemApi;
import generated.financeflow.api.model.SystemInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Technical endpoint from the skeleton contract ({@code api/openapi.yaml}). Lives in the root package because it
 * belongs to no domain module; WP-26 decides where technical endpoints (e.g. backup status, ADR-0007) go.
 */
@RestController
@RequestMapping("/api")
class SystemInfoController implements SystemApi {

    private final String version;

    SystemInfoController(@Value("${financeflow.version:dev}") String version) {
        this.version = version;
    }

    @Override
    public SystemInfo getSystemInfo() {
        return new SystemInfo("FinanceFlow", version);
    }
}
