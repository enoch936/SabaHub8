package com.sabahub.config;

import com.sabahub.domain.Job;
import com.sabahub.repository.JobRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Configuration
@ConditionalOnProperty(name = "app.seed.jobs", havingValue = "true")
public class JobSeeder {

    @Bean
    CommandLineRunner seedJobs(JobRepository jobRepository) {
        return args -> {
            try {
                if (jobRepository.countByStatus(Job.Status.OPEN) > 0) {
                    return;
                }

                Instant now = Instant.now();

                Job brandMotion = new Job();
                brandMotion.setTitle("Brand Motion Graphics Package");
                brandMotion.setDescription("Create a cohesive set of animated brand assets for product launch.");
                brandMotion.setOverviewText("Deliver short logo stings, lower thirds, and intro animations.");
                brandMotion.setEmployerId("seed-employer-01");
                brandMotion.setStatus(Job.Status.OPEN);
                brandMotion.setIsEnterpriseOnly(false);
                brandMotion.setEngagementType(Job.EngagementType.PROJECT_BASED);
                brandMotion.setDeliverableType(Job.DeliverableType.VIDEO_PRODUCTION);
                brandMotion.setWorkLocation("Remote");
                brandMotion.setBudgetMin(1200.0);
                brandMotion.setBudgetMax(2800.0);
                brandMotion.setCurrency("USD");
                brandMotion.setPricingModel(Job.PricingModel.FIXED_PRICE);
                brandMotion.setSkills(List.of("After Effects", "Motion Design", "Branding"));
                brandMotion.setIndustry(List.of("SaaS", "Marketing"));
                brandMotion.setCompanyName("SabaHub Studio");
                brandMotion.setCreatedAt(now.minusSeconds(86400));

                Job uiSystem = new Job();
                uiSystem.setTitle("Design System UI Kit for B2B Platform");
                uiSystem.setDescription("Build a scalable UI kit and component library for a finance dashboard.");
                uiSystem.setOverviewText("Create tokens, components, and usage guidelines.");
                uiSystem.setEmployerId("seed-employer-02");
                uiSystem.setStatus(Job.Status.OPEN);
                uiSystem.setIsEnterpriseOnly(false);
                uiSystem.setEngagementType(Job.EngagementType.CONTRACT);
                uiSystem.setDeliverableType(Job.DeliverableType.IMAGE_DESIGN);
                uiSystem.setWorkLocation("Hybrid");
                uiSystem.setBudgetMin(2500.0);
                uiSystem.setBudgetMax(6000.0);
                uiSystem.setCurrency("USD");
                uiSystem.setPricingModel(Job.PricingModel.HOURLY);
                uiSystem.setSkills(List.of("Figma", "Design Systems", "UX"));
                uiSystem.setIndustry(List.of("Finance", "B2B"));
                uiSystem.setCompanyName("Finorama");
                uiSystem.setCreatedAt(now.minusSeconds(54000));

                Job docAutomation = new Job();
                docAutomation.setTitle("Document Automation Templates");
                docAutomation.setDescription("Create reusable templates for contracts and reports.");
                docAutomation.setOverviewText("Deliver editable templates with brand compliance.");
                docAutomation.setEmployerId("seed-employer-03");
                docAutomation.setStatus(Job.Status.OPEN);
                docAutomation.setIsEnterpriseOnly(false);
                docAutomation.setEngagementType(Job.EngagementType.RETAINER);
                docAutomation.setDeliverableType(Job.DeliverableType.DOCUMENT_DEVELOPMENT);
                docAutomation.setWorkLocation("Remote");
                docAutomation.setBudgetMin(800.0);
                docAutomation.setBudgetMax(2000.0);
                docAutomation.setCurrency("USD");
                docAutomation.setPricingModel(Job.PricingModel.FIXED_PRICE);
                docAutomation.setSkills(List.of("Document Design", "Brand Compliance", "Templates"));
                docAutomation.setIndustry(List.of("Legal", "Operations"));
                docAutomation.setCompanyName("DocuCraft");
                docAutomation.setCreatedAt(now.minusSeconds(42000));

                Job podcast = new Job();
                podcast.setTitle("Podcast Editing & Audio Mastering");
                podcast.setDescription("Edit and master weekly podcast episodes with a modern sound.");
                podcast.setOverviewText("Clean audio, remove noise, add intro/outro music.");
                podcast.setEmployerId("seed-employer-04");
                podcast.setStatus(Job.Status.OPEN);
                podcast.setIsEnterpriseOnly(false);
                podcast.setEngagementType(Job.EngagementType.LONG_TERM_PARTNERSHIP);
                podcast.setDeliverableType(Job.DeliverableType.AUDIO_PRODUCTION);
                podcast.setWorkLocation("Remote");
                podcast.setBudgetMin(600.0);
                podcast.setBudgetMax(1600.0);
                podcast.setCurrency("USD");
                podcast.setPricingModel(Job.PricingModel.RETAINER);
                podcast.setSkills(List.of("Audio Editing", "Sound Design", "Podcasting"));
                podcast.setIndustry(List.of("Media", "Education"));
                podcast.setCompanyName("WaveCast");
                podcast.setCreatedAt(now.minusSeconds(32000));

                Job videoSeries = new Job();
                videoSeries.setTitle("Product Demo Video Series");
                videoSeries.setDescription("Produce 5 short demo videos for new product features.");
                videoSeries.setOverviewText("Script, animate, and deliver in multiple aspect ratios.");
                videoSeries.setEmployerId("seed-employer-05");
                videoSeries.setStatus(Job.Status.OPEN);
                videoSeries.setIsEnterpriseOnly(false);
                videoSeries.setEngagementType(Job.EngagementType.PROJECT_BASED);
                videoSeries.setDeliverableType(Job.DeliverableType.VIDEO_PRODUCTION);
                videoSeries.setWorkLocation("Remote");
                videoSeries.setBudgetMin(3000.0);
                videoSeries.setBudgetMax(9000.0);
                videoSeries.setCurrency("USD");
                videoSeries.setPricingModel(Job.PricingModel.FIXED_PRICE);
                videoSeries.setSkills(List.of("Video Editing", "Animation", "Storyboarding"));
                videoSeries.setIndustry(List.of("SaaS", "Product"));
                videoSeries.setCompanyName("FlowSuite");
                videoSeries.setCreatedAt(now.minusSeconds(26000));

                Job mixedCampaign = new Job();
                mixedCampaign.setTitle("Mixed Media Launch Campaign");
                mixedCampaign.setDescription("Deliver a bundle of creative assets for launch week.");
                mixedCampaign.setOverviewText("Graphics, video snippets, and audio cues for socials.");
                mixedCampaign.setEmployerId("seed-employer-06");
                mixedCampaign.setStatus(Job.Status.OPEN);
                mixedCampaign.setIsEnterpriseOnly(false);
                mixedCampaign.setEngagementType(Job.EngagementType.CONTRACT);
                mixedCampaign.setDeliverableType(Job.DeliverableType.MIXED);
                mixedCampaign.setWorkLocation("Remote");
                mixedCampaign.setBudgetMin(2000.0);
                mixedCampaign.setBudgetMax(5500.0);
                mixedCampaign.setCurrency("USD");
                mixedCampaign.setPricingModel(Job.PricingModel.VOLUME_BASED);
                mixedCampaign.setSkills(List.of("Creative Direction", "Content Production", "Brand Design"));
                mixedCampaign.setIndustry(List.of("E-commerce", "Retail"));
                mixedCampaign.setCompanyName("Brightlane");
                mixedCampaign.setCreatedAt(now.minusSeconds(18000));

                List<Job> seedJobs = new ArrayList<>(List.of(
                        brandMotion,
                        uiSystem,
                        docAutomation,
                        podcast,
                        videoSeries,
                        mixedCampaign
                ));
                jobRepository.saveAll(seedJobs);
            } catch (Exception e) {
                // Mongo is not reachable during startup; skip seeding so the app can still start.
            }
        };
    }
}
