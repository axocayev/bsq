package az.bsq.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminDashboardIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void testAdminDashboard_CanFetchSchools() throws Exception {
    mockMvc.perform(get("/v1/admin/schools")
            .with(user("admin").roles("ADMIN"))
            .param("page", "0")
            .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
  }

  @Test
  void testAdminDashboard_CanFetchUsers() throws Exception {
    mockMvc.perform(get("/v1/admin/users")
            .with(user("admin").roles("ADMIN"))
            .param("page", "0")
            .param("size", "20"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
  }

  @Test
  void testAdminDashboard_CanFetchExams() throws Exception {
    mockMvc.perform(get("/v1/admin/exams")
            .with(user("admin").roles("ADMIN"))
            .param("page", "0")
            .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
  }

  @Test
  void testUnauthorizedAccess_TeacherCannotAccessAdminEndpoints() throws Exception {
    mockMvc.perform(get("/v1/admin/schools")
            .with(user("teacher").roles("TEACHER")))
        .andExpect(status().isForbidden());
  }

  @Test
  void testUnauthorizedAccess_StudentCannotAccessAdminEndpoints() throws Exception {
    mockMvc.perform(get("/v1/admin/users")
            .with(user("student").roles("STUDENT")))
        .andExpect(status().isForbidden());
  }
}
