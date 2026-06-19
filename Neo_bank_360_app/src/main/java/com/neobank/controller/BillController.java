package com.neobank.controller;

import com.neobank.entity.Bill;
import com.neobank.entity.User;
import com.neobank.enums.BillStatus;
import com.neobank.repository.UserRepository;
import com.neobank.service.BillService;
import com.neobank.service.OtpService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/bills")
@PreAuthorize("isAuthenticated()")
public class BillController {

    private final BillService billService;
    private final UserRepository userRepository;
    private final OtpService otpService;

    public BillController(BillService billService,
                          UserRepository userRepository,
                          OtpService otpService) {
        this.billService = billService;
        this.userRepository = userRepository;
        this.otpService = otpService;
    }

    private User getUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping
    public Bill create(@RequestBody Bill bill,
                       Authentication authentication) {
        return billService.createBill(bill, getUser(authentication));
    }

    @GetMapping
    public List<Bill> getBills(
            @RequestParam(required = false) BillStatus status,
            Authentication authentication) {
        User user = getUser(authentication);
        if (status != null) return billService.getBillsByStatus(user, status);
        return billService.getBillsWithReminder(user);
    }

    @PatchMapping("/{id}/status")
    public Bill updateStatus(@PathVariable Long id,
                             @RequestParam BillStatus status,
                             Authentication authentication) {
        return billService.updateStatus(id, status, getUser(authentication));
    }

    @PatchMapping("/{id}/pay")
    public Bill pay(@PathVariable Long id,
                    @RequestParam Long accountId,
                    @RequestParam(required = false) String otp,
                    Authentication authentication) {
        return billService.payBill(id, accountId, getUser(authentication));
    }

    @PatchMapping("/{id}/auto-pay")
    public Bill autoPay(@PathVariable Long id,
                        @RequestParam boolean enabled,
                        Authentication authentication) {
        return billService.toggleAutoPay(id, enabled, getUser(authentication));
    }

    @GetMapping("/analytics")
    public Map<String, Object> analytics(Authentication authentication) {
        return billService.analytics(getUser(authentication));
    }
}