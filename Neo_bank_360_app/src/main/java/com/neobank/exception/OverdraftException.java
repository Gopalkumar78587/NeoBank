package com.neobank.exception;

public class OverdraftException extends RuntimeException {

    public OverdraftException(String message) {
        super(message);
    }

    public OverdraftException() {
        super("Insufficient balance");
    }
}
