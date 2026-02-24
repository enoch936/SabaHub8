UNIVERSITY OF GONDAR
COLLEGE OF INFORMATICS
DEPARTMENT OF COMPUTER SCIENCE

PROJECT TITLE: SabaHub — Enterprise Online Work Platform

NAME					ID NO.
Gebretsadik Woldesenbet		00130/17
Abeje Ambaye			00129/17
Getachew Kass			00115/17
Dereje Abebe			00182/17
Yared Alemayehu			00133/17

Submitted to the Department of Computer Science, College of Informatics, University of Gondar, in partial fulfillment of the requirements for the award of Bachelor of Science Degree in Computer Science.

Advisor: Mr. Belayneh
Gondar, Ethiopia
Date: February 2026

APPROVAL SHEET
This is to certify that the project entitled “SabaHub: Online Work Platform” is a record of original work carried out by:

Name				ID No.		Signature
Gebretsadik Woldesenbet	00130/17	__________
Abeje Ambaye		00129/17	__________
Getachew Kass		00115/17	__________
Dereje Abebe		00182/17	__________
Yared Alemayehu		00133/17	__________

Submitted to the Department of Computer Science, College of Informatics, University of Gondar, in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science.

Approved by Board of Examiners:
1. Advisor Name: Mr. Belayneh Signature: ____________________ Date: ____________________
2. Internal Examiner Name: ________________________ Signature: ____________________ Date: ____________________
3. External Examiner Name: ________________________ Signature: ____________________ Date: ____________________
4. Chairperson (Department Head) Name: ________________________ Signature: ____________________ Date: ____________________

ACKNOWLEDGMENT
First and foremost, we would like to express our deepest gratitude to the Almighty God for providing us with the strength, wisdom, and perseverance required to complete this project successfully.
We extend our heartfelt thanks to our advisor, Mr. Belayneh, for his invaluable guidance, constructive criticism, and continuous encouragement throughout the development of this project. His expertise and insights were instrumental in shaping the technical and professional aspects of the SabaHub platform.
We would also like to thank the University of Gondar, College of Informatics, and specifically the Department of Computer Science, for providing the academic environment and resources necessary for our studies. Our appreciation also goes to all our instructors who have shared their knowledge and skills with us over the past years.
Our deepest gratitude goes to our families and friends for their unwavering moral and financial support, patience, and prayers, which kept us motivated during the most challenging phases of this work.
Finally, we would like to thank our fellow group members for their cooperation, hard work, and team spirit, which made the realization of this project possible.

TABLE OF CONTENTS
TITLE PAGE ................................................................................................................................. i
APPROVAL SHEET ....................................................................................................................... ii
ACKNOWLEDGMENT ................................................................................................................... iii
LIST OF FIGURES ........................................................................................................................ v
LIST OF TABLES .......................................................................................................................... vi
USED ACRONYMS ....................................................................................................................... vii
CHAPTER 1: INTRODUCTION ..................................................................................................... 1
	1.1 Background of the Project ................................................................................................... 1
	1.2 Statement of the Problem .................................................................................................... 2
	1.3 Justification for the Project ................................................................................................. 3
	1.4 Objectives of the Project ..................................................................................................... 4
		1.4.1 General Objective ......................................................................................................... 4
		1.4.2 Specific Objectives ....................................................................................................... 4
	1.5 System Development Methodology ..................................................................................... 5
	1.6 Tools and Technologies ....................................................................................................... 6
	1.7 Scope of the Project ............................................................................................................ 8
	1.8 Limitations of the Project .................................................................................................... 9
	1.9 Significance of the Project .................................................................................................. 10
	1.10 Feasibility Study ............................................................................................................... 12
	1.11 Risk Assessment ............................................................................................................... 14
	1.12 Work Breakdown Structure (WBS) .................................................................................. 17
	1.13 Project Budget .................................................................................................................. 18
CHAPTER 2: REQUIREMENT ANALYSIS AND SPECIFICATION ............................................... 19
	2.1 Overview of the Current System ......................................................................................... 19
	2.2 Requirement Gathering ....................................................................................................... 22
		2.2.1 Gathering Methods and Business Rules ....................................................................... 23
	2.3 Proposed System ................................................................................................................. 24
		2.3.1 Functional Requirements ............................................................................................. 25
		2.3.2 Non-functional Requirements ...................................................................................... 27
CHAPTER 3: SYSTEM MODEL ................................................................................................... 30
	3.1 System Scenarios ................................................................................................................ 30
	3.2 Use Case Model .................................................................................................................. 30
		3.2.1 Use Case Diagram ....................................................................................................... 32
		3.2.2 Use Case Descriptions ................................................................................................. 34
	3.3 Sequence Diagram .............................................................................................................. 38
	3.4 Activity Diagram ................................................................................................................. 41
	3.5 Object and Class Modeling ................................................................................................. 45
	3.6 User Interface Design ......................................................................................................... 48
