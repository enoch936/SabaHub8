package com.sabahub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/", "/health", "/actuator/health", "/actuator/health/**", "/actuator/info", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**", "/auth/**", "/api/auth/**", "/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/assets/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/assets/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/jobs/**").permitAll() // Development: allow unauthenticated job browse (v1)
                    .requestMatchers(HttpMethod.GET, "/api/v2/jobs/**").permitAll() // Development: allow unauthenticated job browse (v2)
                    .requestMatchers(HttpMethod.GET, "/api/freelancer/featured-reviews").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/freelancer/discover").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/freelancer/seed/featured-reviews").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/jobs/seed").permitAll() // Development: allow job seeding via API
                        .requestMatchers(HttpMethod.POST, "/api/payments/stripe/webhook", "/api/payments/chapa/webhook").permitAll()
                    .requestMatchers("/api/media/**").authenticated()
                    .requestMatchers("/api/chat/**").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/users/**").authenticated()
                        .requestMatchers("/api/user/**").authenticated() // User settings require authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
