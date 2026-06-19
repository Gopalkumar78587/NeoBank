package com.neobank.controller;

import com.neobank.config.JwtUtil;
import com.neobank.dto.Auth.JwtResponse;
import com.neobank.dto.Auth.LoginRequest;
import com.neobank.dto.Auth.RegisterRequest;
import com.neobank.entity.User;
import com.neobank.repository.UserRepository;
import com.neobank.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    // ✅ REGISTER
    @PostMapping("/register")
    public ResponseEntity<String> register(
            @Valid @RequestBody RegisterRequest request) {

        authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("User registered successfully");
    }

    // ✅ LOGIN
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {

        Authentication auth =
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );

        UserDetails principal = (UserDetails) auth.getPrincipal();

        String role = principal.getAuthorities()
            .iterator()
            .next()
            .getAuthority()
            .replace("ROLE_", "");

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);

        String token = jwtUtil.generateToken(claims, principal.getUsername());

        String fullName = userRepository.findByEmail(principal.getUsername())
                .map(User::getFullName)
                .orElse(principal.getUsername());

        return ResponseEntity.ok(new JwtResponse(
                token,
                role,
                fullName,
                principal.getUsername()
        ));
    }
}
