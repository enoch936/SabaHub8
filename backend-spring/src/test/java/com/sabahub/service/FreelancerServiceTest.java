package com.sabahub.service;

import com.sabahub.domain.Freelancer;
import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.dto.freelancer.FreelancerDTOs.FreelancerProfileRequest;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.InvoiceRepository;
import com.sabahub.repository.ProjectRepository;
import com.sabahub.repository.ProposalRepository;
import com.sabahub.repository.TimeEntryRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.repository.WithdrawalRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FreelancerServiceTest {

    @Mock
    private FreelancerRepository freelancerRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProposalRepository proposalRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private TimeEntryRepository timeEntryRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private WithdrawalRepository withdrawalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FreelancerService freelancerService;

    @Test
    void ensureFreelancerProfile_createsBaselineProfileWhenMissing() {
        User user = buildUser("user-1", "freelancer@sabahub.test");

        when(freelancerRepository.findByUserId("user-1")).thenReturn(Optional.empty());
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(freelancerRepository.findByUserId("freelancer@sabahub.test")).thenReturn(Optional.empty());
        when(freelancerRepository.save(any(Freelancer.class))).thenAnswer(invocation -> {
            Freelancer freelancer = invocation.getArgument(0);
            freelancer.setId("freelancer-1");
            return freelancer;
        });

        Freelancer created = freelancerService.ensureFreelancerProfile("user-1");

        assertThat(created.getId()).isEqualTo("freelancer-1");
        assertThat(created.getUserId()).isEqualTo("user-1");
        assertThat(created.getBio()).isEqualTo("Product designer and researcher");
        assertThat(created.getProfilePicture()).isEqualTo("https://cdn.sabahub.test/avatar.png");
        assertThat(created.getLocation()).isEqualTo("Addis Ababa");
        assertThat(created.getTimezone()).isEqualTo("Africa/Addis_Ababa");
        assertThat(created.getLanguages()).containsExactly("English");
        assertThat(created.getSkills()).extracting(Freelancer.Skill::getName).containsExactly("Figma", "Research");
        assertThat(created.getCategories()).containsExactly("design");
        assertThat(created.getHourlyRate()).isEqualByComparingTo("55");
        assertThat(created.getCurrency()).isEqualTo("USD");
        assertThat(created.getAvailability()).isEqualTo("FULL_TIME");
        assertThat(created.getPortfolio()).isEmpty();
        assertThat(created.getIsActive()).isTrue();
        verify(auditService).logAction("user-1", "FREELANCER_PROFILE_CREATED", "freelancer-1");
    }

    @Test
    void getFreelancerByUserId_migratesLegacyEmailReferenceToCanonicalUserId() {
        User user = buildUser("user-1", "legacy@sabahub.test");
        Freelancer legacy = Freelancer.builder()
                .id("freelancer-1")
                .userId("legacy@sabahub.test")
                .portfolio(new ArrayList<>())
                .build();

        when(freelancerRepository.findByUserId("user-1")).thenReturn(Optional.empty());
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(freelancerRepository.findByUserId("legacy@sabahub.test")).thenReturn(Optional.of(legacy));
        when(freelancerRepository.save(any(Freelancer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Freelancer resolved = freelancerService.getFreelancerByUserId("user-1");

        assertThat(resolved.getId()).isEqualTo("freelancer-1");
        assertThat(resolved.getUserId()).isEqualTo("user-1");
        verify(freelancerRepository).save(any(Freelancer.class));
    }

    @Test
    void updateProfile_preservesExistingFieldsWhenRequestIsPartial() {
        Freelancer existing = Freelancer.builder()
                .id("freelancer-1")
                .userId("user-1")
                .professionalTitle("Designer")
                .bio("Existing bio")
                .hourlyRate(new BigDecimal("80"))
                .currency("USD")
                .languages(new ArrayList<>(List.of("English")))
                .categories(new ArrayList<>(List.of("design")))
                .skills(new ArrayList<>(List.of(Freelancer.Skill.builder().name("Figma").level("EXPERT").build())))
                .portfolio(new ArrayList<>())
                .certifications(new ArrayList<>())
                .education(new ArrayList<>())
                .preferredIndustries(new ArrayList<>(List.of("SaaS")))
                .createdAt(java.time.LocalDateTime.now().minusDays(3))
                .updatedAt(java.time.LocalDateTime.now().minusDays(1))
                .build();

        FreelancerProfileRequest request = FreelancerProfileRequest.builder()
                .professionalTitle("Senior Product Designer")
                .bio("Updated bio")
                .build();

        when(freelancerRepository.findById("freelancer-1")).thenReturn(Optional.of(existing));
        when(freelancerRepository.save(any(Freelancer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Freelancer updated = freelancerService.updateProfile("freelancer-1", request);

        assertThat(updated.getProfessionalTitle()).isEqualTo("Senior Product Designer");
        assertThat(updated.getBio()).isEqualTo("Updated bio");
        assertThat(updated.getHourlyRate()).isEqualByComparingTo("80");
        assertThat(updated.getCurrency()).isEqualTo("USD");
        assertThat(updated.getLanguages()).containsExactly("English");
        assertThat(updated.getCategories()).containsExactly("design");
        assertThat(updated.getSkills()).extracting(Freelancer.Skill::getName).containsExactly("Figma");
        assertThat(updated.getPreferredIndustries()).containsExactly("SaaS");
    }

    private User buildUser(String id, String email) {
        UserProfile profile = new UserProfile();
        profile.setBio("Product designer and researcher");
        profile.setProfilePictureUrl("https://cdn.sabahub.test/avatar.png");
        profile.setLocation("Addis Ababa");
        profile.setTimezone("Africa/Addis_Ababa");
        profile.setLanguage("English");
        profile.setSkills(List.of("Figma", "Research"));
        profile.setPreferredCategories(List.of("design"));
        profile.setHourlyRate("55");
        profile.setAvailability("FULL_TIME");

        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFullName("Freelancer User");
        user.setProfile(profile);
        return user;
    }
}
