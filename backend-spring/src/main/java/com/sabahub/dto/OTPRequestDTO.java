package com.sabahub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for requesting OTP via email/SMS
 */
public class OTPRequestDTO {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    // Phone number is optional - not all users will provide it
    private String phoneNumber;

    private String firstName;
    private String verificationMethod;
    private String challengeId;

    // Constructors
    public OTPRequestDTO() {}

    public OTPRequestDTO(String email, String phoneNumber, String firstName) {
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.firstName = firstName;
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getVerificationMethod() { return verificationMethod; }
    public void setVerificationMethod(String verificationMethod) { this.verificationMethod = verificationMethod; }

    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String challengeId) { this.challengeId = challengeId; }
}
