package com.sabahub.service;

import com.sabahub.domain.Employer;
import com.sabahub.domain.User;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployerWorkspaceService {

    private static final List<String> ALLOWED_TEAM_ROLES = List.of("ADMIN", "RECRUITER", "VIEWER");

    private final EmployerRepository employerRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public Employer getOrCreateEmployerForCurrentUser() {
        User user = currentUserService.requireUser();
        currentUserService.requireEmployerMode(user);

        return employerRepository.findByUserId(user.getId())
                .map(employer -> ensureWorkspaceData(employer, user))
            .or(() -> employerRepository.findByTeamMembersUserId(user.getId())
                .map(this::ensureWorkspaceDataForMemberAccess))
                .orElseGet(() -> createEmployerWorkspace(user));
    }

    public TeamSnapshot getTeamSnapshot() {
        User user = currentUserService.requireUser();
        Employer employer = getOrCreateEmployerForCurrentUser();

        String teamName = resolveTeamName(employer, user);
        List<Employer.TeamMember> members = sortedMembers(employer.getTeamMembers());

        return new TeamSnapshot(
                employer.getId(),
                teamName,
                employer.getUserId(),
                employer.getCreatedAt(),
                members,
                sortedActivities(employer.getTeamActivities())
        );
    }

    public Employer.TeamMember inviteMember(String email, String role) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String normalizedRole = normalizeRole(role);

        User actor = currentUserService.requireUser();
        Employer employer = getOrCreateEmployerForCurrentUser();
        requireTeamAdmin(actor, employer);

        List<Employer.TeamMember> members = employer.getTeamMembers();
        if (members == null) {
            members = new ArrayList<>();
            employer.setTeamMembers(members);
        }

        boolean duplicate = members.stream()
                .anyMatch(member -> normalizedEmail.equalsIgnoreCase(defaultString(member.getEmail())));
        if (duplicate) {
            throw new IllegalStateException("This email is already in your team.");
        }

        User existingUser = userRepository.findByEmail(normalizedEmail).orElse(null);
        String memberName = existingUser != null && existingUser.getFullName() != null && !existingUser.getFullName().isBlank()
                ? existingUser.getFullName()
                : extractName(normalizedEmail);

        Employer.TeamMember member = Employer.TeamMember.builder()
                .userId(existingUser != null ? existingUser.getId() : "invited-" + UUID.randomUUID())
                .name(memberName)
                .email(normalizedEmail)
                .teamRole(normalizedRole)
                .joinedAt(LocalDateTime.now())
                .build();

        members.add(member);
        appendActivity(employer, "joined", member.getName(), null);
        Employer saved = employerRepository.save(employer);

        return findMember(saved, member.getUserId())
                .orElse(member);
    }

    public Employer.TeamMember updateMemberRole(String userId, String role) {
        String normalizedRole = normalizeRole(role);

        User actor = currentUserService.requireUser();
        Employer employer = getOrCreateEmployerForCurrentUser();
        requireTeamAdmin(actor, employer);

        if (employer.getUserId().equals(userId)) {
            throw new IllegalStateException("Cannot change the owner role.");
        }

        Employer.TeamMember member = findMember(employer, userId)
                .orElseThrow(() -> new IllegalStateException("Team member not found"));

        String previous = defaultString(member.getTeamRole()).toUpperCase(Locale.ROOT);
        if (!previous.equals(normalizedRole)) {
            member.setTeamRole(normalizedRole);
            appendActivity(employer, "role_changed", member.getName(), previous + " -> " + normalizedRole);
        }

        Employer saved = employerRepository.save(employer);
        return findMember(saved, userId).orElse(member);
    }

    public void removeMember(String userId) {
        User actor = currentUserService.requireUser();
        Employer employer = getOrCreateEmployerForCurrentUser();
        requireTeamAdmin(actor, employer);

        if (employer.getUserId().equals(userId)) {
            throw new IllegalStateException("Cannot remove the owner.");
        }

        List<Employer.TeamMember> members = employer.getTeamMembers();
        if (members == null || members.isEmpty()) {
            throw new IllegalStateException("Team member not found");
        }

        Employer.TeamMember member = findMember(employer, userId)
                .orElseThrow(() -> new IllegalStateException("Team member not found"));

        boolean removed = members.removeIf(m -> userId.equals(m.getUserId()));
        if (!removed) {
            throw new IllegalStateException("Team member not found");
        }

        appendActivity(employer, "removed", member.getName(), null);
        employerRepository.save(employer);
    }

    public List<Employer.EmployerReview> listReviews() {
        Employer employer = getOrCreateEmployerForCurrentUser();
        List<Employer.EmployerReview> reviews = employer.getReviews() == null
                ? new ArrayList<>()
                : new ArrayList<>(employer.getReviews());

        reviews.sort(Comparator.comparing(Employer.EmployerReview::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())));
        return reviews;
    }

    public Employer.EmployerReview addReview(ReviewCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Review payload is required");
        }
        if (request.rating() < 1 || request.rating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }

        String comment = defaultString(request.comment()).trim();
        if (comment.isBlank()) {
            throw new IllegalArgumentException("Review comment is required");
        }

        User user = currentUserService.requireUser();
        Employer employer = getOrCreateEmployerForCurrentUser();

        List<Employer.EmployerReview> reviews = employer.getReviews();
        if (reviews == null) {
            reviews = new ArrayList<>();
            employer.setReviews(reviews);
        }

        Employer.EmployerReview review = Employer.EmployerReview.builder()
                .id("REV-" + UUID.randomUUID())
                .contractId(defaultString(request.contractId()).isBlank() ? "N/A" : request.contractId().trim())
                .reviewerId(user.getId())
                .reviewerName(defaultString(user.getFullName()).isBlank() ? "Employer" : user.getFullName())
                .targetId(defaultString(request.targetId()).isBlank() ? "N/A" : request.targetId().trim())
                .rating(request.rating())
                .comment(comment)
                .sentiment(classifySentiment(request.rating()))
                .verified(Boolean.TRUE)
                .createdAt(LocalDateTime.now())
                .tags(request.tags() == null ? List.of() : request.tags())
                .build();

        reviews.add(0, review);
        Employer saved = employerRepository.save(employer);

        return saved.getReviews() == null || saved.getReviews().isEmpty()
                ? review
                : saved.getReviews().get(0);
    }

    public record TeamSnapshot(
            String id,
            String name,
            String ownerId,
            LocalDateTime createdAt,
            List<Employer.TeamMember> members,
            List<Employer.TeamActivity> activities
    ) {}

    public record ReviewCreateRequest(
            String contractId,
            String targetId,
            int rating,
            String comment,
            List<String> tags
    ) {}

    private Employer createEmployerWorkspace(User user) {
        Employer employer = Employer.builder()
                .userId(user.getId())
                .companyProfile(Employer.CompanyProfile.builder()
                        .companyName(defaultString(user.getFullName()).isBlank()
                                ? "SabaHub Team"
                                : user.getFullName() + " Team")
                        .build())
                .stats(Employer.EmployerStats.builder()
                        .totalProjectsPosted(0)
                        .activeProjects(0)
                        .completedProjects(0)
                        .totalSpent(0.0)
                        .ratingScore(0.0)
                        .ratingCount(0)
                        .build())
                .isActive(true)
                .tier("STARTER")
                .createdAt(LocalDateTime.now())
                .build();

        return ensureWorkspaceData(employerRepository.save(employer), user);
    }

    private Employer ensureWorkspaceData(Employer employer, User owner) {
        boolean dirty = false;

        if (employer.getTeamMembers() == null) {
            employer.setTeamMembers(new ArrayList<>());
            dirty = true;
        }

        if (employer.getTeamActivities() == null) {
            employer.setTeamActivities(new ArrayList<>());
            dirty = true;
        }

        if (employer.getReviews() == null) {
            employer.setReviews(new ArrayList<>());
            dirty = true;
        }

        boolean ownerContext = owner != null
            && employer.getUserId() != null
            && employer.getUserId().equals(owner.getId());
        boolean ownerMissing = ownerContext && employer.getTeamMembers().stream()
            .noneMatch(member -> employer.getUserId().equals(member.getUserId()));
        if (ownerMissing) {
            User ownerUser = Objects.requireNonNull(owner);
            employer.getTeamMembers().add(0, Employer.TeamMember.builder()
                .userId(ownerUser.getId())
                .name(defaultString(ownerUser.getFullName()).isBlank() ? "Owner" : ownerUser.getFullName())
                .email(defaultString(ownerUser.getEmail()))
                    .teamRole("ADMIN")
                    .joinedAt(LocalDateTime.now())
                    .build());
            appendActivity(employer, "joined", defaultString(ownerUser.getFullName()).isBlank() ? "Owner" : ownerUser.getFullName(), null);
            dirty = true;
        }

        if (dirty) {
            return employerRepository.save(employer);
        }

        return employer;
    }

    private Employer ensureWorkspaceDataForMemberAccess(Employer employer) {
        return ensureWorkspaceData(employer, null);
    }

    private String resolveTeamName(Employer employer, User owner) {
        String companyName = employer.getCompanyProfile() != null
                ? defaultString(employer.getCompanyProfile().getCompanyName())
                : "";
        if (!companyName.isBlank()) {
            return companyName;
        }
        String fullName = defaultString(owner.getFullName());
        return fullName.isBlank() ? "Team Management" : fullName + " Team";
    }

    private List<Employer.TeamMember> sortedMembers(List<Employer.TeamMember> members) {
        List<Employer.TeamMember> copy = members == null ? new ArrayList<>() : new ArrayList<>(members);
        copy.sort(Comparator.comparing(Employer.TeamMember::getJoinedAt,
                Comparator.nullsLast(Comparator.naturalOrder())));
        return copy;
    }

    private List<Employer.TeamActivity> sortedActivities(List<Employer.TeamActivity> activities) {
        List<Employer.TeamActivity> copy = activities == null ? new ArrayList<>() : new ArrayList<>(activities);
        copy.sort(Comparator.comparing(Employer.TeamActivity::getTimestamp,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return copy;
    }

    private java.util.Optional<Employer.TeamMember> findMember(Employer employer, String userId) {
        return employer.getTeamMembers() == null
                ? java.util.Optional.empty()
                : employer.getTeamMembers().stream().filter(member -> userId.equals(member.getUserId())).findFirst();
    }

    private void appendActivity(Employer employer, String action, String memberName, String detail) {
        List<Employer.TeamActivity> activities = employer.getTeamActivities();
        if (activities == null) {
            activities = new ArrayList<>();
            employer.setTeamActivities(activities);
        }
        activities.add(0, Employer.TeamActivity.builder()
                .id("ACT-" + UUID.randomUUID())
                .action(action)
                .memberName(defaultString(memberName).isBlank() ? "Member" : memberName)
                .detail(defaultString(detail).isBlank() ? null : detail)
                .timestamp(LocalDateTime.now())
                .build());
    }

    private String normalizeRole(String role) {
        String normalized = defaultString(role).trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_TEAM_ROLES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid team role: " + role);
        }
        return normalized;
    }

    private void requireTeamAdmin(User actor, Employer employer) {
        if (actor == null || employer == null) {
            throw new IllegalStateException("Forbidden");
        }

        if (employer.getUserId() != null && employer.getUserId().equals(actor.getId())) {
            return;
        }

        String actorRole = employer.getTeamMembers() == null
                ? null
                : employer.getTeamMembers().stream()
                        .filter(member -> actor.getId().equals(member.getUserId()))
                        .map(Employer.TeamMember::getTeamRole)
                        .findFirst()
                        .orElse(null);

        if (!"ADMIN".equalsIgnoreCase(defaultString(actorRole))) {
            throw new IllegalStateException("Forbidden");
        }
    }

    private String classifySentiment(int rating) {
        if (rating >= 4) {
            return "POSITIVE";
        }
        if (rating == 3) {
            return "NEUTRAL";
        }
        return "NEGATIVE";
    }

    private String extractName(String email) {
        String local = email.split("@")[0];
        if (local.isBlank()) {
            return "Invited Member";
        }
        String[] parts = local.replace('.', ' ').replace('_', ' ').trim().split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            builder.append(part.substring(0, 1).toUpperCase(Locale.ROOT));
            if (part.length() > 1) {
                builder.append(part.substring(1));
            }
            builder.append(' ');
        }
        return builder.toString().trim();
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }
}
