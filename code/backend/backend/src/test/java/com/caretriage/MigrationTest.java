package com.caretriage;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
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
        assertDoesNotThrow(() -> {
            Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            Integer roleCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM roles", Integer.class);

            assertTrue(userCount != null && userCount >= 0);
            assertTrue(roleCount != null && roleCount >= 0);
        });
    }

    @Test
    void checkSpecificIndexes() {
        String query = """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.INDEX_COLUMNS
                WHERE LOWER(TABLE_NAME) = 'users'
                  AND LOWER(COLUMN_NAME) = 'email'
                """;
        Integer indexCount = jdbcTemplate.queryForObject(query, Integer.class);

        assertTrue(indexCount != null && indexCount > 0, "Table 'users' should have an index on 'email' column");
    }
}
