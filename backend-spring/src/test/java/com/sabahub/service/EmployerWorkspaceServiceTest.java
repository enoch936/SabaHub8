package com.sabahub.service;

import com.sabahub.domain.Employer;
import com.sabahub.domain.User;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployerWorkspaceServiceTest {

    @Mock
    private EmployerRepository employerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private EmployerWorkspaceService employerWorkspaceService;

    @Test
    void getOrCreateEmployerForCurrentUser_resolvesWorkspaceByTeamMembership() {
        User actor = buildUser("member-1", "member@sabahub.test", "Member User");

        Employer workspace = Employer.builder()
                .id("emp-1")
                .userId("owner-1")
                .teamMembers(new ArrayList<>(List.of(
                        teamMember("owner-1", "Owner", "owner@sabahub.test", "ADMIN"),
                        teamMember("member-1", "Member User", "member@sabahub.test", "VIEWER")
                )))
                .teamActivities(new ArrayList<>())
                .reviews(new ArrayList<>())
                .build();

        when(currentUserService.requireUser()).thenReturn(actor);
        doNothing().when(currentUserService).requireEmployerMode(actor);
        when(employerRepository.findByUserId("member-1")).thenReturn(Optional.empty());
        when(employerRepository.findByTeamMembersUserId("member-1")).thenReturn(Optional.of(workspace));

        Employer resolved = employerWorkspaceService.getOrCreateEmployerForCurrentUser();

        assertThat(resolved.getId()).isEqualTo("emp-1");
        verify(employerRepository, never()).save(any(Employer.class));
    }

    @Test
    void inviteMember_rejectsNonAdminTeamMember() {
        User actor = buildUser("member-1", "member@sabahub.test", "Member User");
        Employer workspace = workspaceForActor("owner-1", "member-1", "VIEWER");

        when(currentUserService.requireUser()).thenReturn(actor);
        doNothing().when(currentUserService).requireEmployerMode(actor);
        when(employerRepository.findByUserId("member-1")).thenReturn(Optional.empty());
        when(employerRepository.findByTeamMembersUserId("member-1")).thenReturn(Optional.of(workspace));

        assertThatThrownBy(() -> employerWorkspaceService.inviteMember("new@sabahub.test", "RECRUITER"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Forbidden");

        verify(employerRepository, never()).save(any(Employer.class));
    }

    @Test
    void inviteMember_allowsAdminTeamMember() {
        User actor = buildUser("member-1", "member@sabahub.test", "Member User");
        Employer workspace = workspaceForActor("owner-1", "member-1", "ADMIN");

        when(currentUserService.requireUser()).thenReturn(actor);
        doNothing().when(currentUserService).requireEmployerMode(actor);
        when(employerRepository.findByUserId("member-1")).thenReturn(Optional.empty());
        when(employerRepository.findByTeamMembersUserId("member-1")).thenReturn(Optional.of(workspace));
        when(userRepository.findByEmail("new@sabahub.test")).thenReturn(Optional.empty());
        when(employerRepository.save(any(Employer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Employer.TeamMember invited = employerWorkspaceService.inviteMember("new@sabahub.test", "recruiter");

        assertThat(invited.getEmail()).isEqualTo("new@sabahub.test");
        assertThat(invited.getTeamRole()).isEqualTo("RECRUITER");
        assertThat(workspace.getTeamActivities()).isNotEmpty();
        verify(employerRepository).save(any(Employer.class));
        verify(userRepository).findByEmail(eq("new@sabahub.test"));
    }

    private User buildUser(String id, String email, String fullName) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFullName(fullName);
        return user;
    }

    private Employer workspaceForActor(String ownerId, String actorId, String actorRole) {
        return Employer.builder()
                .id("emp-1")
                .userId(ownerId)
                .teamMembers(new ArrayList<>(List.of(
                        teamMember(ownerId, "Owner", "owner@sabahub.test", "ADMIN"),
                        teamMember(actorId, "Actor", "member@sabahub.test", actorRole)
                )))
                .teamActivities(new ArrayList<>())
                .reviews(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Employer.TeamMember teamMember(String userId, String name, String email, String role) {
        return Employer.TeamMember.builder()
                .userId(userId)
                .name(name)
                .email(email)
                .teamRole(role)
                .joinedAt(LocalDateTime.now())
                .build();
    }
}
