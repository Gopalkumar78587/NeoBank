package com.neobank.repository;

import com.neobank.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Repository contract tests using Mockito (no DB / H2 required).
 * These verify that callers wire the repository correctly.
 */
@ExtendWith(MockitoExtension.class)
class UserRepositoryTest {

    @Mock
    private UserRepository userRepository;

    @Test
    void existsByEmail_returnsTrue_whenEmailExists() {
        when(userRepository.existsByEmail("test@neobank.in")).thenReturn(true);

        assertTrue(userRepository.existsByEmail("test@neobank.in"));
    }

    @Test
    void existsByEmail_returnsFalse_whenEmailAbsent() {
        when(userRepository.existsByEmail("absent@neobank.in")).thenReturn(false);

        assertFalse(userRepository.existsByEmail("absent@neobank.in"));
    }

    @Test
    void findByEmail_returnsUser_whenPresent() {
        User user = User.builder()
                .email("find@neobank.in")
                .passwordHash("hashed_password")
                .fullName("Finder")
                .build();
        when(userRepository.findByEmail("find@neobank.in")).thenReturn(Optional.of(user));

        Optional<User> result = userRepository.findByEmail("find@neobank.in");

        assertTrue(result.isPresent());
        assertEquals("find@neobank.in", result.get().getEmail());
    }

    @Test
    void findByEmail_returnsEmpty_whenAbsent() {
        when(userRepository.findByEmail("ghost@neobank.in")).thenReturn(Optional.empty());

        Optional<User> result = userRepository.findByEmail("ghost@neobank.in");

        assertFalse(result.isPresent());
    }
}