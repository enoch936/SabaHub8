package com.sabahub.service;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("streamingAccessService")
public class StreamingAccessService {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final StreamService streamService;

    public StreamingAccessService(UserRepository userRepository,
                                  CurrentUserService currentUserService,
                                  StreamService streamService) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.streamService = streamService;
    }

    public boolean canBrowseStreams(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated();
    }

    public boolean canCreateStream(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated();
    }

    public boolean canViewStream(Authentication authentication, String streamId) {
        String email = resolveEmail(authentication);
        return email != null && streamService.canView(email, streamId);
    }

    public boolean canManageStream(Authentication authentication, String streamId) {
        String email = resolveEmail(authentication);
        return email != null && streamService.isStreamOwner(email, streamId);
    }

    public boolean canAdminister(Authentication authentication) {
        User user = resolveUser(authentication);
        return user != null && (
                currentUserService.hasRole(user, "ADMIN")
                        || currentUserService.hasRole(user, "SUPER_ADMIN")
                        || currentUserService.hasRole(user, "SUPPORT_ADMIN")
                        || currentUserService.hasRole(user, "FINANCE_ADMIN")
        );
    }

    private User resolveUser(Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null) {
            return null;
        }
        return userRepository.findByEmail(email).orElse(null);
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        return email != null && !email.isBlank() ? email : null;
    }
}
