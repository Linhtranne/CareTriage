package com.caretriage.domain.repository;

import com.caretriage.infrastructure.persistence.entity.RoleJpaEntity;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import com.caretriage.infrastructure.persistence.repository.RoleJpaRepository;
import com.caretriage.infrastructure.persistence.repository.UserJpaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@EntityScan(basePackages = {
        "com.caretriage.domain.entity",
        "com.caretriage.infrastructure.persistence.entity"
})
@EnableJpaRepositories(basePackages = "com.caretriage.infrastructure.persistence.repository")
class UserRepositoryTest {

    @Autowired
    private UserJpaRepository userRepository;

    @Autowired
    private RoleJpaRepository roleRepository;

    @Test
    void whenSaveUserWithRole_thenSuccess() {
        // Arrange
        RoleJpaEntity role = RoleJpaEntity.builder()
                .name("ROLE_PATIENT")
                .description("Patient role")
                .build();
        role = roleRepository.save(role);

        UserJpaEntity user = UserJpaEntity.builder()
                .username("jpa_user")
                .email("jpa@example.com")
                .password("encoded_pass")
                .fullName("JPA User")
                .roles(Set.of(role))
                .build();

        // Act
        UserJpaEntity savedUser = userRepository.save(user);

        // Assert
        assertNotNull(savedUser.getId());
        assertEquals(1, savedUser.getRoles().size());
        assertTrue(savedUser.getRoles().contains(role));
        
        Optional<UserJpaEntity> foundUser = userRepository.findByEmail("jpa@example.com");
        assertTrue(foundUser.isPresent());
        assertEquals("JPA User", foundUser.get().getFullName());
    }

    @Test
    void whenSaveDuplicateEmail_thenFail() {
        // Arrange
        UserJpaEntity user1 = UserJpaEntity.builder()
                .username("user1")
                .email("dup@example.com")
                .password("pass")
                .fullName("User 1")
                .build();
        userRepository.save(user1);

        UserJpaEntity user2 = UserJpaEntity.builder()
                .username("user2")
                .email("dup@example.com")
                .password("pass")
                .fullName("User 2")
                .build();

        // Act & Assert
        assertThrows(Exception.class, () -> {
            userRepository.save(user2);
        });
    }
}
