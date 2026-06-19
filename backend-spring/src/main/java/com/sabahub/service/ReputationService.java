package com.sabahub.service;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ReputationService {

    private final UserRepository userRepository;

    public ReputationService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Map<String, Object> getReputation(String userId) {
        return userRepository.findById(userId)
                .map(user -> {
                    var profile = user.getReputationProfile();
                    if (profile == null) {
                        return Map.<String, Object>of("score", 0, "level", "NEWCOMER");
                    }
                    int score = profile.getGlobalScore() != null ? profile.getGlobalScore() : 0;
                    String level = score >= 800 ? "PLATINUM" : score >= 500 ? "GOLD" : score >= 200 ? "SILVER" : "BRONZE";
                    return Map.<String, Object>of(
                            "score", score,
                            "level", level,
                            "creatorInfluence", profile.getCreatorInfluenceScore(),
                            "professionalCredibility", profile.getProfessionalCredibilityScore(),
                            "communityTrust", profile.getCommunityTrustScore(),
                            "engagementQuality", profile.getEngagementQualityScore(),
                            "followerCount", profile.getFollowerCount(),
                            "followingCount", profile.getFollowingCount(),
                            "averageRating", profile.getAverageRating()
                    );
                })
                .orElse(Map.of("score", 0, "level", "UNKNOWN"));
    }

    public Map<String, Object> getVerificationStatus(String userId) {
        return userRepository.findById(userId)
                .map(user -> {
                    var vp = user.getVerificationProfile();
                    if (vp == null) {
                        return Map.<String, Object>of("verified", false);
                    }
                    return Map.<String, Object>of(
                            "verified", vp.isVerifiedTalent() || vp.isVerifiedCreator() ||
                                        vp.isVerifiedRecruiter() || vp.isVerifiedOrganization(),
                            "badgeLevel", vp.getBadgeLevel(),
                            "verifiedAt", vp.getVerifiedAt() != null ? vp.getVerifiedAt().toString() : null
                    );
                })
                .orElse(Map.of("verified", false));
    }
}