CHAPTER 4: SYSTEM DESIGN .................................................................................................. 50
	4.1 Introduction to Design Phase ............................................................................................. 50
	4.2 Proposed Software Architecture ......................................................................................... 51
	4.3 System Decomposition ........................................................................................................ 52
	4.4 Persistent Data Modeling (Database Design) ..................................................................... 55
	4.5 Access Control and Security Design .................................................................................. 57
	4.6 Deployment Diagram .......................................................................................................... 61
CHAPTER 5: IMPLEMENTATION AND INTEGRATION ............................................................ 63
	5.1 Backend Implementation ..................................................................................................... 63
	5.2 Frontend Implementation .................................................................................................... 67
	5.3 Media and Cloud Integration .............................................................................................. 71
	5.4 Identity Verification Workflow ............................................................................................ 73
	5.5 Data Persistence and Indexing ........................................................................................... 75
CHAPTER 6: TESTING, EVALUATION, AND QA ........................................................................ 78
	6.1 Test Strategy ....................................................................................................................... 78
	6.2 Unit and Integration Tests .................................................................................................. 79
	6.3 Security and Performance Tests ......................................................................................... 81
	6.4 User Acceptance Testing .................................................................................................... 83
CONCLUSION AND RECOMMENDATIONS ............................................................................... 86
REFERENCES .............................................................................................................................. 89
APPENDICES ............................................................................................................................... 91

LIST OF FIGURES
Figure 1.1 Gantt chart for project timeline ............................................................................. 25
Figure 3.1 Use Case diagram ................................................................................................. 43
Figure 3.2 Sequence diagram for registration ...................................................................... 49
Figure 3.3 Sequence diagram for job creation ..................................................................... 50
Figure 3.4 Sequence diagram for job browsing .................................................................... 51
Figure 3.5 Activity diagram for login .................................................................................... 52
Figure 3.6 Activity diagram for identity verification ............................................................ 53
Figure 3.7 Activity diagram for admin audit ........................................................................ 54
Figure 3.8 Activity diagram for portfolio upload ................................................................. 55
Figure 3.9 State Machine diagram for verification .............................................................. 56
Figure 4.1 Subsystem decomposition diagram .................................................................... 61
Figure 4.2 Persistence data management diagram .............................................................. 64
Figure 4.3 Class diagram for platform core .......................................................................... 67
Figure 4.4 Package diagram for platform services .............................................................. 68
Figure 4.5 Deployment diagram ........................................................................................... 69

LIST OF TABLES
Table 1.0 Budget description ............................................................................................... 29
Table 2.1 Functional requirements summary ....................................................................... 27
Table 2.2 Non-functional requirements summary ............................................................... 28
Table 3.1 Use case description for login ............................................................................. 46
Table 3.2 Use case description for job creation .................................................................. 47
Table 3.3 Use case description for submit proposal ............................................................ 48
Table 3.4 Use case description for verification ................................................................... 49
Table 4.1 Security and access control matrix ...................................................................... 68
Table 5.1 API integration checklist ..................................................................................... 74
Table 6.1 Test case matrix ................................................................................................... 82

USED ACRONYMS
API	Application Programming Interface
BSc	Bachelor of Science
CDN	Content Delivery Network
CSS	Cascading Style Sheets
ERD	Entity Relationship Diagram
FR	Functional Requirement
GUI	Graphical User Interface
HTML	HyperText Markup Language
HTTP	HyperText Transfer Protocol
ICT	Information and Communication Technology
IDE	Integrated Development Environment
IT	Information Technology
JSON	JavaScript Object Notation
JS	JavaScript
JWT	JSON Web Token
NFR	Non-Functional Requirement
REST	Representational State Transfer
RBAC	Role-Based Access Control
SMS	Short Message Service
UML	Unified Modeling Language
URL	Uniform Resource Locator
WBS	Work Breakdown Structure

CHAPTER ONE: INTRODUCTION
1.1 Background of the Project
The rapid evolution of Information and Communication Technology (ICT) has fundamentally shifted the global labor market, transitioning traditional, localized employment models toward a flexible gig economy. As demand for specialized services increased, online freelance platforms emerged as critical bridges connecting service providers with global clientele. However, the rise of these digital spaces has been accompanied by significant challenges regarding security, authenticity, and professional representation.

SabaHub was designed as an enterprise-grade, web-based solution to address these infrastructure gaps. The project aimed to create a secure and scalable environment for professional service exchange by integrating advanced identity verification and cloud-based media management. The system leverages Spring Boot for robust business logic, Next.js for an immersive user interface, MongoDB for flexible data storage, and Cloudinary for optimized media delivery.

1.2 Statement of the Problem and Justification
Despite the adoption of digital work platforms, systemic failures persist: weak verification, limited profiles, multimedia bottlenecks, and security gaps. SabaHub addresses these with a trust-first model, enterprise-grade security, and cloud-native scalability.

1.3 Objectives of the Project
General Objective: Build a secure, scalable, and user-centered freelance marketplace with verified identities and enterprise media handling.
Specific Objectives: Profile management, secure auth, identity verification, MongoDB persistence, Cloudinary integration, and performance reliability.

