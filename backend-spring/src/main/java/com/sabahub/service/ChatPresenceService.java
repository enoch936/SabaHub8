package com.sabahub.service;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatPresenceService {

    private final UserRepository userRepository;
    private final ConcurrentHashMap<String, Set<String>> activeSessionsByUserId = new ConcurrentHashMap<>();

    public ChatPresenceService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void markConnectedByPrincipal(String principalName, String sessionId) {
        resolveUserByPrincipal(principalName).ifPresent(user -> {
            activeSessionsByUserId
                    .computeIfAbsent(user.getId(), ignored -> ConcurrentHashMap.newKeySet())
                    .add(sessionId);
            touchUser(user.getId());
        });
    }

    public void markDisconnectedByPrincipal(String principalName, String sessionId) {
        resolveUserByPrincipal(principalName).ifPresent(user -> {
            Set<String> sessions = activeSessionsByUserId.get(user.getId());
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    activeSessionsByUserId.remove(user.getId());
                }
            }
            touchUser(user.getId());
        });
    }

    public void touchUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        userRepository.findById(userId).ifPresent(user -> {
            user.setLastSeenAt(Instant.now());
            userRepository.save(user);
        });
    }

    public boolean isOnline(String userId) {
        Set<String> sessions = activeSessionsByUserId.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    private java.util.Optional<User> resolveUserByPrincipal(String principalName) {
        if (principalName == null || principalName.isBlank()) {
            return java.util.Optional.empty();
        }

        return userRepository.findByEmail(principalName)
                .or(() -> userRepository.findById(principalName));
    }
}
