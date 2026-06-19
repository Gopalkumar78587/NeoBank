package com.neobank.util;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * EMI calculation using the standard reducing-balance formula:
 *   EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 * where P = principal, r = monthly interest rate (annual / 12 / 100), n = tenure months.
 */
public class EmiCalculatorUtil {

    private EmiCalculatorUtil() {}

    /**
     * Calculate the monthly EMI.
     *
     * @param principal    loan principal amount
     * @param annualRate   annual interest rate as percentage (e.g. 10.0 for 10%)
     * @param tenureMonths loan tenure in months
     * @return EMI rounded to 2 decimal places (HALF_UP)
     */
    public static BigDecimal calculateEMI(BigDecimal principal,
                                          BigDecimal annualRate,
                                          int tenureMonths) {

        // r = annualRate / 12 / 100
        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);

        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            // Zero-interest loan: equal principal instalments
            return principal.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
        }

        // (1 + r)^n  with high precision
        MathContext mc = new MathContext(15, RoundingMode.HALF_UP);
        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal power = onePlusR.pow(tenureMonths, mc);

        // numerator   = P × r × (1+r)^n
        BigDecimal numerator = principal.multiply(monthlyRate).multiply(power);

        // denominator = (1+r)^n − 1
        BigDecimal denominator = power.subtract(BigDecimal.ONE);

        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }
}
