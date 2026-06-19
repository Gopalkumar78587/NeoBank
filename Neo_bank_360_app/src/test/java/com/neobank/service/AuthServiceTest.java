package com.neobank.service;


import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_success() {
        com.neobank.dto.Auth.RegisterRequest request = new com.neobank.dto.Auth.RegisterRequest();
        request.setFullName("Gopal Kumar");
        request.setEmail("gopal@neobank.in");
        request.setPassword("Password@123");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed");

        authService.register(request);

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_duplicateEmail_shouldThrowException() {
        com.neobank.dto.Auth.RegisterRequest request = new com.neobank.dto.Auth.RegisterRequest();
        request.setEmail("gopal@neobank.in");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        RuntimeException ex =
                assertThrows(RuntimeException.class,
                        () -> authService.register(request));

        assertEquals("Email already registered", ex.getMessage());
    }
}