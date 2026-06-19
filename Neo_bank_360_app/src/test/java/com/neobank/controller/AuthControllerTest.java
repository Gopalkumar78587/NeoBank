package com.neobank.controller;

import com.neobank.config.JwtUtil;
import com.neobank.dto.Auth.JwtResponse;
import com.neobank.dto.Auth.LoginRequest;
import com.neobank.dto.Auth.RegisterRequest;
import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import com.neobank.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthController authController;

    // ─── register ────────────────────────────────────────────────

    @Test
    void register_validRequest_returns201() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Gopal Kumar");
        request.setEmail("gopal@neobank.in");
        request.setPassword("Password@123");

        doNothing().when(authService).register(any(RegisterRequest.class));

        ResponseEntity<String> response = authController.register(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("User registered successfully", response.getBody());
        verify(authService).register(request);
    }

    @Test
    void register_duplicateEmail_serviceThrows() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Duplicate User");
        request.setEmail("dup@neobank.in");
        request.setPassword("Password@123");

        doThrow(new RuntimeException("Email already registered"))
                .when(authService).register(any(RegisterRequest.class));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authController.register(request));
        assertEquals("Email already registered", ex.getMessage());
    }

    // ─── login ───────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void login_validCredentials_returnsTokenAndRole() {
        LoginRequest request = new LoginRequest();
        request.setEmail("gopal@neobank.in");
        request.setPassword("Password@123");

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_CUSTOMER");

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getAuthorities())
                .thenReturn((Collection) List.of(authority));
        when(userDetails.getUsername()).thenReturn("gopal@neobank.in");

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(jwtUtil.generateToken(any(), anyString())).thenReturn("mocked.jwt.token");

        User user = new User();
        user.setFullName("Gopal Kumar");
        when(userRepository.findByEmail("gopal@neobank.in"))
                .thenReturn(Optional.of(user));

        ResponseEntity<JwtResponse> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("mocked.jwt.token", response.getBody().getToken());
        assertEquals("CUSTOMER", response.getBody().getRole());
        assertEquals("Gopal Kumar", response.getBody().getFullName());
    }
}