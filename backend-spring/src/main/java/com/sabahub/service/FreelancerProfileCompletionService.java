package com.sabahub.service;

import com.sabahub.domain.Freelancer;
import com.sabahub.domain.User;
import com.sabahub.repository.FreelancerRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FreelancerProfileCompletionService {

    private final FreelancerRepository freelancerRepository;

    public FreelancerProfileCompletionService(FreelancerRepository freelancerRepository) {
        this.freelancerRepository = freelancerRepository;
    }

    public Freelancer requireCompleteProfileForPublishing(User user) {
        Freelancer freelancer = findFreelancerByUser(user)
                .orElseThrow(() -> new IllegalStateException("Complete freelancer profile before publishing gigs or project posts"));

        List<String> missingFields = getMissingFields(freelancer);
        if (!missingFields.isEmpty()) {
            throw new IllegalArgumentException("Profile incomplete. Missing: " + String.join(", ", missingFields));
        }
        return freelancer;
    }

    public boolean isProfileComplete(Freelancer freelancer) {
        return freelancer != null && getMissingFields(freelancer).isEmpty();
    }

    public List<String> getMissingFields(Freelancer freelancer) {
        List<String> missing = new ArrayList<>();
        if (freelancer == null) {
            missing.add("freelancerProfile");
            return missing;
        }

        if (isBlank(freelancer.getProfessionalTitle())) missing.add("professionalTitle");
        if (isBlank(freelancer.getBio())) missing.add("bio");
        if (freelancer.getHourlyRate() == null) missing.add("hourlyRate");
        if (freelancer.getCategories() == null || freelancer.getCategories().isEmpty()) missing.add("categories");
        if (freelancer.getSkills() == null || freelancer.getSkills().isEmpty()) missing.add("skills");
        if (freelancer.getLanguages() == null || freelancer.getLanguages().isEmpty()) missing.add("languages");
        if (freelancer.getPortfolio() == null || freelancer.getPortfolio().isEmpty()) missing.add("portfolio");
        if (!Boolean.TRUE.equals(freelancer.getIsActive())) missing.add("isActive");

        return missing;
    }

    private java.util.Optional<Freelancer> findFreelancerByUser(User user) {
        if (user == null) {
            return java.util.Optional.empty();
        }
        if (!isBlank(user.getId())) {
            java.util.Optional<Freelancer> byId = freelancerRepository.findByUserId(user.getId());
            if (byId.isPresent()) {
                return byId;
            }
        }
        if (!isBlank(user.getEmail())) {
            return freelancerRepository.findByUserId(user.getEmail());
        }
        return java.util.Optional.empty();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}