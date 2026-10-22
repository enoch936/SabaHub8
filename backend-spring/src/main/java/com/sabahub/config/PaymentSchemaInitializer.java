package com.sabahub.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sabahub.payment.store", havingValue = "postgres")
public class PaymentSchemaInitializer implements ApplicationRunner {

    private final DataSource paymentDataSource;
    private final ResourceDatabasePopulator paymentSchemaPopulator;

    @Override
    public void run(ApplicationArguments args) {
        paymentSchemaPopulator.execute(paymentDataSource);
        log.info("PostgreSQL payment ledger schema is ready");
    }
}
