package com.caretriage.repository;

import com.caretriage.config.JpaConfig;
import com.caretriage.entity.TicketCategory;
import com.caretriage.entity.TriageTicket;
import com.caretriage.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Import(JpaConfig.class)
@EntityScan(basePackages = "com.caretriage.entity")
@EnableJpaRepositories(basePackages = "com.caretriage.repository")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=true",
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class TriageTicketRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TriageTicketRepository triageTicketRepository;

    private User requester;
    private TicketCategory category;

    @BeforeEach
    void setUp() {
        requester = User.builder()
                .username("requester1")
                .email("requester1@test.com")
                .password("hashed_password")
                .fullName("Requester One")
                .build();
        entityManager.persist(requester);

        category = TicketCategory.builder()
                .code("AUTH")
                .name("Authentication")
                .build();
        entityManager.persist(category);
        entityManager.flush();
    }

    @Test
    void shouldSaveAndFindByTicketNumber() {
        TriageTicket ticket = TriageTicket.builder()
                .ticketNumber("TT-1001")
                .title("Login issue")
                .description("Cannot access dashboard")
                .status(TriageTicket.Status.NEW)
                .priority(TriageTicket.Priority.HIGH)
                .severity(TriageTicket.Severity.MAJOR)
                .requester(requester)
                .category(category)
                .metadata("{\"source\":\"web\"}")
                .build();

        TriageTicket saved = triageTicketRepository.save(ticket);
        entityManager.flush();

        Optional<TriageTicket> found = triageTicketRepository.findByTicketNumber("TT-1001");

        assertThat(saved.getId()).isNotNull();
        assertThat(found).isPresent();
        assertThat(found.get().getRequester().getId()).isEqualTo(requester.getId());
        assertThat(found.get().getMetadata()).isEqualTo("{\"source\":\"web\"}");
    }

    @Test
    void shouldFilterByStatusPriorityAndRequester() {
        TriageTicket ticketA = TriageTicket.builder()
                .ticketNumber("TT-2001")
                .title("A")
                .description("Desc A")
                .status(TriageTicket.Status.NEW)
                .priority(TriageTicket.Priority.LOW)
                .severity(TriageTicket.Severity.MINOR)
                .requester(requester)
                .build();

        TriageTicket ticketB = TriageTicket.builder()
                .ticketNumber("TT-2002")
                .title("B")
                .description("Desc B")
                .status(TriageTicket.Status.TRIAGED)
                .priority(TriageTicket.Priority.HIGH)
                .severity(TriageTicket.Severity.CRITICAL)
                .requester(requester)
                .build();

        triageTicketRepository.save(ticketA);
        triageTicketRepository.save(ticketB);
        entityManager.flush();

        List<TriageTicket> byStatus = triageTicketRepository.findByStatus(TriageTicket.Status.NEW);
        List<TriageTicket> byPriority = triageTicketRepository.findByPriority(TriageTicket.Priority.HIGH);
        List<TriageTicket> byRequester = triageTicketRepository.findByRequesterIdOrderByCreatedAtDesc(requester.getId());

        assertThat(byStatus).hasSize(1);
        assertThat(byPriority).hasSize(1);
        assertThat(byRequester).hasSize(2);
    }
}
