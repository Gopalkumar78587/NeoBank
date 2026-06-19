package com.neobank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableAsync
public class NeoBank360AppApplication {

	public static void main(String[] args) {
		SpringApplication.run(NeoBank360AppApplication.class, args);
	}

}
