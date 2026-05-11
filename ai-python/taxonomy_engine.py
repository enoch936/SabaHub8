from __future__ import annotations

import json
import re
import threading
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set


STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "with",
    "your",
    "you",
    "we",
    "our",
    "their",
    "this",
    "those",
    "these",
    "will",
    "can",
    "must",
    "need",
    "needs",
    "needed",
    "using",
    "use",
    "used",
    "build",
    "building",
    "develop",
    "development",
    "manage",
    "management",
    "support",
    "project",
    "projects",
    "platform",
    "service",
    "services",
    "role",
    "work",
    "looking",
    "someone",
    "need",
    "needs",
    "want",
    "wanted",
    "interested",
    "user",
    "category",
    "preferences",
    "build",
    "building",
    "custom",
    "senior",
    "junior",
    "expert",
}

DEFAULT_TAXONOMY_SOURCE = """Software & IT
  ├─ Application Development
  │    ├─ Web Application Development
  │    ├─ Mobile Application Development
  │    └─ API & Integration Engineering
  ├─ Cloud & DevOps
  │    ├─ Site Reliability Engineering (SRE)
  │    └─ Cloud Architecture & Migration
  └─ Quality Assurance & Testing
       ├─ Test Automation
       └─ QA Management & Test Strategy
Data & AI
  ├─ Data Engineering
  │    ├─ ETL/ELT Pipelines
  │    └─ Data Warehousing
  ├─ Machine Learning Engineering
  │    ├─ Model Training & Serving
  │    └─ MLOps & Model Monitoring
  └─ AI Product, Ops & Governance
       ├─ Prompt Engineering & LLM Apps
       ├─ AI Evaluation & Red Teaming
       └─ Conversational AI & Agents
Design & Creative
  ├─ UX/UI Design
  │    ├─ UX Research
  │    ├─ UI Design Systems
  │    └─ Prototyping & Wireframing
  └─ Graphic & Visual Design
       ├─ Branding & Identity
       ├─ Marketing & Advertising Design
       └─ Document Design & Layout
Writing & Translation
  ├─ Copywriting & Content Marketing
  │    ├─ Brand Copywriting
  │    ├─ Ads & Landing Pages
  │    └─ Email & CRM Copy
  └─ Technical Writing
       ├─ API Documentation
       ├─ SOPs & Playbooks
       └─ RFP & Proposal Writing
Sales & Marketing
  ├─ Digital Marketing
  │    ├─ SEO/SEM
  │    ├─ Paid Social
  │    ├─ Email Marketing
  │    └─ Marketing Automation & CRM
  └─ Growth & Performance
       ├─ Conversion Rate Optimization
       ├─ Funnel Analytics
       └─ A/B Testing
Customer Support
  ├─ Customer Service
  │    ├─ Email & Chat Support
  │    └─ Phone Support
  └─ Customer Success
       ├─ Onboarding
       └─ Adoption Programs
Business & Management
  ├─ Project & Program Management
  │    ├─ Agile Delivery
  │    └─ Technical Program Management
  └─ Operations Management
       ├─ Process Improvement
       └─ Operational Excellence
Finance & Accounting
  ├─ Accounting & Bookkeeping
  │    ├─ AP/AR
  │    └─ Financial Statements
  └─ Financial Planning & Analysis (FP&A)
       ├─ Budgeting & Forecasting
       └─ Management Reporting
Human Resources
  ├─ Talent Acquisition
  │    ├─ Sourcing
  │    └─ Recruiting
  └─ HR Operations
       ├─ HRIS Administration
       └─ HR Compliance"""


ROOT_HINTS: Dict[str, List[str]] = {
    "software-it": [
        "software engineer",
        "developer",
        "frontend",
        "backend",
        "full stack",
        "full-stack",
        "web app",
        "mobile app",
        "devops",
        "cloud",
        "sre",
        "qa engineer",
        "test automation",
        "api integration",
        "erp",
        "crm",
        "system architecture",
    ],
    "data-ai": [
        "data engineer",
        "data scientist",
        "machine learning",
        "ml engineer",
        "artificial intelligence",
        "ai engineer",
        "analytics",
        "business intelligence",
        "rag",
        "llm",
        "prompt engineering",
        "agent workflows",
        "forecasting",
        "feature engineering",
        "mlops",
    ],
    "cybersecurity": [
        "cybersecurity",
        "security engineer",
        "penetration testing",
        "incident response",
        "threat hunting",
        "soc",
        "iam",
        "grc",
        "devsecops",
    ],
    "blockchain-web3": [
        "web3",
        "blockchain",
        "smart contract",
        "solidity",
        "dao",
        "token",
        "defi",
        "wallet infrastructure",
    ],
    "design-creative": [
        "ui design",
        "ux design",
        "figma",
        "brand identity",
        "branding",
        "motion graphics",
        "illustration",
        "creative direction",
        "wireframe",
        "prototype",
    ],
    "media-entertainment": [
        "video editing",
        "cinematography",
        "podcast",
        "sound engineering",
        "music production",
        "color grading",
        "visual effects",
        "broadcast",
    ],
    "writing-translation": [
        "copywriting",
        "content writing",
        "technical writing",
        "api documentation",
        "localization",
        "translation",
        "transcription",
        "proofreading",
    ],
    "business-management": [
        "project manager",
        "program manager",
        "operations manager",
        "business analyst",
        "strategy",
        "consulting",
        "process improvement",
        "pmo",
        "agile delivery",
    ],
    "finance-accounting": [
        "accounting",
        "bookkeeping",
        "financial planning",
        "fp&a",
        "payroll",
        "audit",
        "treasury",
        "budgeting",
        "quickbooks",
        "xero",
    ],
    "sales-marketing": [
        "digital marketing",
        "seo",
        "sem",
        "paid social",
        "google ads",
        "meta ads",
        "email marketing",
        "crm",
        "funnel analytics",
        "growth marketing",
        "brand strategy",
        "content strategy",
    ],
    "customer-support": [
        "customer support",
        "customer service",
        "technical support",
        "customer success",
        "knowledge base",
        "support qa",
        "zendesk",
        "intercom",
        "community moderation",
    ],
    "education-training": [
        "tutoring",
        "teaching",
        "curriculum",
        "instructional design",
        "learning and development",
        "career coaching",
    ],
    "healthcare-medical": [
        "medical billing",
        "health information",
        "patient scheduling",
        "clinical care",
        "nursing",
        "therapy",
        "healthcare administration",
    ],
    "legal-compliance": [
        "contract review",
        "legal advisory",
        "compliance",
        "policy drafting",
        "gdpr",
        "ccpa",
        "privacy",
        "audit readiness",
    ],
    "retail-e-commerce": [
        "e-commerce",
        "ecommerce",
        "shopify",
        "merchandising",
        "catalog",
        "marketplace",
        "product listings",
        "order management",
        "amazon seller central",
    ],
    "human-resources": [
        "recruiting",
        "talent acquisition",
        "hiring",
        "hris",
        "employee relations",
        "compensation",
        "benefits",
        "learning and development",
    ],
    "virtual-assistance": [
        "virtual assistant",
        "calendar management",
        "inbox management",
        "travel booking",
        "data entry",
        "lead lists",
    ],
    "administration-office-support": [
        "office administration",
        "executive assistant",
        "records management",
        "scheduling",
        "reception",
    ],
    "gaming-esports": [
        "game development",
        "unity",
        "unreal",
        "liveops",
        "esports",
        "game art",
        "player analytics",
    ],
}


