package com.sabahub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for user registration with OTP verification
 */
public class RegisterWithOTPDTO {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Email OTP is required")
    @Size(min = 6, max = 6, message = "Email OTP must be 6 digits")
    private String emailOTP;

    @NotBlank(message = "SMS OTP is required")
    @Size(min = 6, max = 6, message = "SMS OTP must be 6 digits")
    private String smsOTP;

    // Constructors
    public RegisterWithOTPDTO() {}

    public RegisterWithOTPDTO(String firstName, String lastName, String email, 
                             String phoneNumber, String password, String emailOTP, String smsOTP) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.password = password;
        this.emailOTP = emailOTP;
        this.smsOTP = smsOTP;
    }

    // Getters and Setters
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmailOTP() { return emailOTP; }
    public void setEmailOTP(String emailOTP) { this.emailOTP = emailOTP; }

    public String getSmsOTP() { return smsOTP; }
    public void setSmsOTP(String smsOTP) { this.smsOTP = smsOTP; }
}
