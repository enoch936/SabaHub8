package com.sabahub.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;

@Configuration
@EnableTransactionManagement
@ConditionalOnProperty(name = "sabahub.payment.store", havingValue = "postgres")
public class PaymentPostgresConfig {

    @Bean(destroyMethod = "close")
    public DataSource paymentDataSource(
            @Value("${sabahub.payment.postgres.url:}") String url,
            @Value("${sabahub.payment.postgres.username:}") String username,
            @Value("${sabahub.payment.postgres.password:}") String password,
            @Value("${sabahub.payment.postgres.max-pool-size:10}") int maxPoolSize,
            @Value("${sabahub.payment.postgres.connection-timeout-ms:5000}") long connectionTimeoutMs) {
        if (url == null || url.isBlank()) {
            throw new IllegalStateException(
                    "sabahub.payment.postgres.url is required when sabahub.payment.store=postgres");
        }
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url.trim());
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(Math.max(1, maxPoolSize));
        config.setConnectionTimeout(Math.max(1000, connectionTimeoutMs));
        config.setPoolName("sabahub-payment-pg");
        config.setAutoCommit(false);
        return new HikariDataSource(config);
    }

    @Bean
    public JdbcTemplate paymentJdbcTemplate(DataSource paymentDataSource) {
        return new JdbcTemplate(paymentDataSource);
    }

    @Bean
    public PlatformTransactionManager transactionManager(DataSource paymentDataSource) {
        return new DataSourceTransactionManager(paymentDataSource);
    }

    @Bean
    public ResourceDatabasePopulator paymentSchemaPopulator() {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(
                new ClassPathResource("db/payment-schema.sql"));
        populator.setContinueOnError(false);
        return populator;
    }
}
