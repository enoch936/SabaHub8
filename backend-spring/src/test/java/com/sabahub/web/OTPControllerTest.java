package com.sabahub.web;

import com.sabahub.domain.OTP;
import com.sabahub.dto.OTPRequestDTO;
import com.sabahub.dto.OTPVerificationDTO;
import com.sabahub.dto.OTPVerificationPhoneDTO;
import com.sabahub.service.AuthService;
import com.sabahub.service.EmailService;
import com.sabahub.service.OTPService;
import com.sabahub.service.SMSService;
import com.sabahub.service.SessionTrackingService;
import com.sabahub.service.VerificationChallengeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OTPControllerTest {

    @Mock
    private OTPService otpService;

    @Mock
    private EmailService emailService;

    @Mock
    private SMSService smsService;

    @Mock
    private AuthService authService;

    @Mock
    private SessionTrackingService sessionTrackingService;

    @Mock
    private VerificationChallengeService verificationChallengeService;

    private OTPController otpController;

    @BeforeEach
    void setUp() {
        otpController = new OTPController(
                otpService,
                emailService,
                smsService,
                authService,
                sessionTrackingService,
                verificationChallengeService
        );
    }

    @Test
    void requestRegistrationOtp_emailModeSendsOnlyEmailAndReturnsChallengeId() {
        OTPRequestDTO request = new OTPRequestDTO();
        request.setEmail("test@sabahub.test");
        request.setFirstName("Test");
        request.setVerificationMethod("EMAIL");

        when(emailService.isConfigured()).thenReturn(true);
        when(otpService.generateOTP("test@sabahub.test", OTP.OTPType.EMAIL, OTP.OTPPurpose.REGISTRATION))
                .thenReturn(new OTP("test@sabahub.test", "123456", OTP.OTPType.EMAIL, OTP.OTPPurpose.REGISTRATION));
        when(verificationChallengeService.createRegistrationChallenge("test@sabahub.test", null, "EMAIL"))
                .thenReturn("reg-1");

        ResponseEntity<?> response = otpController.requestRegistrationOTP(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        OTPController.ApiResponse body = (OTPController.ApiResponse) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        assertThat(body.getData()).isEqualTo(Map.of("challengeId", "reg-1", "verificationMethod", "EMAIL"));
        verify(emailService).sendOTPEmail("test@sabahub.test", "123456", "Test");
        verify(smsService, never()).sendVerificationCode(anyString());
    }

    @Test
    void requestRegistrationOtp_phoneModeRejectsMissingPhoneNumber() {
        OTPRequestDTO request = new OTPRequestDTO();
        request.setEmail("test@sabahub.test");
        request.setVerificationMethod("PHONE");

        ResponseEntity<?> response = otpController.requestRegistrationOTP(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        OTPController.ApiResponse body = (OTPController.ApiResponse) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getMessage()).isEqualTo("Phone number is required for phone verification.");
    }

    @Test
    void requestRegistrationOtp_bothModeSendsEmailAndPhoneCodes() {
        OTPRequestDTO request = new OTPRequestDTO();
        request.setEmail("test@sabahub.test");
        request.setPhoneNumber("+251911223344");
        request.setFirstName("Test");
        request.setVerificationMethod("EMAIL+PHONE");

        when(emailService.isConfigured()).thenReturn(true);
        when(smsService.isConfigured()).thenReturn(true);
        when(smsService.isValidPhoneNumber("+251911223344")).thenReturn(true);
        when(otpService.generateOTP("test@sabahub.test", OTP.OTPType.EMAIL, OTP.OTPPurpose.REGISTRATION))
                .thenReturn(new OTP("test@sabahub.test", "123456", OTP.OTPType.EMAIL, OTP.OTPPurpose.REGISTRATION));
        when(verificationChallengeService.createRegistrationChallenge("test@sabahub.test", "+251911223344", "EMAIL+PHONE"))
                .thenReturn("reg-both");

        ResponseEntity<?> response = otpController.requestRegistrationOTP(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        OTPController.ApiResponse body = (OTPController.ApiResponse) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        assertThat(body.getData()).isEqualTo(Map.of("challengeId", "reg-both", "verificationMethod", "EMAIL+PHONE"));
        verify(emailService).sendOTPEmail("test@sabahub.test", "123456", "Test");
        verify(smsService).sendVerificationCode("+251911223344");
    }

    @Test
    void verifySmsOtp_marksPhoneChannelVerifiedUsingSmsService() {
        OTPVerificationPhoneDTO request = new OTPVerificationPhoneDTO();
        request.setChallengeId("reg-1");
        request.setPhoneNumber("+251911223344");
        request.setOtpCode("123456");

        when(verificationChallengeService.requireRegistrationChallenge("reg-1"))
                .thenReturn(new VerificationChallengeService.RegistrationChallenge(
                        "test@sabahub.test",
                        "+251911223344",
                        "PHONE",
                        false,
                        false
                ));
        when(smsService.verifyCode("+251911223344", "123456")).thenReturn(true);

        ResponseEntity<?> response = otpController.verifySMSOTP(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(verificationChallengeService).markRegistrationChannelVerified("reg-1", "PHONE");
        verify(smsService).verifyCode("+251911223344", "123456");
        verify(otpService, never()).verifyOTPWithAttempts(eq("+251911223344"), eq("123456"), eq(OTP.OTPPurpose.REGISTRATION));
    }

    @Test
    void verifyEmailOtp_acceptsCombinedRegistrationChallenge() {
        OTPVerificationDTO request = new OTPVerificationDTO();
        request.setChallengeId("reg-both");
        request.setEmail("test@sabahub.test");
        request.setOtpCode("654321");

        when(verificationChallengeService.requireRegistrationChallenge("reg-both"))
                .thenReturn(new VerificationChallengeService.RegistrationChallenge(
                        "test@sabahub.test",
                        "+251911223344",
                        "EMAIL+PHONE",
                        false,
                        false
                ));
        when(otpService.verifyOTPWithAttempts("test@sabahub.test", "654321", OTP.OTPPurpose.REGISTRATION))
                .thenReturn(true);

        ResponseEntity<?> response = otpController.verifyEmailOTP(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(verificationChallengeService).markRegistrationChannelVerified("reg-both", "EMAIL");
        verify(otpService).verifyOTPWithAttempts("test@sabahub.test", "654321", OTP.OTPPurpose.REGISTRATION);
    }
}