CATEGORY_HINTS: Dict[str, List[str]] = {
    "software-it.application-development.web-application-development": [
        "react",
        "next.js",
        "frontend",
        "backend",
        "web application",
        "web app",
        "full stack",
        "full-stack",
        "typescript",
        "node.js",
        "django",
        "fastapi",
    ],
    "software-it.application-development.mobile-application-development": [
        "react native",
        "flutter",
        "ios",
        "android",
        "swift",
        "kotlin",
        "mobile app",
        "app store",
    ],
    "software-it.application-development.e-commerce-platform-development": [
        "shopify app",
        "woocommerce",
        "magento",
        "storefront",
        "checkout",
        "e-commerce platform",
        "ecommerce platform",
    ],
    "software-it.cloud-devops.site-reliability-engineering-sre": [
        "sre",
        "site reliability",
        "observability",
        "incident management",
        "uptime",
        "kubernetes",
        "infrastructure as code",
    ],
    "software-it.cloud-devops.ci-cd-build-engineering": [
        "ci/cd",
        "github actions",
        "gitlab ci",
        "jenkins",
        "build pipeline",
        "release automation",
    ],
    "software-it.cloud-devops.cloud-architecture-migration": [
        "aws",
        "azure",
        "gcp",
        "cloud migration",
        "landing zone",
        "terraform",
        "infrastructure",
    ],
    "software-it.enterprise-systems-integration.api-integration-engineering": [
        "api integration",
        "rest api",
        "graphql",
        "webhook",
        "integration engineering",
        "middleware",
    ],
    "software-it.quality-assurance-testing.test-automation": [
        "test automation",
        "playwright",
        "selenium",
        "cypress",
        "automation qa",
        "qa automation",
    ],
    "data-ai.data-engineering.etl-elt-pipelines": [
        "etl",
        "elt",
        "airflow",
        "dbt",
        "data pipeline",
        "orchestration",
    ],
    "data-ai.analytics-business-intelligence.dashboarding-reporting": [
        "dashboard",
        "reporting",
        "power bi",
        "tableau",
        "looker",
        "analytics dashboard",
    ],
    "data-ai.data-science.statistical-modeling": [
        "statistics",
        "statistical modeling",
        "regression",
        "classification",
    ],
    "data-ai.data-science.experimentation-a-b-testing": [
        "a/b testing",
        "ab testing",
        "experimentation",
        "causal inference",
    ],
    "data-ai.data-science.forecasting-time-series": [
        "forecasting",
        "time series",
        "prophet",
        "demand forecasting",
    ],
    "data-ai.machine-learning-engineering.model-training-serving": [
        "machine learning",
        "model serving",
        "tensorflow",
        "pytorch",
        "scikit-learn",
        "inference api",
    ],
    "data-ai.machine-learning-engineering.mlops-model-monitoring": [
        "mlops",
        "model monitoring",
        "mlflow",
        "feature store",
        "model drift",
    ],
    "data-ai.ai-product-ops-governance.prompt-engineering-llm-apps": [
        "prompt engineering",
        "llm",
        "rag",
        "vector database",
        "embeddings",
        "openai",
        "langchain",
        "llm app",
        "ai assistant",
    ],
    "data-ai.ai-product-ops-governance.ai-evaluation-red-teaming": [
        "evaluation",
        "evals",
        "red teaming",
        "hallucination testing",
        "safety testing",
        "benchmarking",
    ],
    "data-ai.ai-product-ops-governance.conversational-ai-agents": [
        "chatbot",
        "conversational ai",
        "voice bot",
        "agent",
        "agents",
        "multi-agent",
    ],
    "design-creative.ux-ui-design.ui-design-systems": [
        "design system",
        "figma",
        "component library",
        "ui kit",
        "tokens",
        "storybook",
    ],
    "design-creative.ux-ui-design.prototyping-wireframing": [
        "wireframe",
        "prototype",
        "user flow",
        "low-fidelity",
        "clickable prototype",
    ],
    "design-creative.graphic-visual-design.branding-identity": [
        "brand identity",
        "logo design",
        "branding",
        "brand guidelines",
        "visual identity",
    ],
    "design-creative.graphic-visual-design.marketing-advertising-design": [
        "ad creative",
        "social media design",
        "marketing collateral",
        "campaign design",
    ],
    "design-creative.motion-interaction-design.motion-graphics": [
        "motion graphics",
        "after effects",
        "lottie",
        "animated explainer",
    ],
    "media-entertainment.film-video-production.video-editing": [
        "video editing",
        "premiere pro",
        "davinci resolve",
        "short-form video",
        "youtube editing",
    ],
    "media-entertainment.audio-music-production.podcast-production": [
        "podcast",
        "episode editing",
        "audio cleanup",
        "podcast production",
        "rss publishing",
    ],
    "media-entertainment.post-production-vfx.color-grading": [
        "color grading",
        "lut",
        "davinci",
    ],
    "writing-translation.copywriting-content-marketing.brand-copywriting": [
        "copywriting",
        "brand voice",
        "messaging",
        "website copy",
    ],
    "writing-translation.copywriting-content-marketing.ads-landing-pages": [
        "landing page copy",
        "ad copy",
        "conversion copywriting",
        "sales page",
    ],
    "writing-translation.copywriting-content-marketing.email-crm-copy": [
        "email copy",
        "crm copy",
        "newsletter",
        "klaviyo",
    ],
    "writing-translation.technical-writing.api-documentation": [
        "api documentation",
        "developer docs",
        "swagger",
        "reference documentation",
    ],
    "writing-translation.technical-writing.sops-playbooks": [
        "sop",
        "playbook",
        "process documentation",
        "runbook",
    ],
    "writing-translation.technical-writing.rfp-proposal-writing": [
        "proposal writing",
        "rfp",
        "tender response",
        "grant proposal",
    ],
    "sales-marketing.digital-marketing.seo-sem": [
        "seo",
        "sem",
        "google ads",
        "search console",
        "keyword research",
    ],
    "sales-marketing.digital-marketing.email-marketing": [
        "email marketing",
        "newsletter",
        "klaviyo",
        "mailchimp",
        "retention email",
    ],
    "sales-marketing.digital-marketing.marketing-automation-crm": [
        "hubspot",
        "marketing automation",
        "crm automation",
        "salesforce",
        "lifecycle marketing",
    ],
    "sales-marketing.brand-communications.content-strategy": [
        "content strategy",
        "editorial calendar",
        "content planning",
    ],
    "sales-marketing.growth-performance.conversion-rate-optimization": [
        "cro",
        "conversion rate optimization",
        "landing page testing",
    ],
    "sales-marketing.growth-performance.funnel-analytics": [
        "funnel analytics",
        "attribution",
        "performance reporting",
    ],
    "customer-support.customer-service.email-chat-support": [
        "email support",
        "chat support",
        "ticketing",
        "zendesk",
        "intercom",
    ],
    "customer-support.customer-service.phone-support": [
        "phone support",
        "call center",
        "inbound calls",
        "outbound calls",
    ],
    "customer-support.customer-success.onboarding": [
        "customer onboarding",
        "implementation",
        "enablement",
    ],
    "customer-support.support-operations.knowledge-base-management": [
        "knowledge base",
        "help center",
        "documentation maintenance",
    ],
    "customer-support.community-trust-safety.community-moderation": [
        "community moderation",
        "forum moderation",
        "trust and safety",
    ],
    "finance-accounting.accounting-bookkeeping.ap-ar": [
        "accounts payable",
        "accounts receivable",
        "ap/ar",
        "bookkeeping",
        "invoice reconciliation",
    ],
    "finance-accounting.financial-planning-analysis-fp-a.budgeting-forecasting": [
        "budgeting",
        "forecasting",
        "fp&a",
        "financial planning",
    ],
    "human-resources.talent-acquisition.recruiting": [
        "recruiting",
        "candidate sourcing",
        "interviewing",
        "hiring pipeline",
    ],
    "human-resources.hr-operations.hris-administration": [
        "hris",
        "workday",
        "bamboohr",
        "employee records",
    ],
    "virtual-assistance.administrative-va.calendar-inbox-management": [
        "calendar management",
        "inbox management",
        "appointment scheduling",
    ],
    "virtual-assistance.research-data-va.data-entry": [
        "data entry",
        "spreadsheet cleanup",
        "crm updates",
    ],
    "virtual-assistance.social-media-va.scheduling-posts": [
        "schedule posts",
        "social media va",
        "content scheduling",
    ],
    "retail-e-commerce.online-store-operations.marketplace-integrations": [
        "marketplace integration",
        "shopify",
        "woocommerce",
        "amazon seller central",
    ],
    "retail-e-commerce.merchandising-category-management.pricing-promotions": [
        "pricing",
        "promotions",
        "merchandising",
    ],
    "retail-e-commerce.e-commerce-product-catalog.product-data-management": [
        "catalog management",
        "product data",
        "sku management",
        "listing quality",
    ],
}


