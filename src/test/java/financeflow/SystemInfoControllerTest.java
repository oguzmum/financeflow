package financeflow;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = {SystemInfoController.class, SpaForwardingController.class})
class SystemInfoControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void returnsSystemInfo() throws Exception {
        mvc.perform(get("/api/system/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("FinanceFlow"));
    }

    @Test
    void forwardsClientSideRoutesToTheSpa() throws Exception {
        mvc.perform(get("/buchungen")).andExpect(forwardedUrl("/index.html"));
        mvc.perform(get("/konten/42")).andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void unknownApiPathsAreNotForwardedToTheSpa() throws Exception {
        mvc.perform(get("/api/does-not-exist")).andExpect(status().isNotFound());
    }
}
