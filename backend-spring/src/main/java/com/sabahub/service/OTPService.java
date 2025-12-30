package com.sabahub.service;

import com.sabahub.domain.OTP;
import com.sabahub.repository.OTPRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * OTP Service - Manages generation, validation, and storage of OTPs
 */
@Slf4j
@Service
public class OTPService {

    private final OTPRepository otpRepository;

    public OTPService(OTPRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    /**
     * Generate and save OTP for email/phone
     */
    public OTP generateOTP(String identifier, OTP.OTPType type, OTP.OTPPurpose purpose) {
        log.info("Generating OTP for identifier: {} with type: {}", identifier, type);
        
        // Generate 6-digit OTP
        String otpCode = RandomStringUtils.randomNumeric(6);
        
        OTP otp = new OTP(identifier, otpCode, type, purpose);
        OTP savedOTP = otpRepository.save(otp);
        
        log.info("OTP generated and saved for identifier: {}", identifier);
        return savedOTP;
    }

    /**
     * Verify OTP code
     */
    public boolean verifyOTP(String identifier, String otpCode) {
        log.info("Verifying OTP for identifier: {}", identifier);
        
        Optional<OTP> otpOptional = otpRepository.findByIdentifierAndOtpCode(identifier, otpCode);
        
        if (otpOptional.isEmpty()) {
            log.warn("OTP not found for identifier: {}", identifier);
            return false;
        }

        OTP otp = otpOptional.get();

        // Check if OTP is blocked
        if (otp.getStatus() == OTP.OTPStatus.BLOCKED) {
            log.warn("OTP is blocked for identifier: {} (max attempts reached)", identifier);
            return false;
        }

        // Check if already verified
        if (otp.getStatus() == OTP.OTPStatus.VERIFIED) {
            log.warn("OTP already verified for identifier: {}", identifier);
            return false;
        }

        // Check if expired
        if (otp.isExpired()) {
            log.warn("OTP expired for identifier: {}", identifier);
            otp.setStatus(OTP.OTPStatus.EXPIRED);
            otpRepository.save(otp);
            return false;
        }

        // Verify OTP
        otp.verify();
        otpRepository.save(otp);
        log.info("OTP verified successfully for identifier: {}", identifier);
        return true;
    }

    /**
     * Verify OTP with attempt tracking
     */
    public boolean verifyOTPWithAttempts(String identifier, String otpCode) {
        log.info("Verifying OTP with attempt tracking for identifier: {}", identifier);
        
        Optional<OTP> otpOptional = otpRepository.findByIdentifierAndOtpCode(identifier, otpCode);
        
        if (otpOptional.isEmpty()) {
            log.warn("OTP not found for identifier: {}", identifier);
            return false;
        }

        OTP otp = otpOptional.get();

        // Check if blocked
        if (otp.getStatus() == OTP.OTPStatus.BLOCKED) {
            log.warn("OTP is blocked - max attempts reached for: {}", identifier);
            throw new RuntimeException("OTP is blocked. Please request a new OTP.");
        }

        // Check if already verified
        if (otp.getStatus() == OTP.OTPStatus.VERIFIED) {
            log.warn("OTP already verified for: {}", identifier);
            return true; // Allow re-verification
        }

        // Check if expired
        if (otp.isExpired()) {
            log.warn("OTP expired for: {}", identifier);
            otp.setStatus(OTP.OTPStatus.EXPIRED);
            otpRepository.save(otp);
            return false;
        }

        // Verify OTP
        otp.verify();
        otpRepository.save(otp);
        log.info("OTP verified with attempt tracking for: {}", identifier);
        return true;
    }

    /**
     * Handle failed OTP verification attempt
     */
    public void recordFailedAttempt(String identifier, String otpCode) {
        log.warn("Recording failed OTP attempt for identifier: {}", identifier);
        
        Optional<OTP> otpOptional = otpRepository.findByIdentifierAndOtpCode(identifier, otpCode);
        
        if (otpOptional.isPresent()) {
            OTP otp = otpOptional.get();
            otp.incrementAttempts();
            otpRepository.save(otp);
            
            if (otp.getStatus() == OTP.OTPStatus.BLOCKED) {
                log.error("OTP blocked for identifier: {} (max attempts reached)", identifier);
            }
        }
    }

    /**
     * Get OTP by identifier (latest)
     */
    public Optional<OTP> getLatestOTP(String identifier) {
        return otpRepository.findFirstByIdentifierOrderByCreatedAtDesc(identifier);
    }

    /**
     * Check if OTP is valid (not expired, not blocked)
     */
    public boolean isOTPValid(String identifier) {
        Optional<OTP> otpOptional = getLatestOTP(identifier);
        return otpOptional.map(OTP::isValid).orElse(false);
    }

    /**
     * Resend OTP - Generate new OTP for identifier
     */
    public OTP resendOTP(String identifier, OTP.OTPType type, OTP.OTPPurpose purpose) {
        log.info("Resending OTP for identifier: {}", identifier);
        
        // Invalidate old OTP
        Optional<OTP> oldOtpOptional = getLatestOTP(identifier);
        if (oldOtpOptional.isPresent()) {
            OTP oldOtp = oldOtpOptional.get();
            oldOtp.setStatus(OTP.OTPStatus.EXPIRED);
            otpRepository.save(oldOtp);
        }
        
        // Generate new OTP
        return generateOTP(identifier, type, purpose);
    }

    /**
     * Delete OTP by ID
     */
    public void deleteOTP(String otpId) {
        log.info("Deleting OTP with ID: {}", otpId);
        otpRepository.deleteById(otpId);
    }

    /**
     * Cleanup expired OTPs - scheduled task
     */
    @Scheduled(fixedDelay = 3600000) // Every hour
    public void cleanupExpiredOTPs() {
        log.info("Cleaning up expired OTPs");
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        otpRepository.deleteByExpiresAtBefore(oneHourAgo);
        log.info("Expired OTPs cleanup completed");
    }

    /**
     * Get OTP status
     */
    public OTP.OTPStatus getOTPStatus(String identifier) {
        Optional<OTP> otpOptional = getLatestOTP(identifier);
        return otpOptional.map(OTP::getStatus).orElse(null);
    }
}
