package financeflow;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the React SPA (ADR-0006): client-side routes like {@code /buchungen} are answered with {@code index.html}.
 * Paths with a dot (static files) and {@code /api/**}, {@code /actuator/**} are not matched.
 */
@Controller
class SpaForwardingController {

    @GetMapping({"/{path:^(?!api$|actuator$)[^.]*}", "/{path:^(?!api$|actuator$)[^.]*}/**"})
    String forwardToIndex() {
        return "forward:/index.html";
    }
}
