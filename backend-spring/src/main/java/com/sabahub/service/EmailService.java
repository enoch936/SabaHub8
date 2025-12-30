package com.sabahub.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Email Service using SMTP (Free and enterprise-ready)
 * Supports Gmail, Outlook, and custom SMTP servers
 */
@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@sabahub.com}")
    private String fromEmail;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send OTP via email using SMTP
     */
    public void sendOTPEmail(String toEmail, String otpCode, String userName) {
        log.info("Sending OTP email to: {}", toEmail);
        
        String subject = "Your SabaHub Verification Code";
        String htmlBody = buildOTPEmailHTML(otpCode, userName);
        
        try {
            sendHtmlEmail(toEmail, subject, htmlBody);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {} - Error: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    /**
     * Send password reset email with OTP
     */
    public void sendPasswordResetEmail(String toEmail, String otpCode, String userName) {
        log.info("Sending password reset email to: {}", toEmail);
        
        String subject = "Password Reset Verification - SabaHub";
        String htmlBody = buildPasswordResetEmailHTML(otpCode, userName);
        
        try {
            sendHtmlEmail(toEmail, subject, htmlBody);
            log.info("Password reset email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {} - Error: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    /**
     * Send HTML email using SMTP
     */
    private void sendHtmlEmail(String toEmail, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlBody, true); // true = HTML
        
        mailSender.send(message);
        log.debug("SMTP email sent to: {}", toEmail);
    }

    /**
     * Build HTML template for OTP email
     */
    private String buildOTPEmailHTML(String otpCode, String userName) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }\n" +
                "        .header { color: #333; text-align: center; }\n" +
                "        .otp-box { background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }\n" +
                "        .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 3px; }\n" +
                "        .footer { color: #888; font-size: 12px; text-align: center; margin-top: 20px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">\n" +
                "            <h2>Welcome to SabaHub!</h2>\n" +
                "            <p>Hi " + (userName != null ? userName : "User") + ",</p>\n" +
                "        </div>\n" +
                "        <p>Please use the following code to verify your email address:</p>\n" +
                "        <div class=\"otp-box\">\n" +
                "            <div class=\"otp-code\">" + otpCode + "</div>\n" +
                "        </div>\n" +
                "        <p><strong>⏱️ This code expires in 10 minutes.</strong></p>\n" +
                "        <p style=\"color: #d9534f;\"><strong>⚠️ Do not share this code with anyone.</strong></p>\n" +
                "        <p>If you didn't request this code, please ignore this email.</p>\n" +
                "        <div class=\"footer\">\n" +
                "            <p>© 2025 SabaHub. All rights reserved.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Build HTML template for password reset email
     */
    private String buildPasswordResetEmailHTML(String otpCode, String userName) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }\n" +
                "        .header { color: #333; text-align: center; }\n" +
                "        .otp-box { background-color: #fff3cd; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; border-left: 4px solid #ffc107; }\n" +
                "        .otp-code { font-size: 32px; font-weight: bold; color: #ff6b6b; letter-spacing: 3px; }\n" +
                "        .footer { color: #888; font-size: 12px; text-align: center; margin-top: 20px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">\n" +
                "            <h2>Password Reset Request</h2>\n" +
                "            <p>Hi " + (userName != null ? userName : "User") + ",</p>\n" +
                "        </div>\n" +
                "        <p>You requested to reset your password. Use the following verification code to proceed:</p>\n" +
                "        <div class=\"otp-box\">\n" +
                "            <div class=\"otp-code\">" + otpCode + "</div>\n" +
                "        </div>\n" +
                "        <p><strong>⏱️ This code expires in 10 minutes.</strong></p>\n" +
                "        <p style=\"color: #d9534f;\"><strong>⚠️ If you didn't request this, ignore this email and your password will remain unchanged.</strong></p>\n" +
                "        <div class=\"footer\">\n" +
                "            <p>© 2025 SabaHub. All rights reserved.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