SKILL_ALIASES: Dict[str, str] = {
    "react.js": "React",
    "reactjs": "React",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "expressjs": "Express",
    "express.js": "Express",
    "vuejs": "Vue",
    "vue.js": "Vue",
    "nuxtjs": "Nuxt.js",
    "nuxt.js": "Nuxt.js",
    "angularjs": "Angular",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "aws": "AWS",
    "gcp": "GCP",
    "azure": "Azure",
    "k8s": "Kubernetes",
    "terraform": "Terraform",
    "github actions": "GitHub Actions",
    "gitlab ci": "GitLab CI",
    "jenkins": "Jenkins",
    "fast api": "FastAPI",
    "fastapi": "FastAPI",
    "django rest framework": "Django",
    "drf": "Django",
    "react native": "React Native",
    "rn": "React Native",
    "flutter": "Flutter",
    "swiftui": "Swift",
    "kotlin": "Kotlin",
    "figma": "Figma",
    "fig jam": "FigJam",
    "adobe xd": "Adobe XD",
    "after effects": "After Effects",
    "premiere": "Premiere Pro",
    "premiere pro": "Premiere Pro",
    "davinci": "DaVinci Resolve",
    "davinci resolve": "DaVinci Resolve",
    "photoshop": "Adobe Photoshop",
    "illustrator": "Adobe Illustrator",
    "indesign": "Adobe InDesign",
    "seo/sem": "SEO/SEM",
    "seo": "SEO",
    "sem": "SEM",
    "ga4": "GA4",
    "google analytics": "Google Analytics",
    "google ads": "Google Ads",
    "meta ads": "Meta Ads",
    "hubspot": "HubSpot",
    "salesforce": "Salesforce",
    "klaviyo": "Klaviyo",
    "mailchimp": "Mailchimp",
    "copy writing": "Copywriting",
    "copywriter": "Copywriting",
    "content writing": "Content Writing",
    "technical writing": "Technical Writing",
    "api docs": "API Documentation",
    "api documentation": "API Documentation",
    "sops": "SOPs",
    "rfp": "RFP Writing",
    "payables": "Accounts Payable",
    "receivables": "Accounts Receivable",
    "ap/ar": "AP/AR",
    "fp&a": "FP&A",
    "quick books": "QuickBooks",
    "quickbooks": "QuickBooks",
    "xero": "Xero",
    "book keeping": "Bookkeeping",
    "bookkeeping": "Bookkeeping",
    "zendesk": "Zendesk",
    "intercom": "Intercom",
    "freshdesk": "Freshdesk",
    "customer success": "Customer Success",
    "sql": "SQL",
    "dbt": "dbt",
    "airflow": "Airflow",
    "snowflake": "Snowflake",
    "bigquery": "BigQuery",
    "power bi": "Power BI",
    "tableau": "Tableau",
    "looker": "Looker",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit learn": "scikit-learn",
    "scikit-learn": "scikit-learn",
    "rag": "RAG",
    "llm": "LLM",
    "llms": "LLM",
    "agentic ai": "AI Agents",
    "ai agents": "AI Agents",
    "openai api": "OpenAI API",
    "langchain": "LangChain",
    "vector db": "Vector Databases",
    "vector database": "Vector Databases",
    "vector databases": "Vector Databases",
    "embeddings": "Embeddings",
    "prompt engineering": "Prompt Engineering",
    "model evaluation": "Model Evaluation",
    "red teaming": "AI Red Teaming",
    "chatbot": "Conversational AI",
    "chatbots": "Conversational AI",
    "unity3d": "Unity",
    "unity": "Unity",
    "unreal": "Unreal Engine",
    "unreal engine": "Unreal Engine",
    "shopify": "Shopify",
    "woocommerce": "WooCommerce",
    "amazon seller central": "Amazon Seller Central",
    "data entry": "Data Entry",
    "virtual assistant": "Virtual Assistance",
    "calendar management": "Calendar Management",
    "email marketing": "Email Marketing",
    "crm": "CRM",
    "hris": "HRIS",
    "recruiting": "Recruiting",
    "sourcing": "Sourcing",
}


