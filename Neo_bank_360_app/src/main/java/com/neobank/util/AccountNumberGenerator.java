package com.neobank.util;

import java.time.Year;
import java.util.Random;

public class AccountNumberGenerator {

    private static final Random RANDOM = new Random();

    // ✅ STORED ACCOUNT NUMBER (FULL)
    public static String generate() {
        int year = Year.now().getValue();
        return "NB" + year +
                random4() +
                random4() +
                random4();
    }

    private static int random4() {
        return 1000 + RANDOM.nextInt(9000);
    }

    // ✅ MASK FOR UI
    public static String mask(String accountNumber) {
        return "NB****" + accountNumber.substring(accountNumber.length() - 4);
    }
}
