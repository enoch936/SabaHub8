package com.sabahub.repository;

import com.sabahub.domain.OTP;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OTPRepository extends MongoRepository<OTP, String> {
    
    // Find latest OTP for an identifier (email or phone)
    Optional<OTP> findFirstByIdentifierOrderByCreatedAtDesc(String identifier);
    
    // Find OTP by identifier and code
    Optional<OTP> findByIdentifierAndOtpCode(String identifier, String otpCode);
    
    // Find pending OTP for verification
    Optional<OTP> findByIdentifierAndOtpCodeAndStatus(String identifier, String otpCode, OTP.OTPStatus status);
    
    // Find all OTPs for an identifier by purpose
    List<OTP> findByIdentifierAndPurpose(String identifier, OTP.OTPPurpose purpose);
    
    // Find expired OTPs for cleanup
    @Query("{ 'expiresAt': { $lt: ?0 } }")
    List<OTP> findExpiredOTPs(LocalDateTime dateTime);
    
    // Find blocked OTPs (reached max attempts)
    List<OTP> findByStatus(OTP.OTPStatus status);
    
    // Delete expired OTPs (housekeeping)
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}