SKILL_CATEGORY_HINTS: Dict[str, List[str]] = {
    "React": ["software-it.application-development.web-application-development"],
    "Next.js": ["software-it.application-development.web-application-development"],
    "TypeScript": ["software-it.application-development.web-application-development"],
    "Node.js": ["software-it.application-development.web-application-development"],
    "Express": ["software-it.application-development.web-application-development"],
    "FastAPI": ["software-it.application-development.web-application-development"],
    "Django": ["software-it.application-development.web-application-development"],
    "React Native": ["software-it.application-development.mobile-application-development"],
    "Flutter": ["software-it.application-development.mobile-application-development"],
    "Swift": ["software-it.application-development.mobile-application-development"],
    "Kotlin": ["software-it.application-development.mobile-application-development"],
    "AWS": ["software-it.cloud-devops.cloud-architecture-migration"],
    "Azure": ["software-it.cloud-devops.cloud-architecture-migration"],
    "GCP": ["software-it.cloud-devops.cloud-architecture-migration"],
    "Terraform": ["software-it.cloud-devops.cloud-architecture-migration"],
    "Kubernetes": ["software-it.cloud-devops.site-reliability-engineering-sre"],
    "GitHub Actions": ["software-it.cloud-devops.ci-cd-build-engineering"],
    "Jenkins": ["software-it.cloud-devops.ci-cd-build-engineering"],
    "SQL": ["data-ai.data-engineering.etl-elt-pipelines", "data-ai.analytics-business-intelligence.dashboarding-reporting"],
    "dbt": ["data-ai.data-engineering.etl-elt-pipelines"],
    "Airflow": ["data-ai.data-engineering.etl-elt-pipelines"],
    "Snowflake": ["data-ai.data-engineering.data-warehousing"],
    "BigQuery": ["data-ai.data-engineering.data-warehousing"],
    "Power BI": ["data-ai.analytics-business-intelligence.dashboarding-reporting"],
    "Tableau": ["data-ai.analytics-business-intelligence.dashboarding-reporting"],
    "Looker": ["data-ai.analytics-business-intelligence.dashboarding-reporting"],
    "Machine Learning": ["data-ai.machine-learning-engineering.model-training-serving"],
    "TensorFlow": ["data-ai.machine-learning-engineering.model-training-serving"],
    "PyTorch": ["data-ai.machine-learning-engineering.model-training-serving"],
    "scikit-learn": ["data-ai.machine-learning-engineering.model-training-serving"],
    "RAG": ["data-ai.ai-product-ops-governance.prompt-engineering-llm-apps"],
    "LLM": ["data-ai.ai-product-ops-governance.prompt-engineering-llm-apps"],
    "Prompt Engineering": ["data-ai.ai-product-ops-governance.prompt-engineering-llm-apps"],
    "OpenAI API": ["data-ai.ai-product-ops-governance.prompt-engineering-llm-apps"],
    "LangChain": ["data-ai.ai-product-ops-governance.prompt-engineering-llm-apps"],
    "Vector Databases": ["data-ai.ai-product-ops-governance.prompt-engineering-llm-apps"],
    "Model Evaluation": ["data-ai.ai-product-ops-governance.ai-evaluation-red-teaming"],
    "AI Red Teaming": ["data-ai.ai-product-ops-governance.ai-evaluation-red-teaming"],
    "Conversational AI": ["data-ai.ai-product-ops-governance.conversational-ai-agents"],
    "AI Agents": ["data-ai.ai-product-ops-governance.conversational-ai-agents"],
    "Figma": ["design-creative.ux-ui-design.ui-design-systems"],
    "After Effects": ["design-creative.motion-interaction-design.motion-graphics"],
    "Adobe Illustrator": ["design-creative.graphic-visual-design.branding-identity"],
    "Adobe Photoshop": ["design-creative.graphic-visual-design.marketing-advertising-design"],
    "Premiere Pro": ["media-entertainment.film-video-production.video-editing"],
    "DaVinci Resolve": ["media-entertainment.film-video-production.video-editing", "media-entertainment.post-production-vfx.color-grading"],
    "Copywriting": ["writing-translation.copywriting-content-marketing.brand-copywriting"],
    "Content Writing": ["writing-translation.copywriting-content-marketing.brand-copywriting"],
    "Technical Writing": ["writing-translation.technical-writing.api-documentation"],
    "API Documentation": ["writing-translation.technical-writing.api-documentation"],
    "SOPs": ["writing-translation.technical-writing.sops-playbooks"],
    "RFP Writing": ["writing-translation.technical-writing.rfp-proposal-writing"],
    "SEO": ["sales-marketing.digital-marketing.seo-sem"],
    "SEM": ["sales-marketing.digital-marketing.seo-sem"],
    "Google Ads": ["sales-marketing.digital-marketing.seo-sem"],
    "Meta Ads": ["sales-marketing.digital-marketing.paid-social"],
    "Email Marketing": ["sales-marketing.digital-marketing.email-marketing"],
    "HubSpot": ["sales-marketing.digital-marketing.marketing-automation-crm"],
    "Salesforce": ["sales-marketing.digital-marketing.marketing-automation-crm"],
    "Klaviyo": ["sales-marketing.digital-marketing.email-marketing", "sales-marketing.digital-marketing.marketing-automation-crm"],
    "Zendesk": ["customer-support.customer-service.email-chat-support", "customer-support.support-operations.knowledge-base-management"],
    "Intercom": ["customer-support.customer-service.email-chat-support"],
    "Freshdesk": ["customer-support.customer-service.email-chat-support"],
    "Customer Success": ["customer-support.customer-success.onboarding"],
    "QuickBooks": ["finance-accounting.accounting-bookkeeping.ap-ar"],
    "Xero": ["finance-accounting.accounting-bookkeeping.ap-ar"],
    "Bookkeeping": ["finance-accounting.accounting-bookkeeping.ap-ar"],
    "FP&A": ["finance-accounting.financial-planning-analysis-fp-a.budgeting-forecasting"],
    "Recruiting": ["human-resources.talent-acquisition.recruiting"],
    "Sourcing": ["human-resources.talent-acquisition.sourcing"],
    "HRIS": ["human-resources.hr-operations.hris-administration"],
    "Shopify": ["retail-e-commerce.online-store-operations.marketplace-integrations"],
    "WooCommerce": ["retail-e-commerce.online-store-operations.marketplace-integrations"],
    "Amazon Seller Central": ["retail-e-commerce.online-store-operations.marketplace-integrations"],
    "Data Entry": ["virtual-assistance.research-data-va.data-entry"],
    "Virtual Assistance": ["virtual-assistance.administrative-va.calendar-inbox-management"],
    "Calendar Management": ["virtual-assistance.administrative-va.calendar-inbox-management"],
    "Unity": ["gaming-esports.game-development.gameplay-programming"],
    "Unreal Engine": ["gaming-esports.game-development.engine-development"],
}


DEFAULT_LEARNING_STATE = {
    "last_updated": None,
    "terms": {},
}


@dataclass
class TaxonomyNode:
    id: str
    label: str
    depth: int
    parent_id: Optional[str] = None
    children: List["TaxonomyNode"] = field(default_factory=list)