1.4 Scope of the Project
Includes authentication, profile/portfolio, verification, job posting, admin governance, and cloud media storage.

1.5 Limitations
Payment gateways simulated, native mobile not included, and large-scale stress testing constrained by free-tier infrastructure.

1.6 Methodology and Tools
Agile/Scrum methodology, Next.js frontend, Spring Boot backend, MongoDB Atlas, Cloudinary, Docker, Git, and Postman.

1.7 Significance
SabaHub institutionalizes trust, professional identity, and secure multimedia portfolio handling in an enterprise-grade environment.

CHAPTER TWO: REQUIREMENT ANALYSIS AND SPECIFICATION
2.1 Current System
Existing systems are fragmented and insecure, with weak verification and poor media handling.

2.2 Requirement Gathering
Stakeholder interviews, benchmarking, prototyping, and feasibility audits produced requirements and business rules.

2.3 Proposed System
Decoupled API-first system: Next.js + Spring Boot + MongoDB + Cloudinary.

2.3.1 Functional Requirements
Secure onboarding, RBAC, profile management, verification workflows, enterprise job posting, admin auditing, and media optimization.

2.3.2 Non-functional Requirements
Performance (<500ms), scalability, availability (99.9%), security (JWT, RBAC, TLS), and maintainability.

CHAPTER THREE: SYSTEM MODEL
3.1 Scenario
SabaHub enables high-trust professional engagements through a verifiable onboarding and portfolio lifecycle aligned to the actual system implementation.

The scenario begins when a freelancer registers and authenticates via the Spring Boot authentication service, receiving a JWT used for all subsequent secured requests. The user enters the Next.js Professional Dashboard and completes a structured profile (skills, certifications, experience, portfolio links). Profile data is stored in MongoDB under the user profile document with audit fields and update timestamps.

To demonstrate capability, the freelancer opens the Media Upload interface and submits sample images, videos, audio, and documents. The frontend uploads these assets to the media endpoints, where the backend forwards to Cloudinary for secure storage and transformation. Cloudinary returns secure URLs, which are immediately stored in MongoDB and displayed in the dashboard, ensuring the portfolio remains high-fidelity without burdening the application server.

The freelancer then initiates identity verification by uploading government-issued documents. These are handled by the media service and registered as verification artifacts. The verification request is queued for administrative audit. An administrator accesses the Governance Console, reviews the documents, and approves the verification request. The system updates the user profile with a verified flag and verification metadata (method, timestamp, audit notes).

Once verified, the freelancer’s profile becomes discoverable within the marketplace. Employers browsing jobs can filter for verified professionals and view portfolio integrity indicators. This workflow demonstrates how SabaHub converts raw user data into a validated, enterprise-grade professional identity.

3.2 Use Case Model
Actors: Freelancer, Employer, Admin. Use cases include registration, authentication, profile management, portfolio upload, identity verification, job posting, proposal submission, and admin audit.

3.3 Sequence Diagram (Narrative)
User → Frontend → Auth Service → JWT issued → Profile update → Media upload → Cloudinary → URL storage → Profile published.

3.4 Activity Diagram (Narrative)
Login → Complete profile → Upload media → Submit verification → Admin review → Approve → Verified status.

3.5 Object and Class Modeling
Entities: User, UserProfile, Job, Proposal, Contract, VerificationRequest, MediaAsset, Notification, AuditLog.

3.6 User Interface Design
Responsive interfaces for onboarding, profile settings, job posting, verification, and admin governance.

CHAPTER FOUR: SYSTEM DESIGN
4.1 Architecture
3-tier architecture with API-first integration between Next.js frontend and Spring Boot backend, backed by MongoDB and Cloudinary.

4.2 Security Design
JWT authentication, RBAC enforcement, encrypted media handling, and audit logging.

4.3 Persistent Data Modeling
MongoDB collections for users, jobs, proposals, verifications, and media metadata.

4.4 Deployment
Dockerized services, cloud database, and CDN-backed media delivery.

CHAPTER FIVE: IMPLEMENTATION AND INTEGRATION
Backend: REST APIs, security filters, services, and repositories.
Frontend: Dashboard UX, job posting, media uploads, and profile management.
Integration: Cloudinary media orchestration and MongoDB persistence.

CHAPTER SIX: TESTING, EVALUATION, AND QA
Unit, integration, security, and performance testing ensure compliance with enterprise requirements.

CONCLUSION AND RECOMMENDATIONS
SabaHub delivers a secure, scalable marketplace for verified professional services. Future work includes payment gateways, AI-driven verification, and expanded analytics.

REFERENCES
Spring Boot Documentation
Next.js Documentation
MongoDB Atlas Documentation
Cloudinary API Documentation
OWASP Security Guidelines

APPENDICES
Appendix A: API Endpoint Summary
Appendix B: Database Collections
Appendix C: Security Policy Draft
Appendix D: Test Case Catalog
