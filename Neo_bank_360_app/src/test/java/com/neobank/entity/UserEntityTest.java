package com.neobank.entity;

import com.neobank.enums.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserEntityTest {

    @Test
    void userEntity_shouldSetDefaultRoleCustomer() {
        User user = new User();
        assertEquals(Role.CUSTOMER, user.getRole());
    }

    @Test
    void userEntity_shouldHaveActiveByDefault() {
        User user = new User();
        assertTrue(user.isActive());
    }
}