@dataclass
class Taxonomy:
    roots: List[TaxonomyNode]
    by_id: Dict[str, TaxonomyNode]
    leaves: List[TaxonomyNode]
    all_nodes: List[TaxonomyNode]


class PlatformTaxonomyEngine:
    def __init__(self, model_dir: str | Path):
        self.model_dir = Path(model_dir)
        self.repo_root = self.model_dir.parent.parent
        self.learning_store_path = self.model_dir / "taxonomy_learning.json"
        self._lock = threading.Lock()
        self.taxonomy = self._load_taxonomy()
        self.known_terms = self._build_known_terms()
        self.category_skill_index = self._build_category_skill_index()

    def reload(self) -> None:
        self.taxonomy = self._load_taxonomy()
        self.known_terms = self._build_known_terms()
        self.category_skill_index = self._build_category_skill_index()

    def status(self) -> Dict[str, Any]:
        return {
            "taxonomyLoaded": bool(self.taxonomy.roots),
            "taxonomyRoots": len(self.taxonomy.roots),
            "taxonomyLeaves": len(self.taxonomy.leaves),
            "taxonomyLearningPath": str(self.learning_store_path),
        }

    def classify(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        item_type = str(payload.get("type", "") or "").strip().lower()
        title = str(payload.get("title", "") or "").strip()
        description = str(payload.get("description", "") or "").strip()
        raw_skills = payload.get("skills") or []
        metadata = payload.get("metadata") or {}
        existing_taxonomy = payload.get("existing_taxonomy") or {}

        normalized_type = item_type if item_type in {"job", "talent", "project", "profile", "identity", "settings"} else "project"
        sections = self._build_sections(normalized_type, title, description, raw_skills, metadata)
        standardized_skills, merged_terms = self._extract_skills(raw_skills, title, description, metadata)

        root_scores = self._score_roots(sections, standardized_skills)
        leaf_scores = self._score_leaves(sections, standardized_skills, root_scores)

        best_leaf = self._best_node(leaf_scores)
        best_root = self._best_node(root_scores)
        selected_leaf = best_leaf or self._fallback_leaf_for_root(best_root)
        selected_root = self.taxonomy.by_id.get(selected_leaf.parent_id.split(".")[0]) if selected_leaf and selected_leaf.parent_id else best_root
        if selected_root is None and best_root is not None:
            selected_root = best_root
        if selected_root is None and self.taxonomy.roots:
            selected_root = self.taxonomy.roots[0]

        confidence = self._calculate_confidence(root_scores, leaf_scores)
        recommendations = self._build_recommendations(normalized_type, selected_leaf, standardized_skills, title, description, metadata, leaf_scores)
        expertise = self._infer_expertise(normalized_type, title, description, metadata)

        learning_term = None
        if confidence < 0.75:
            candidate_terms = self._extract_learning_terms(title, raw_skills, standardized_skills)
            dominant_parent = selected_root.label if selected_root else ""
            learning_term = self._record_learning(candidate_terms, dominant_parent, normalized_type)
        suggested_new_category = self._build_new_category_suggestion(
            confidence=confidence,
            learning_term=learning_term,
            existing_taxonomy_terms=self._flatten_existing_taxonomy(existing_taxonomy),
            selected_root=selected_root,
        )

        return {
            "type": normalized_type,
            "category": selected_root.label if selected_root else "",
            "subcategory": selected_leaf.label if selected_leaf else "",
            "skills": recommendations["selected_skills"],
            "expertise_level": expertise,
            "confidence": round(confidence, 4),
            "is_new_category": bool(suggested_new_category["name"]),
            "suggested_new_category": suggested_new_category,
            "normalization": {
                "merged_terms": merged_terms,
                "standardized_skills": standardized_skills,
            },
            "recommendations": {
                "suggested_categories": recommendations["suggested_categories"],
                "related_skills": recommendations["related_skills"],
                "profile_improvements": recommendations["profile_improvements"],
            },
        }

    def learning_summary(self) -> Dict[str, Any]:
        state = self._load_learning_state()
        ranked = sorted(
            (
                {
                    "term": term,
                    "count": int(data.get("count", 0)),
                    "trend_score": int(self._trend_score(data)),
                    "suggested_parent": str(data.get("dominant_parent", "")),
                    "types": sorted(list(data.get("types", []))) if isinstance(data.get("types"), set) else sorted(list(data.get("types", []))),
                    "last_seen": data.get("last_seen"),
                }
                for term, data in state.get("terms", {}).items()
            ),
            key=lambda item: (item["trend_score"], item["count"], item["term"]),
            reverse=True,
        )
        return {
            "last_updated": state.get("last_updated"),
            "tracked_terms": ranked[:25],
        }

    def _load_taxonomy(self) -> Taxonomy:
        source_file = self.repo_root / "frontend" / "src" / "lib" / "jobTaxonomySource.ts"
        source = self._read_taxonomy_source(source_file)
        return self._build_taxonomy(source)

    def _read_taxonomy_source(self, path: Path) -> str:
        if not path.exists():
            return DEFAULT_TAXONOMY_SOURCE

        text = path.read_text(encoding="utf-8")
        match = re.search(r"JOB_TAXONOMY_SOURCE\s*=\s*`(?P<body>.*)`;", text, re.DOTALL)
        if not match:
            return DEFAULT_TAXONOMY_SOURCE
        return match.group("body")

    def _build_taxonomy(self, source: str) -> Taxonomy:
        roots: List[TaxonomyNode] = []
        by_id: Dict[str, TaxonomyNode] = {}
        leaves: List[TaxonomyNode] = []
        all_nodes: List[TaxonomyNode] = []
        counts: Dict[str, Dict[str, int]] = defaultdict(dict)

        current_root: Optional[TaxonomyNode] = None
        current_sub: Optional[TaxonomyNode] = None

        for raw_line in source.splitlines():
            line = raw_line.rstrip()
            if not line.strip():
                continue

            connector_match = re.search(r"[├└]─\s*(.+)$", line)
            if not connector_match:
                label = line.strip()
                node_id = self._dedupe_slug("__root__", self._slugify(label), counts)
                node = TaxonomyNode(id=node_id, label=label, depth=0)
                roots.append(node)
                by_id[node.id] = node
                all_nodes.append(node)
                current_root = node
                current_sub = None
                continue

            label = connector_match.group(1).strip()
            connector_pos = max(line.find("├─"), line.find("└─"))
            depth = 1 if connector_pos <= 2 else 2
            parent = current_root if depth == 1 else current_sub
            if parent is None:
                continue

            slug = self._dedupe_slug(parent.id, self._slugify(label), counts)
            node = TaxonomyNode(id=f"{parent.id}.{slug}", label=label, depth=depth, parent_id=parent.id)
            parent.children.append(node)
            by_id[node.id] = node
            all_nodes.append(node)
            if depth == 1:
                current_sub = node
            else:
                leaves.append(node)

        return Taxonomy(roots=roots, by_id=by_id, leaves=leaves, all_nodes=all_nodes)

    def _build_known_terms(self) -> Set[str]:
        terms: Set[str] = set()
        for node in self.taxonomy.all_nodes:
            terms.add(self._normalize_phrase(node.label))
            for segment in self._path_labels(node):
                terms.add(self._normalize_phrase(segment))

        for alias, canonical in SKILL_ALIASES.items():
            terms.add(self._normalize_phrase(alias))
            terms.add(self._normalize_phrase(canonical))

        for phrases in ROOT_HINTS.values():
            for phrase in phrases:
                terms.add(self._normalize_phrase(phrase))

        for phrases in CATEGORY_HINTS.values():
            for phrase in phrases:
                terms.add(self._normalize_phrase(phrase))

        return {term for term in terms if term}

    def _build_category_skill_index(self) -> Dict[str, List[str]]:
        grouped: Dict[str, List[str]] = defaultdict(list)
        for skill, category_ids in SKILL_CATEGORY_HINTS.items():
            for category_id in category_ids:
                grouped[category_id].append(skill)
                root_id = category_id.split(".")[0]
                grouped[root_id].append(skill)
        return {key: self._unique_preserve(values) for key, values in grouped.items()}

    def _build_sections(
        self,
        item_type: str,
        title: str,
        description: str,
        skills: Iterable[Any],
        metadata: Any,
    ) -> Dict[str, Dict[str, Any]]:
        skill_text = " ".join(str(skill).strip() for skill in skills if str(skill).strip())
        metadata_text = self._metadata_to_text(metadata)
        preferences = self._extract_preferences(metadata)

        sections = {
            "title": {"text": self._normalize_phrase(title), "weight": 1.8},
            "description": {"text": self._normalize_phrase(description), "weight": 1.0},
            "skills": {"text": self._normalize_phrase(skill_text), "weight": 1.7},
            "metadata": {"text": self._normalize_phrase(metadata_text), "weight": 1.0},
            "preferences": {"text": self._normalize_phrase(preferences), "weight": 0.8},
        }

        if item_type == "job":
            sections["description"]["weight"] = 1.3
            sections["skills"]["weight"] = 2.0
        elif item_type == "talent":
            sections["title"]["weight"] = 1.6
            sections["skills"]["weight"] = 2.1
        elif item_type == "project":
            sections["description"]["weight"] = 1.4
        elif item_type == "profile":
            sections["skills"]["weight"] = 1.9
            sections["metadata"]["weight"] = 1.3
        elif item_type == "identity":
            sections["metadata"]["weight"] = 1.8
            sections["skills"]["weight"] = 1.0
        elif item_type == "settings":
            sections["preferences"]["weight"] = 2.2
            sections["skills"]["weight"] = 1.3

        return sections

    def _score_roots(self, sections: Dict[str, Dict[str, Any]], skills: List[str]) -> Dict[str, float]:
        scores = {root.id: 0.0 for root in self.taxonomy.roots}
        for root in self.taxonomy.roots:
            phrases = {root.label, *ROOT_HINTS.get(root.id, [])}
            for section in sections.values():
                scores[root.id] += self._match_score(section["text"], phrases, section["weight"])

        for skill in skills:
            for category_id in SKILL_CATEGORY_HINTS.get(skill, []):
                root_id = category_id.split(".")[0]
                if root_id in scores:
                    scores[root_id] += 3.5

        return scores

    def _score_leaves(
        self,
        sections: Dict[str, Dict[str, Any]],
        skills: List[str],
        root_scores: Dict[str, float],
    ) -> Dict[str, float]:
        scores: Dict[str, float] = {}
        for leaf in self.taxonomy.leaves:
            path = self._path_labels(leaf)
            phrases = set(path + CATEGORY_HINTS.get(leaf.id, []))
            total = 0.0
            for section in sections.values():
                total += self._match_score(section["text"], phrases, section["weight"])

            for skill in skills:
                if leaf.id in SKILL_CATEGORY_HINTS.get(skill, []):
                    total += 4.5
                elif leaf.id.split(".")[0] in SKILL_CATEGORY_HINTS.get(skill, []):
                    total += 1.5

            root_id = leaf.id.split(".")[0]
            total += root_scores.get(root_id, 0.0) * 0.25
            scores[leaf.id] = total
        return scores

    def _best_node(self, scores: Dict[str, float]) -> Optional[TaxonomyNode]:
        if not scores:
            return None
        best_id, best_score = max(scores.items(), key=lambda item: item[1])
        if best_score <= 0:
            return None
        return self.taxonomy.by_id.get(best_id)

    def _fallback_leaf_for_root(self, root: Optional[TaxonomyNode]) -> Optional[TaxonomyNode]:
        if root is None:
            return None
        for leaf in self.taxonomy.leaves:
            if leaf.id.startswith(f"{root.id}."):
                return leaf
        return None

    def _calculate_confidence(self, root_scores: Dict[str, float], leaf_scores: Dict[str, float]) -> float:
        ranked_leaves = sorted(leaf_scores.values(), reverse=True)
        ranked_roots = sorted(root_scores.values(), reverse=True)
        best_leaf = ranked_leaves[0] if ranked_leaves else 0.0
        next_leaf = ranked_leaves[1] if len(ranked_leaves) > 1 else 0.0
        best_root = ranked_roots[0] if ranked_roots else 0.0
        next_root = ranked_roots[1] if len(ranked_roots) > 1 else 0.0

        if best_leaf <= 0 and best_root <= 0:
            return 0.0

        margin = best_leaf / max(best_leaf + next_leaf, 1.0)
        root_margin = best_root / max(best_root + next_root, 1.0)
        strength = min(best_leaf / 18.0, 1.0)
        return max(0.0, min(1.0, (margin * 0.45) + (root_margin * 0.2) + (strength * 0.35)))

    def _build_recommendations(
        self,
        item_type: str,
        selected_leaf: Optional[TaxonomyNode],
        standardized_skills: List[str],
        title: str,
        description: str,
        metadata: Any,
        leaf_scores: Dict[str, float],
    ) -> Dict[str, Any]:
        related_skills: List[str] = []
        suggested_categories: List[str] = []
        if selected_leaf is not None:
            related_skills.extend(self.category_skill_index.get(selected_leaf.id, []))
            related_skills.extend(self.category_skill_index.get(selected_leaf.id.split(".")[0], []))

        top_leaves = sorted(leaf_scores.items(), key=lambda item: item[1], reverse=True)[:3]
        for leaf_id, score in top_leaves:
            if score <= 0:
                continue
            node = self.taxonomy.by_id.get(leaf_id)
            if node is None:
                continue
            suggested_categories.append(" > ".join(self._path_labels(node)))

        selected_skills = self._unique_preserve(standardized_skills + related_skills)[:10]
        if len(selected_skills) < 3:
            selected_skills = self._unique_preserve(selected_skills + related_skills + self._extract_keyword_skills(title, description))[:10]

        profile_improvements: List[str] = []
        if item_type in {"profile", "talent"}:
            if len(standardized_skills) < 3:
                profile_improvements.append("Add at least 3 role-specific skills to improve matching precision.")
            if len(description.strip()) < 80:
                profile_improvements.append("Expand the summary with tools, scope, and measurable outcomes.")
            if not self._infer_expertise(item_type, title, description, metadata):
                profile_improvements.append("Include years of experience or seniority signals for better expertise inference.")
            if selected_leaf is not None:
                profile_improvements.append(f"Align portfolio examples and headlines to {selected_leaf.label}.")
        elif item_type == "profile":
            profile_improvements.append("Add missing verification and preference details to strengthen category recommendations.")

        return {
            "selected_skills": selected_skills[:10],
            "related_skills": self._unique_preserve(related_skills)[:10],
            "suggested_categories": suggested_categories,
            "profile_improvements": self._unique_preserve(profile_improvements),
        }

    def _infer_expertise(self, item_type: str, title: str, description: str, metadata: Any) -> Optional[str]:
        if item_type in {"identity", "settings"}:
            return None

        text = " ".join(
            [
                str(title or ""),
                str(description or ""),
                self._metadata_to_text(metadata),
            ]
        ).lower()

        years = self._extract_years(text)
        if years is not None:
            if years < 2:
                return "beginner"
            if years >= 5:
                return "expert"
            if re.search(r"\b(senior|lead|principal|staff|architect|expert|head of)\b", text) and years >= 4:
                return "expert"
            return "intermediate"

        if re.search(r"\b(junior|entry level|entry-level|assistant|intern|trainee)\b", text):
            return "beginner"
        if re.search(r"\b(senior|lead|principal|staff|architect|expert|head of)\b", text):
            return "expert"
        if text.strip():
            return "intermediate"
        return None

    def _extract_learning_terms(
        self,
        title: str,
        raw_skills: Iterable[Any],
        standardized_skills: List[str],
    ) -> List[str]:
        candidates: List[str] = []

        for skill in raw_skills:
            raw = str(skill or "").strip()
            if not raw:
                continue
            normalized = self._normalize_phrase(raw)
            if normalized and normalized not in self.known_terms:
                candidates.append(raw)

        for phrase in self._candidate_phrases(title):
            normalized = self._normalize_phrase(phrase)
            if normalized and normalized not in self.known_terms:
                candidates.append(phrase)

        for skill in standardized_skills:
            normalized = self._normalize_phrase(skill)
            if normalized and normalized not in self.known_terms:
                candidates.append(skill)

        return self._unique_preserve([self._clean_learning_term(candidate) for candidate in candidates if self._clean_learning_term(candidate)])

    def _record_learning(self, terms: List[str], dominant_parent: str, item_type: str) -> Optional[Dict[str, Any]]:
        if not terms:
            return None

        with self._lock:
            state = self._load_learning_state()
            terms_state = state.setdefault("terms", {})
            now = self._utc_now()

            for term in terms:
                key = self._normalize_phrase(term)
                if not key:
                    continue
                record = terms_state.get(key, {})
                record["term"] = term
                record["count"] = int(record.get("count", 0)) + 1
                record["last_seen"] = now
                record["dominant_parent"] = dominant_parent or str(record.get("dominant_parent", ""))
                record_types = set(record.get("types", []))
                record_types.add(item_type)
                record["types"] = sorted(record_types)
                terms_state[key] = record

            state["last_updated"] = now
            self._save_learning_state(state)

            ranked = sorted(
                terms_state.values(),
                key=lambda item: (self._trend_score(item), int(item.get("count", 0))),
                reverse=True,
            )
            return ranked[0] if ranked else None

    def _build_new_category_suggestion(
        self,
        confidence: float,
        learning_term: Optional[Dict[str, Any]],
        existing_taxonomy_terms: Set[str],
        selected_root: Optional[TaxonomyNode],
    ) -> Dict[str, Any]:
        empty = {
            "parent": "",
            "name": "",
            "reason": "",
            "trend_score": 0,
        }

        if confidence >= 0.75 or not learning_term:
            return empty

        candidate_name = self._display_term(learning_term.get("term", ""))
        candidate_norm = self._normalize_phrase(candidate_name)
        if not candidate_norm:
            return empty
        if candidate_norm in existing_taxonomy_terms or candidate_norm in self.known_terms:
            return empty
        if self._is_near_duplicate(candidate_norm, existing_taxonomy_terms | self.known_terms):
            return empty

        trend_score = self._trend_score(learning_term)
        if trend_score < 35:
            return empty

        parent = str(learning_term.get("dominant_parent") or (selected_root.label if selected_root else ""))
        count = int(learning_term.get("count", 0))
        types = learning_term.get("types", [])
        reason = f"Recurring unmatched term seen {count} times across {len(types)} input type(s), with strongest fit under {parent or 'existing taxonomy'}."

        return {
            "parent": parent,
            "name": candidate_name,
            "reason": reason,
            "trend_score": int(trend_score),
        }

    def _flatten_existing_taxonomy(self, existing_taxonomy: Any) -> Set[str]:
        terms: Set[str] = set()

        def visit(value: Any) -> None:
            if isinstance(value, dict):
                for key, inner in value.items():
                    if key.lower() in {"name", "label", "title", "category", "subcategory", "id"} and isinstance(inner, str):
                        normalized = self._normalize_phrase(inner)
                        if normalized:
                            terms.add(normalized)
                    visit(inner)
            elif isinstance(value, list):
                for item in value:
                    visit(item)
            elif isinstance(value, str):
                normalized = self._normalize_phrase(value)
                if normalized and len(normalized.split()) <= 6:
                    terms.add(normalized)

        visit(existing_taxonomy)
        return terms

    def _extract_skills(
        self,
        raw_skills: Iterable[Any],
        title: str,
        description: str,
        metadata: Any,
    ) -> tuple[List[str], List[str]]:
        merged_terms: List[str] = []
        found: List[str] = []

        for raw in raw_skills:
            canonical = self._canonicalize_skill(str(raw or ""))
            if canonical:
                found.append(canonical)
                raw_text = str(raw or "").strip()
                if raw_text and self._normalize_phrase(raw_text) != self._normalize_phrase(canonical):
                    merged_terms.append(f"{raw_text} -> {canonical}")

        scan_text = " ".join([title, description, self._metadata_to_text(metadata)]).lower()
        for alias, canonical in SKILL_ALIASES.items():
            if self._contains_phrase(scan_text, alias):
                found.append(canonical)

        return self._unique_preserve(found)[:10], self._unique_preserve(merged_terms)

    def _extract_keyword_skills(self, title: str, description: str) -> List[str]:
        found: List[str] = []
        scan_text = " ".join([title, description]).lower()
        for alias, canonical in SKILL_ALIASES.items():
            if self._contains_phrase(scan_text, alias):
                found.append(canonical)
        return self._unique_preserve(found)

    def _canonicalize_skill(self, value: str) -> str:
        normalized = self._normalize_phrase(value)
        if not normalized:
            return ""
        if normalized in SKILL_ALIASES:
            return SKILL_ALIASES[normalized]
        for alias, canonical in SKILL_ALIASES.items():
            if normalized == alias:
                return canonical
        if value.strip():
            return self._display_term(value)
        return ""

    def _match_score(self, text: str, phrases: Iterable[str], section_weight: float) -> float:
        total = 0.0
        token_set = set(text.split())
        for phrase in phrases:
            normalized = self._normalize_phrase(phrase)
            if not normalized:
                continue
            if self._contains_phrase(text, normalized):
                total += section_weight * (2.2 + min(1.8, len(normalized.split()) * 0.45))
                continue

            phrase_tokens = [token for token in normalized.split() if token and token not in STOPWORDS]
            if len(phrase_tokens) >= 2:
                overlap = sum(1 for token in phrase_tokens if token in token_set)
                if overlap >= max(2, len(phrase_tokens) - 1):
                    total += section_weight * (1.2 + (0.3 * overlap))
        return total

    def _contains_phrase(self, text: str, phrase: str) -> bool:
        if not text or not phrase:
            return False
        return bool(re.search(rf"\b{re.escape(phrase)}\b", text))

    def _path_labels(self, node: TaxonomyNode) -> List[str]:
        labels = [node.label]
        current = node
        while current.parent_id:
            parent = self.taxonomy.by_id.get(current.parent_id)
            if parent is None:
                break
            labels.append(parent.label)
            current = parent
        return list(reversed(labels))

    def _metadata_to_text(self, metadata: Any) -> str:
        if metadata is None:
            return ""
        if isinstance(metadata, str):
            return metadata
        if isinstance(metadata, dict):
            parts: List[str] = []
            for key, value in metadata.items():
                if value in (None, "", [], {}):
                    continue
                if isinstance(value, (list, tuple, set)):
                    joined = " ".join(str(item) for item in value if str(item).strip())
                    if joined:
                        parts.append(f"{key} {joined}")
                else:
                    parts.append(f"{key} {value}")
            return " ".join(parts)
        if isinstance(metadata, (list, tuple, set)):
            return " ".join(str(item) for item in metadata if str(item).strip())
        return str(metadata)

    def _extract_preferences(self, metadata: Any) -> str:
        if not isinstance(metadata, dict):
            return ""
        for key in ("preferences", "interests", "settings", "preferred_categories"):
            value = metadata.get(key)
            if value:
                return self._metadata_to_text(value)
        return ""

    def _extract_years(self, text: str) -> Optional[int]:
        match = re.search(r"(\d+)\s*\+?\s*(?:years|yrs)", text)
        if not match:
            return None
        try:
            return int(match.group(1))
        except ValueError:
            return None

    def _candidate_phrases(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^A-Za-z0-9+/#&.\-\s]", " ", text)
        words = [word for word in cleaned.split() if word]
        phrases: List[str] = []
        for size in (2, 3):
            for idx in range(len(words) - size + 1):
                chunk = words[idx : idx + size]
                lowered = [word.lower() for word in chunk]
                if any(word in STOPWORDS for word in lowered):
                    continue
                phrase = " ".join(chunk)
                if len(phrase) >= 6:
                    phrases.append(phrase)
        return self._unique_preserve(phrases)[:12]

    def _clean_learning_term(self, value: str) -> str:
        cleaned = re.sub(r"\s+", " ", str(value or "")).strip(" ,.-")
        if len(cleaned) < 4:
            return ""
        if cleaned.lower() in STOPWORDS:
            return ""
        return cleaned[:80]

    def _is_near_duplicate(self, candidate: str, existing_terms: Set[str]) -> bool:
        for term in existing_terms:
            if not term:
                continue
            similarity = SequenceMatcher(None, candidate, term).ratio()
            if similarity >= 0.9:
                return True
        return False

    def _trend_score(self, record: Dict[str, Any]) -> int:
        count = int(record.get("count", 0))
        types = record.get("types", [])
        type_count = len(types) if isinstance(types, list) else len(list(types))
        return min(100, (count * 18) + (type_count * 8))

    def _load_learning_state(self) -> Dict[str, Any]:
        if not self.learning_store_path.exists():
            return dict(DEFAULT_LEARNING_STATE)
        try:
            state = json.loads(self.learning_store_path.read_text(encoding="utf-8"))
        except Exception:
            return dict(DEFAULT_LEARNING_STATE)
        if not isinstance(state, dict):
            return dict(DEFAULT_LEARNING_STATE)
        state.setdefault("last_updated", None)
        state.setdefault("terms", {})
        return state

    def _save_learning_state(self, state: Dict[str, Any]) -> None:
        self.learning_store_path.parent.mkdir(parents=True, exist_ok=True)
        self.learning_store_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

    def _slugify(self, value: str) -> str:
        normalized = value.strip().lower().replace("&", " ").replace("+", " plus ").replace("/", " ")
        normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
        normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
        return normalized or "unknown"

    def _dedupe_slug(self, parent_key: str, slug_base: str, counts: Dict[str, Dict[str, int]]) -> str:
        by_slug = counts.setdefault(parent_key, {})
        next_count = by_slug.get(slug_base, 0) + 1
        by_slug[slug_base] = next_count
        return slug_base if next_count == 1 else f"{slug_base}-{next_count}"

    def _normalize_phrase(self, value: str) -> str:
        lowered = str(value or "").strip().lower()
        lowered = lowered.replace("&", " and ")
        lowered = lowered.replace("/", " ")
        lowered = re.sub(r"[^a-z0-9+.#\s-]", " ", lowered)
        lowered = re.sub(r"\s+", " ", lowered).strip()
        return lowered

    def _display_term(self, value: str) -> str:
        stripped = str(value or "").strip()
        if not stripped:
            return ""
        canonical = SKILL_ALIASES.get(self._normalize_phrase(stripped))
        if canonical:
            return canonical
        if stripped.isupper() and len(stripped) <= 6:
            return stripped
        words = []
        for part in re.split(r"\s+", stripped):
            if part.upper() in {"AI", "ML", "LLM", "CRM", "ERP", "SEO", "SEM", "SRE", "API", "QA", "UI", "UX", "FP&A", "HRIS"}:
                words.append(part.upper())
            else:
                words.append(part[:1].upper() + part[1:])
        return " ".join(words)

    def _utc_now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _unique_preserve(self, values: Iterable[str]) -> List[str]:
        seen: Set[str] = set()
        output: List[str] = []
        for value in values:
            if not value:
                continue
            key = self._normalize_phrase(value)
            if key in seen:
                continue
            seen.add(key)
            output.append(value)
        return output
