package com.neobank.dto.Auth;

public class JwtResponse {

    private final String token;
    private final String role;
    private final String fullName;
    private final String email;

    public JwtResponse(String token, String role, String fullName, String email) {
        this.token = token;
        this.role = role;
        this.fullName = fullName;
        this.email = email;
    }

    public String getToken() { return token; }
    public String getRole() { return role; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
}