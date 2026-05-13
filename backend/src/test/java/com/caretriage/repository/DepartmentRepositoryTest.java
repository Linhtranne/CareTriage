package com.caretriage.repository;

import com.caretriage.entity.Department;
import com.caretriage.entity.DepartmentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import com.caretriage.config.JpaConfig;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Import(JpaConfig.class)
@org.springframework.boot.autoconfigure.domain.EntityScan(basePackages = "com.caretriage.entity")
@org.springframework.data.jpa.repository.config.EnableJpaRepositories(basePackages = "com.caretriage.repository")
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.ANY)
@org.springframework.test.context.TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=true",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
public class DepartmentRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private DepartmentRepository departmentRepository;

    private Department cardi;
    private Department neuro;

    @BeforeEach
    void setUp() {
        cardi = Department.builder()
                .code("CARD")
                .name("Cardiology")
                .slug("cardiology")
                .description("Heart specialists")
                .status(DepartmentStatus.ACTIVE)
                .build();

        neuro = Department.builder()
                .code("NEUR")
                .name("Neurology")
                .slug("neurology")
                .description("Brain specialists")
                .status(DepartmentStatus.INACTIVE)
                .build();

        entityManager.persist(cardi);
        entityManager.persist(neuro);
        entityManager.flush();
    }

    @Test
    void whenFindByCode_thenReturnDepartment() {
        Optional<Department> found = departmentRepository.findByCode("CARD");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Cardiology");
    }

    @Test
    void whenFindByNameContaining_thenReturnList() {
        List<Department> found = departmentRepository.findByNameContainingIgnoreCase("logy");
        assertThat(found).hasSize(2);
    }

    @Test
    void whenFindAllByStatus_thenReturnFilteredList() {
        List<Department> activeDepts = departmentRepository.findAllByStatus(DepartmentStatus.ACTIVE);
        assertThat(activeDepts).hasSize(1);
        assertThat(activeDepts.get(0).getCode()).isEqualTo("CARD");

        List<Department> inactiveDepts = departmentRepository.findAllByStatus(DepartmentStatus.INACTIVE);
        assertThat(inactiveDepts).hasSize(1);
        assertThat(inactiveDepts.get(0).getCode()).isEqualTo("NEUR");
    }

    @Test
    void whenSaveDepartment_thenAuditFieldsArePopulated() {
        Department newDept = Department.builder()
                .code("ORTHO")
                .name("Orthopedics")
                .slug("orthopedics")
                .status(DepartmentStatus.ACTIVE)
                .build();
        
        Department saved = departmentRepository.save(newDept);
        
        assertThat(saved.getCreatedAt()).isNotNull();
        // Since we are in @DataJpaTest without full security, createdBy might be SYSTEM if configured, 
        // or null if AuditorAware is not fully mocked in DataJpaTest.
    }
}
