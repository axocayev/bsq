package az.bsq.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void testAdminCanAccessSchoolsEndpoint() throws Exception {
    mockMvc.perform(get("/v1/admin/schools")
            .with(user("admin").roles("ADMIN"))
            .param("page", "0")
            .param("size", "10"))
        .andExpect(status().isOk());
  }

  @Test
  void testTeacherCannotAccessAdminEndpoints() throws Exception {
    mockMvc.perform(get("/v1/admin/schools")
            .with(user("teacher").roles("TEACHER")))
        .andExpect(status().isForbidden());
  }

  @Test
  void testAdminCanAccessUsersEndpoint() throws Exception {
    mockMvc.perform(get("/v1/admin/users")
            .with(user("admin").roles("ADMIN"))
            .param("page", "0")
            .param("size", "10"))
        .andExpect(status().isOk());
  }

  @Test
  void testAdminCanAccessExamsEndpoint() throws Exception {
    mockMvc.perform(get("/v1/admin/exams")
            .with(user("admin").roles("ADMIN"))
            .param("page", "0")
            .param("size", "10"))
        .andExpect(status().isOk());
  }
}
