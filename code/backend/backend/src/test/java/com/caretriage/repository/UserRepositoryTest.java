package com.caretriage.repository;

import com.caretriage.entity.Role;
import com.caretriage.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Test
    void whenSaveUserWithRole_thenSuccess() {
        // Arrange
        Role role = Role.builder()
                .name("ROLE_PATIENT")
                .description("Patient role")
                .build();
        role = roleRepository.save(role);

        User user = User.builder()
                .username("jpa_user")
                .email("jpa@example.com")
                .password("encoded_pass")
                .fullName("JPA User")
                .roles(Set.of(role))
                .build();

        // Act
        User savedUser = userRepository.save(user);

        // Assert
        assertNotNull(savedUser.getId());
        assertEquals(1, savedUser.getRoles().size());
        assertTrue(savedUser.getRoles().contains(role));
        
        Optional<User> foundUser = userRepository.findByEmail("jpa@example.com");
        assertTrue(foundUser.isPresent());
        assertEquals("JPA User", foundUser.get().getFullName());
    }

    @Test
    void whenSaveDuplicateEmail_thenFail() {
        // Arrange
        User user1 = User.builder()
                .username("user1")
                .email("dup@example.com")
                .password("pass")
                .fullName("User 1")
                .build();
        userRepository.saveAndFlush(user1);

        User user2 = User.builder()
                .username("user2")
                .email("dup@example.com")
                .password("pass")
                .fullName("User 2")
                .build();

        // Act & Assert
        assertThrows(Exception.class, () -> {
            userRepository.saveAndFlush(user2);
        });
    }
}
