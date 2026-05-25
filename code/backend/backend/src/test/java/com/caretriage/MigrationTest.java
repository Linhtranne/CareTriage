package com.caretriage;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class MigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void whenContextStarts_thenMigrationsApplied() {
        // Kiểm tra xem các bảng chính đã được tạo chưa
        assertDoesNotThrow(() -> {
            Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            Integer roleCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM roles", Integer.class);
            System.out.println("Users count: " + userCount);
            System.out.println("Roles count: " + roleCount);
        });
    }

    @Test
    void checkSpecificIndexes() {
        // Kiểm tra index trên email (MySQL syntax)
        String query = "SHOW INDEX FROM users WHERE Column_name = 'email'";
        Boolean hasEmailIndex = jdbcTemplate.query(query, (ResultSetExtractor<Boolean>) rs -> rs.next());
        assertTrue(Boolean.TRUE.equals(hasEmailIndex), "Table 'users' should have an index on 'email' column");
    }
}
