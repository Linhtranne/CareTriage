package db.migration;

import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class V8_1__safe_triage_ticket_unique_constraint extends BaseJavaMigration {
    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();
        
        // 1. Query duplicate chat_session_id in triage_tickets
        List<Long> duplicateSessionIds = new ArrayList<>();
        String checkSql = "SELECT chat_session_id, COUNT(*) as cnt FROM triage_tickets " +
                          "WHERE chat_session_id IS NOT NULL " +
                          "GROUP BY chat_session_id HAVING cnt > 1";
        
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(checkSql)) {
            while (rs.next()) {
                duplicateSessionIds.add(rs.getLong("chat_session_id"));
            }
        }
        
        // 2. If duplicates exist, throw FlywayException with the duplicate IDs
        if (!duplicateSessionIds.isEmpty()) {
            throw new FlywayException("Migration failed: duplicate chat_session_id values found in triage_tickets for session IDs: " + 
                                       duplicateSessionIds);
        }
        
        // 3. Create unique index safely
        String createIndexSql = "ALTER TABLE triage_tickets ADD CONSTRAINT uq_triage_ticket_chat_session UNIQUE (chat_session_id)";
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(createIndexSql);
        }
    }
}
