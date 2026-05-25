package com.sabahub.service;

import com.sabahub.domain.ChatMessage;
import com.sabahub.domain.Employer;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.Notification;
import org.springframework.stereotype.Service;
import com.sabahub.domain.Project;
import com.sabahub.domain.User;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.NotificationRepository;
import com.sabahub.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmployerRepository employerRepository;
    private final FreelancerRepository freelancerRepository;
    private final CurrentUserService currentUserService;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebPushService webPushService;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               EmployerRepository employerRepository,
                               FreelancerRepository freelancerRepository,
                               CurrentUserService currentUserService,
                               SimpMessagingTemplate messagingTemplate,
                               WebPushService webPushService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.employerRepository = employerRepository;
        this.freelancerRepository = freelancerRepository;
        this.currentUserService = currentUserService;
        this.messagingTemplate = messagingTemplate;
        this.webPushService = webPushService;
    }

    public void sendNotification(String userId, String message, String type) {
        createNotification(userId, normalizeType(type), payload(
                humanizeType(type),
                message,
                "route", "/dashboard/notifications"
        ));
    }

    public void notifyEmployer(String employerId, String message) {
        createNotification(employerId, "EMPLOYER_ALERT", payload(
                "Employer update",
                message,
                "route", "/dashboard/notifications"
        ));
    }

    public void notifyEmployer(String employerId, String subject, String message) {
        createNotification(employerId, "EMPLOYER_ALERT", payload(
                subject,
                message,
                "route", "/dashboard/notifications"
        ));
    }

    public void notifyFreelancer(String freelancerId, String message) {
        createNotification(freelancerId, "FREELANCER_ALERT", payload(
                "Freelancer update",
                message,
                "route", "/dashboard/notifications"
        ));
    }

    public void notifyFreelancer(String freelancerId, String subject, String message) {
        createNotification(freelancerId, "FREELANCER_ALERT", payload(
                subject,
                message,
                "route", "/dashboard/notifications"
        ));
    }

    public void sendKYCSubmissionConfirmation(String employerId, String documentType) {
        createNotification(employerId, "KYC_SUBMITTED", payload(
                "KYC documents submitted",
                "Your verification submission is under review.",
                "documentType", documentType,
                "route", "/dashboard/settings"
        ));
    }

    public void sendKYCInitiationEmail(String employerId, String url) {
        createNotification(employerId, "KYC_REQUIRED", payload(
                "Complete your KYC setup",
                "Finish identity verification to unlock employer workflows.",
                "verificationUrl", url,
                "route", "/dashboard/settings"
        ));
    }

    public void notifyFreelancersOfNewProject(Project project) {
        if (project == null || project.getInvitedFreelancers() == null || project.getInvitedFreelancers().isEmpty()) {
            log.info("Skipping project broadcast notification for project {} because no explicit recipients were provided",
                    project == null ? "unknown" : project.getId());
            return;
        }

        for (String freelancerId : project.getInvitedFreelancers()) {
            createNotification(freelancerId, "PROJECT_INVITATION", payload(
                    "New project invitation",
                    "You were invited to review " + safeLabel(project.getTitle(), "a project") + ".",
                    "projectId", project.getId(),
                    "projectTitle", project.getTitle(),
                    "route", "/freelancer/projects/search"
            ));
        }
    }

    public void sendInvitationToFreelancer(String freelancerId, String projectId) {
        createNotification(freelancerId, "PROJECT_INVITATION", payload(
                "Project invitation",
                "An employer invited you to review a project opportunity.",
                "projectId", projectId,
                "route", "/freelancer/projects/search"
        ));
    }

    public void sendContractToFreelancer(String freelancerId, String contractId) {
        createNotification(freelancerId, "CONTRACT_READY", payload(
                "Contract ready for review",
                "A new contract is waiting for your review.",
                "contractId", contractId,
                "route", "/dashboard/contracts"
        ));
    }

    public void sendHiringConfirmationToEmployer(String employerId, String contractId) {
        createNotification(employerId, "HIRING_CONFIRMED", payload(
                "Freelancer hired",
                "The hiring workflow completed and the contract is now available.",
                "contractId", contractId,
                "route", "/dashboard/contracts"
        ));
    }

    public void sendMilestoneReleasedNotification(String freelancerId, String milestoneId) {
        createNotification(freelancerId, "MILESTONE_RELEASED", payload(
                "Milestone released",
                "A payment milestone has been released.",
                "milestoneId", milestoneId,
                "route", "/dashboard/contracts"
        ));
    }

    public void sendRatingNotificationToFreelancer(String freelancerId, Double rating, String feedback) {
        createNotification(freelancerId, "NEW_RATING", payload(
                "New client rating",
                "You received a new rating" + (rating == null ? "." : " of " + rating + " stars."),
                "rating", rating,
                "feedback", feedback,
                "route", "/freelancer/profile"
        ));
    }

    public void notifyVendor(String vendorId, String message, String type) {
        sendNotification(vendorId, message, type);
    }

    public void notifyJobPublished(String employerId, String jobId) {
        createNotification(employerId, "JOB_PUBLISHED", payload(
                "Job published",
                "Your job is now live and ready to receive proposals.",
                "jobId", jobId,
                "route", "/dashboard/jobs"
        ));
    }

    public void notifyChatThreadCreated(String recipientRef, String threadId, String initiatorRef) {
        createNotification(recipientRef, "CONTACT", payload(
                "New contact",
                resolveDisplayName(initiatorRef) + " started a conversation with you.",
                "threadId", threadId,
                "actorId", resolveUserId(initiatorRef),
                "route", "/chat"
        ));
    }

    public void notifyChatMessage(String recipientRef, String threadId, String senderRef, ChatMessage message) {
        String preview = message != null && message.getType() == ChatMessage.Type.ASSET
                ? "sent an attachment."
                : abbreviate(message == null ? null : message.getText(), 120);

        createNotification(recipientRef, "CHAT_MESSAGE", payload(
                "New chat message",
                resolveDisplayName(senderRef) + ": " + safeLabel(preview, "sent you a message."),
                "threadId", threadId,
                "actorId", resolveUserId(senderRef),
                "route", "/chat"
        ));
    }

    public void notifyProposalSubmitted(String employerRef, String jobId, String jobTitle, String freelancerRef, Double bidAmount) {
        createNotification(employerRef, "PROPOSAL_SUBMITTED", payload(
                "New proposal received",
                resolveDisplayName(freelancerRef) + " submitted a proposal for " + safeLabel(jobTitle, "your job") + ".",
                "jobId", jobId,
                "jobTitle", jobTitle,
                "freelancerId", resolveUserId(freelancerRef),
                "bidAmount", bidAmount,
                "route", "/employer/proposals"
        ));
    }

    public void notifyProposalAccepted(String freelancerRef, String proposalId, String jobId, String jobTitle, String employerRef, String contractId) {
        createNotification(freelancerRef, "PROPOSAL_ACCEPTED", payload(
                "Proposal accepted",
                resolveDisplayName(employerRef) + " accepted your proposal for " + safeLabel(jobTitle, "a job") + ".",
                "proposalId", proposalId,
                "jobId", jobId,
                "jobTitle", jobTitle,
                "employerId", resolveUserId(employerRef),
                "contractId", contractId,
                "route", "/dashboard/contracts"
        ));
    }

    public void notifyProposalRejected(String freelancerRef, String proposalId, String jobId, String jobTitle, String employerRef) {
        createNotification(freelancerRef, "PROPOSAL_REJECTED", payload(
                "Proposal not accepted",
                resolveDisplayName(employerRef) + " did not accept your proposal for " + safeLabel(jobTitle, "a job") + ".",
                "proposalId", proposalId,
                "jobId", jobId,
                "jobTitle", jobTitle,
                "employerId", resolveUserId(employerRef),
                "route", "/jobs/proposals"
        ));
    }

    public void notifyProposalCancelled(String freelancerRef, String proposalId, String jobId, String jobTitle, String employerRef, String contractId) {
        createNotification(freelancerRef, "PROPOSAL_CANCELLED", payload(
                "Proposal or contract cancelled",
                resolveDisplayName(employerRef) + " cancelled the accepted proposal flow for " + safeLabel(jobTitle, "a job") + ".",
                "proposalId", proposalId,
                "jobId", jobId,
                "jobTitle", jobTitle,
                "employerId", resolveUserId(employerRef),
                "contractId", contractId,
                "route", "/jobs/proposals"
        ));
    }

    public void sendSecurityAlert(String userId, String title, String message, String priority) {
        createNotification(userId, "SECURITY_ALERT", payload(
                title,
                message,
                "category", "security",
                "priority", priority != null ? priority : "high",
                "route", "/admin/security-governance"
        ));
    }

    public void sendPaymentAlert(String userId, String title, String message) {
        createNotification(userId, "PAYMENT_ALERT", payload(
                title,
                message,
                "category", "payment",
                "priority", "medium",
                "route", "/admin/financial-operations"
        ));
    }

    public void sendSystemFailure(String userId, String title, String message) {
        createNotification(userId, "SYSTEM_FAILURE", payload(
                title,
                message,
                "category", "system",
                "priority", "critical",
                "route", "/admin/platform-control"
        ));
    }

    public void sendAIWarning(String userId, String title, String message) {
        createNotification(userId, "AI_WARNING", payload(
                title,
                message,
                "category", "ai",
                "priority", "medium",
                "route", "/admin/ai-models"
        ));
    }

    public void sendModerationAlert(String userId, String title, String message) {
        createNotification(userId, "MODERATION_ALERT", payload(
                title,
                message,
                "category", "user",
                "priority", "high",
                "route", "/admin/content-moderation"
        ));
    }

    public void sendUserReport(String userId, String title, String message) {
        createNotification(userId, "USER_REPORT", payload(
                title,
                message,
                "category", "user",
                "priority", "high",
                "route", "/admin/disputes"
        ));
    }

    public List<Notification> listMyNotifications() {
        User me = currentUserService.requireUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(me.getId());
    }

    public long countMyUnreadNotifications() {
        User me = currentUserService.requireUser();
        return notificationRepository.countByUserIdAndReadFalse(me.getId());
    }

    public Notification markRead(String notificationId) {
        User me = currentUserService.requireUser();
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, me.getId())
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            return notificationRepository.save(notification);
        }

        return notification;
    }

    public int markAllRead() {
        User me = currentUserService.requireUser();
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(me.getId());
        if (unread.isEmpty()) {
            return 0;
        }

        unread.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unread);
        return unread.size();
    }

    public Notification createNotification(String recipientRef, String type, Map<String, Object> payload) {
        Optional<User> recipient = resolveRecipient(recipientRef);
        if (recipient.isEmpty()) {
            log.warn("Skipping notification {} for unresolved recipient {}", type, recipientRef);
            return null;
        }

        Notification notification = new Notification();
        notification.setUserId(recipient.get().getId());
        notification.setType(normalizeType(type));
        notification.setPayload(payload == null ? Map.of() : new LinkedHashMap<>(payload));
        notification.setRead(false);
        notification.setCreatedAt(Instant.now());

        Notification saved = notificationRepository.save(notification);
        pushToUser(recipient.get(), saved);
        return saved;
    }

    private void pushToUser(User recipient, Notification notification) {
        webPushService.sendToUser(recipient, notification);

        if (recipient.getEmail() == null || recipient.getEmail().isBlank()) {
            return;
        }

        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/notifications", notification);
    }

    private Optional<User> resolveRecipient(String recipientRef) {
        if (recipientRef == null || recipientRef.isBlank()) {
            return Optional.empty();
        }

        Optional<User> directUser = userRepository.findById(recipientRef);
        if (directUser.isPresent()) {
            return directUser;
        }

        Optional<User> byEmail = userRepository.findByEmail(recipientRef);
        if (byEmail.isPresent()) {
            return byEmail;
        }

        Optional<Employer> employer = employerRepository.findById(recipientRef);
        if (employer.isPresent() && employer.get().getUserId() != null) {
            return userRepository.findById(employer.get().getUserId());
        }

        Optional<Freelancer> freelancer = freelancerRepository.findById(recipientRef);
        if (freelancer.isPresent() && freelancer.get().getUserId() != null) {
            return userRepository.findById(freelancer.get().getUserId());
        }

        return Optional.empty();
    }

    private String resolveUserId(String userRef) {
        return resolveRecipient(userRef).map(User::getId).orElse(userRef);
    }

    private String resolveDisplayName(String userRef) {
        return resolveRecipient(userRef)
                .map(this::displayName)
                .orElse(fallbackLabel(userRef));
    }

    private String displayName(User user) {
        if (user == null) {
            return "Someone";
        }

        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName().trim();
        }

        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return "@" + user.getUsername().trim();
        }

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim();
        }

        return fallbackLabel(user.getId());
    }

    private String fallbackLabel(String value) {
        if (value == null || value.isBlank()) {
            return "Someone";
        }

        return value.length() <= 8 ? value : value.substring(0, 8);
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return "GENERAL";
        }

        return type.trim()
                .toUpperCase(Locale.ROOT)
                .replace(' ', '_')
                .replace('-', '_');
    }

    private String humanizeType(String type) {
        return normalizeType(type).replace('_', ' ');
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }

        return trimmed.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String safeLabel(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private Map<String, Object> payload(String title, String message, Object... extras) {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("title", title);
        payload.put("message", message);

        for (int i = 0; i + 1 < extras.length; i += 2) {
            Object key = extras[i];
            Object value = extras[i + 1];
            if (!(key instanceof String stringKey) || value == null) {
                continue;
            }
            payload.put(stringKey, value);
        }

        return payload;
    }
}
