package com.caretriage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CaretriageApplication {
    public static void main(String[] args) {
        SpringApplication.run(CaretriageApplication.class, args);
    }
}
