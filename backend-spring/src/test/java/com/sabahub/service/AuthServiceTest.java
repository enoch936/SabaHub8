package com.sabahub.service;

import com.sabahub.config.JwtService;
import com.sabahub.domain.OTP;
import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.AuthRequest;
import com.sabahub.web.dto.AuthResponse;
import com.sabahub.web.dto.LoginResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuditService auditService;

    @Mock
    private OTPService otpService;

    @Mock
    private EmailService emailService;

    @Mock
    private SMSService smsService;

    @Mock
    private VerificationChallengeService verificationChallengeService;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_createsChallengeBeforeSendingBothModeOtpWhenProfileRequiresBothChannels() {
        User user = buildUser("BOTH", true, true, true);
        OTP emailOtp = new OTP(user.getEmail(), "123456", OTP.OTPType.EMAIL, OTP.OTPPurpose.LOGIN);

        when(userRepository.findByUsername("builder")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(user.getEmail(), null));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(emailService.isConfigured()).thenReturn(true);
        when(smsService.isConfigured()).thenReturn(true);
        when(smsService.isValidPhoneNumber("+251911223344")).thenReturn(true);
        when(otpService.generateOTP(user.getEmail(), OTP.OTPType.EMAIL, OTP.OTPPurpose.LOGIN)).thenReturn(emailOtp);
        when(verificationChallengeService.createLoginChallenge(user.getEmail(), "BOTH")).thenReturn("challenge-1");

        LoginResponse response = authService.login(new AuthRequest("builder", "password123"));

        assertThat(response.requiresTwoFactor()).isTrue();
        assertThat(response.challengeId()).isEqualTo("challenge-1");
        assertThat(response.twoFactorMethod()).isEqualTo("BOTH");

        InOrder inOrder = inOrder(verificationChallengeService, smsService, emailService);
        inOrder.verify(verificationChallengeService).createLoginChallenge(user.getEmail(), "BOTH");
        inOrder.verify(smsService).sendVerificationCode("+251911223344");
        inOrder.verify(emailService).sendOTPEmail(user.getEmail(), "123456", user.getFullName());
    }

    @Test
    void login_doesNotSendOtpWhenChallengeCannotBeCreated() {
        User user = buildUser("BOTH", true, true, true);

        when(userRepository.findByUsername("builder")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(user.getEmail(), null));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(verificationChallengeService.createLoginChallenge(user.getEmail(), "BOTH"))
                .thenThrow(new IllegalStateException("Unable to persist verification challenge"));

        assertThatThrownBy(() -> authService.login(new AuthRequest("builder", "password123")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Unable to persist verification challenge");

        verify(smsService, never()).sendVerificationCode(anyString());
        verify(emailService, never()).sendOTPEmail(anyString(), anyString(), anyString());
    }

    @Test
    void login_fallsBackToEmailWhenPhoneModeIsConfiguredButOnlyEmailIsVerified() {
        User user = buildUser("PHONE", true, false, true);
        OTP emailOtp = new OTP(user.getEmail(), "123456", OTP.OTPType.EMAIL, OTP.OTPPurpose.LOGIN);

        when(userRepository.findByUsername("builder")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(user.getEmail(), null));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(emailService.isConfigured()).thenReturn(true);
        when(otpService.generateOTP(user.getEmail(), OTP.OTPType.EMAIL, OTP.OTPPurpose.LOGIN)).thenReturn(emailOtp);
        when(verificationChallengeService.createLoginChallenge(user.getEmail(), "EMAIL")).thenReturn("challenge-1");

        LoginResponse response = authService.login(new AuthRequest("builder", "password123"));

        assertThat(response.requiresTwoFactor()).isTrue();
        assertThat(response.challengeId()).isEqualTo("challenge-1");
        assertThat(response.twoFactorMethod()).isEqualTo("EMAIL");
        verify(smsService, never()).sendVerificationCode(anyString());
        verify(emailService).sendOTPEmail(user.getEmail(), "123456", user.getFullName());
    }

    @Test
    void login_fallsBackToPhoneWhenEmailModeIsConfiguredButOnlyPhoneIsVerified() {
        User user = buildUser("EMAIL", false, true, true);

        when(userRepository.findByUsername("builder")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(user.getEmail(), null));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(smsService.isConfigured()).thenReturn(true);
        when(smsService.isValidPhoneNumber("+251911223344")).thenReturn(true);
        when(verificationChallengeService.createLoginChallenge(user.getEmail(), "PHONE")).thenReturn("challenge-1");

        LoginResponse response = authService.login(new AuthRequest("builder", "password123"));

        assertThat(response.requiresTwoFactor()).isTrue();
        assertThat(response.challengeId()).isEqualTo("challenge-1");
        assertThat(response.twoFactorMethod()).isEqualTo("PHONE");
        verify(smsService).sendVerificationCode("+251911223344");
        verify(emailService, never()).sendOTPEmail(anyString(), anyString(), anyString());
    }

    @Test
    void login_rejectsTwoFactorWhenNoVerifiedChannelIsAvailable() {
        User user = buildUser("PHONE", false, false, true);

        when(userRepository.findByUsername("builder")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(user.getEmail(), null));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new AuthRequest("builder", "password123")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("2-step verification is enabled but no verified email or phone is available");

        verify(verificationChallengeService, never()).createLoginChallenge(anyString(), anyString());
        verify(smsService, never()).sendVerificationCode(anyString());
        verify(emailService, never()).sendOTPEmail(anyString(), anyString(), anyString());
    }

    @Test
    void verifyLoginTwoFactor_rejectsMissingPhoneCodeWhenBothModeIsConfigured() {
        User user = buildUser("BOTH", true, true, true);

        when(verificationChallengeService.requireLoginChallenge("challenge-1"))
                .thenReturn(new VerificationChallengeService.LoginChallenge(
                        user.getEmail(),
                        "BOTH",
                        List.of("EMAIL", "PHONE")
                ));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(otpService.verifyOTPWithAttempts(user.getEmail(), "111111", OTP.OTPPurpose.LOGIN)).thenReturn(true);

        assertThatThrownBy(() -> authService.verifyLoginTwoFactor("challenge-1", null, "111111", null, null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Phone OTP is required");

        verify(verificationChallengeService, never()).deleteLoginChallenge(anyString());
    }

    @Test
    void verifyLoginTwoFactor_acceptsBothCodesAndIssuesToken() {
        User user = buildUser("BOTH", true, true, true);

        when(verificationChallengeService.requireLoginChallenge("challenge-1"))
                .thenReturn(new VerificationChallengeService.LoginChallenge(
                        user.getEmail(),
                        "BOTH",
                        List.of("EMAIL", "PHONE")
                ));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(otpService.verifyOTPWithAttempts(user.getEmail(), "111111", OTP.OTPPurpose.LOGIN)).thenReturn(true);
        when(smsService.verifyCode("+251911223344", "222222")).thenReturn(true);
        when(jwtService.generateToken(eq(user.getEmail()), anyMap())).thenReturn("jwt-token");

        AuthResponse response = authService.verifyLoginTwoFactor("challenge-1", null, "111111", "222222", null, null, null);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo(user.getEmail());
        verify(verificationChallengeService).deleteLoginChallenge("challenge-1");
    }

    private User buildUser(String twoFactorMethod, boolean emailVerified, boolean phoneVerified, boolean twoFactorEnabled) {
        User user = new User("builder@sabahub.test", "builder", "Builder User", "hashed", Set.of("ROLE_FREELANCER"));
        user.setId("user-1");

        UserProfile profile = new UserProfile();
        profile.setPhoneNumber("+251911223344");
        profile.setTwoFactorMethod(twoFactorMethod);
        profile.setTwoFactorEnabled(twoFactorEnabled);
        profile.setEmailVerified(emailVerified);
        profile.setPhoneVerified(phoneVerified);
        user.setProfile(profile);
        return user;
    }
}
