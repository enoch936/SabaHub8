(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,17736,e=>{"use strict";let t;var i=e.i(41916),n=e.i(99276),a=e.i(75072),r=e.i(44536),s=e.i(62604),o=e.i(91003),l=e.i(24742),c=class extends r.Subscribable{constructor(e,t){super(),this.options=t,this.#e=e,this.#t=null,this.#i=(0,s.pendingThenable)(),this.bindMethods(),this.setOptions(t)}#e;#n=void 0;#a=void 0;#r=void 0;#s;#o;#i;#t;#l;#c;#u;#d;#g;#m;#h=new Set;bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){1===this.listeners.size&&(this.#n.addObserver(this),u(this.#n,this.options)?this.#p():this.updateResult(),this.#y())}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return d(this.#n,this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return d(this.#n,this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,this.#S(),this.#b(),this.#n.removeObserver(this)}setOptions(e){let t=this.options,i=this.#n;if(this.options=this.#e.defaultQueryOptions(e),void 0!==this.options.enabled&&"boolean"!=typeof this.options.enabled&&"function"!=typeof this.options.enabled&&"boolean"!=typeof(0,o.resolveEnabled)(this.options.enabled,this.#n))throw Error("Expected enabled to be a boolean or a callback that returns a boolean");this.#f(),this.#n.setOptions(this.options),t._defaulted&&!(0,o.shallowEqualObjects)(this.options,t)&&this.#e.getQueryCache().notify({type:"observerOptionsUpdated",query:this.#n,observer:this});let n=this.hasListeners();n&&g(this.#n,i,this.options,t)&&this.#p(),this.updateResult(),n&&(this.#n!==i||(0,o.resolveEnabled)(this.options.enabled,this.#n)!==(0,o.resolveEnabled)(t.enabled,this.#n)||(0,o.resolveStaleTime)(this.options.staleTime,this.#n)!==(0,o.resolveStaleTime)(t.staleTime,this.#n))&&this.#v();let a=this.#C();n&&(this.#n!==i||(0,o.resolveEnabled)(this.options.enabled,this.#n)!==(0,o.resolveEnabled)(t.enabled,this.#n)||a!==this.#m)&&this.#x(a)}getOptimisticResult(e){var t,i;let n=this.#e.getQueryCache().build(this.#e,e),a=this.createResult(n,e);return t=this,i=a,(0,o.shallowEqualObjects)(t.getCurrentResult(),i)||(this.#r=a,this.#o=this.options,this.#s=this.#n.state),a}getCurrentResult(){return this.#r}trackResult(e,t){return new Proxy(e,{get:(e,i)=>(this.trackProp(i),t?.(i),"promise"===i&&(this.trackProp("data"),this.options.experimental_prefetchInRender||"pending"!==this.#i.status||this.#i.reject(Error("experimental_prefetchInRender feature flag is not enabled"))),Reflect.get(e,i))})}trackProp(e){this.#h.add(e)}getCurrentQuery(){return this.#n}refetch({...e}={}){return this.fetch({...e})}fetchOptimistic(e){let t=this.#e.defaultQueryOptions(e),i=this.#e.getQueryCache().build(this.#e,t);return i.fetch().then(()=>this.createResult(i,t))}fetch(e){return this.#p({...e,cancelRefetch:e.cancelRefetch??!0}).then(()=>(this.updateResult(),this.#r))}#p(e){this.#f();let t=this.#n.fetch(this.options,e);return e?.throwOnError||(t=t.catch(o.noop)),t}#v(){this.#S();let e=(0,o.resolveStaleTime)(this.options.staleTime,this.#n);if(o.isServer||this.#r.isStale||!(0,o.isValidTimeout)(e))return;let t=(0,o.timeUntilStale)(this.#r.dataUpdatedAt,e);this.#d=l.timeoutManager.setTimeout(()=>{this.#r.isStale||this.updateResult()},t+1)}#C(){return("function"==typeof this.options.refetchInterval?this.options.refetchInterval(this.#n):this.options.refetchInterval)??!1}#x(e){this.#b(),this.#m=e,!o.isServer&&!1!==(0,o.resolveEnabled)(this.options.enabled,this.#n)&&(0,o.isValidTimeout)(this.#m)&&0!==this.#m&&(this.#g=l.timeoutManager.setInterval(()=>{(this.options.refetchIntervalInBackground||i.focusManager.isFocused())&&this.#p()},this.#m))}#y(){this.#v(),this.#x(this.#C())}#S(){this.#d&&(l.timeoutManager.clearTimeout(this.#d),this.#d=void 0)}#b(){this.#g&&(l.timeoutManager.clearInterval(this.#g),this.#g=void 0)}createResult(e,t){let i,n=this.#n,r=this.options,l=this.#r,c=this.#s,d=this.#o,h=e!==n?e.state:this.#a,{state:p}=e,y={...p},S=!1;if(t._optimisticResults){let i=this.hasListeners(),s=!i&&u(e,t),o=i&&g(e,n,t,r);(s||o)&&(y={...y,...(0,a.fetchState)(p.data,e.options)}),"isRestoring"===t._optimisticResults&&(y.fetchStatus="idle")}let{error:b,errorUpdatedAt:f,status:v}=y;i=y.data;let C=!1;if(void 0!==t.placeholderData&&void 0===i&&"pending"===v){let e;l?.isPlaceholderData&&t.placeholderData===d?.placeholderData?(e=l.data,C=!0):e="function"==typeof t.placeholderData?t.placeholderData(this.#u?.state.data,this.#u):t.placeholderData,void 0!==e&&(v="success",i=(0,o.replaceData)(l?.data,e,t),S=!0)}if(t.select&&void 0!==i&&!C)if(l&&i===c?.data&&t.select===this.#l)i=this.#c;else try{this.#l=t.select,i=t.select(i),i=(0,o.replaceData)(l?.data,i,t),this.#c=i,this.#t=null}catch(e){this.#t=e}this.#t&&(b=this.#t,i=this.#c,f=Date.now(),v="error");let x="fetching"===y.fetchStatus,M="pending"===v,P="error"===v,R=M&&x,A=void 0!==i,E={status:v,fetchStatus:y.fetchStatus,isPending:M,isSuccess:"success"===v,isError:P,isInitialLoading:R,isLoading:R,data:i,dataUpdatedAt:y.dataUpdatedAt,error:b,errorUpdatedAt:f,failureCount:y.fetchFailureCount,failureReason:y.fetchFailureReason,errorUpdateCount:y.errorUpdateCount,isFetched:y.dataUpdateCount>0||y.errorUpdateCount>0,isFetchedAfterMount:y.dataUpdateCount>h.dataUpdateCount||y.errorUpdateCount>h.errorUpdateCount,isFetching:x,isRefetching:x&&!M,isLoadingError:P&&!A,isPaused:"paused"===y.fetchStatus,isPlaceholderData:S,isRefetchError:P&&A,isStale:m(e,t),refetch:this.refetch,promise:this.#i,isEnabled:!1!==(0,o.resolveEnabled)(t.enabled,e)};if(this.options.experimental_prefetchInRender){let t=e=>{"error"===E.status?e.reject(E.error):void 0!==E.data&&e.resolve(E.data)},i=()=>{t(this.#i=E.promise=(0,s.pendingThenable)())},a=this.#i;switch(a.status){case"pending":e.queryHash===n.queryHash&&t(a);break;case"fulfilled":("error"===E.status||E.data!==a.value)&&i();break;case"rejected":("error"!==E.status||E.error!==a.reason)&&i()}}return E}updateResult(){let e=this.#r,t=this.createResult(this.#n,this.options);if(this.#s=this.#n.state,this.#o=this.options,void 0!==this.#s.data&&(this.#u=this.#n),(0,o.shallowEqualObjects)(t,e))return;this.#r=t;let i=()=>{if(!e)return!0;let{notifyOnChangeProps:t}=this.options,i="function"==typeof t?t():t;if("all"===i||!i&&!this.#h.size)return!0;let n=new Set(i??this.#h);return this.options.throwOnError&&n.add("error"),Object.keys(this.#r).some(t=>this.#r[t]!==e[t]&&n.has(t))};this.#M({listeners:i()})}#f(){let e=this.#e.getQueryCache().build(this.#e,this.options);if(e===this.#n)return;let t=this.#n;this.#n=e,this.#a=e.state,this.hasListeners()&&(t?.removeObserver(this),e.addObserver(this))}onQueryUpdate(){this.updateResult(),this.hasListeners()&&this.#y()}#M(e){n.notifyManager.batch(()=>{e.listeners&&this.listeners.forEach(e=>{e(this.#r)}),this.#e.getQueryCache().notify({query:this.#n,type:"observerResultsUpdated"})})}};function u(e,t){return!1!==(0,o.resolveEnabled)(t.enabled,e)&&void 0===e.state.data&&("error"!==e.state.status||!1!==t.retryOnMount)||void 0!==e.state.data&&d(e,t,t.refetchOnMount)}function d(e,t,i){if(!1!==(0,o.resolveEnabled)(t.enabled,e)&&"static"!==(0,o.resolveStaleTime)(t.staleTime,e)){let n="function"==typeof i?i(e):i;return"always"===n||!1!==n&&m(e,t)}return!1}function g(e,t,i,n){return(e!==t||!1===(0,o.resolveEnabled)(n.enabled,e))&&(!i.suspense||"error"!==e.state.status)&&m(e,i)}function m(e,t){return!1!==(0,o.resolveEnabled)(t.enabled,e)&&e.isStaleByTime((0,o.resolveStaleTime)(t.staleTime,e))}e.i(84646);var h=e.i(29364),p=e.i(4004);e.i(22047);var y=h.createContext((t=!1,{clearReset:()=>{t=!1},reset:()=>{t=!0},isReset:()=>t})),S=h.createContext(!1);S.Provider;var b=(e,t,i)=>t.fetchOptimistic(e).catch(()=>{i.clearReset()});function f(e,t){return function(e,t,i){let a=h.useContext(S),r=h.useContext(y),s=(0,p.useQueryClient)(i),l=s.defaultQueryOptions(e);if(s.getDefaultOptions().queries?._experimental_beforeQuery?.(l),l._optimisticResults=a?"isRestoring":"optimistic",l.suspense){let e=e=>"static"===e?e:Math.max(e??1e3,1e3),t=l.staleTime;l.staleTime="function"==typeof t?(...i)=>e(t(...i)):e(t),"number"==typeof l.gcTime&&(l.gcTime=Math.max(l.gcTime,1e3))}(l.suspense||l.throwOnError||l.experimental_prefetchInRender)&&!r.isReset()&&(l.retryOnMount=!1),h.useEffect(()=>{r.clearReset()},[r]);let c=!s.getQueryCache().get(l.queryHash),[u]=h.useState(()=>new t(s,l)),d=u.getOptimisticResult(l),g=!a&&!1!==e.subscribed;if(h.useSyncExternalStore(h.useCallback(e=>{let t=g?u.subscribe(n.notifyManager.batchCalls(e)):o.noop;return u.updateResult(),t},[u,g]),()=>u.getCurrentResult(),()=>u.getCurrentResult()),h.useEffect(()=>{u.setOptions(l)},[l,u]),l?.suspense&&d.isPending)throw b(l,u,r);if((({result:e,errorResetBoundary:t,throwOnError:i,query:n,suspense:a})=>e.isError&&!t.isReset()&&!e.isFetching&&n&&(a&&void 0===e.data||(0,o.shouldThrowError)(i,[e.error,n])))({result:d,errorResetBoundary:r,throwOnError:l.throwOnError,query:s.getQueryCache().get(l.queryHash),suspense:l.suspense}))throw d.error;if(s.getDefaultOptions().queries?._experimental_afterQuery?.(l,d),l.experimental_prefetchInRender&&!o.isServer&&d.isLoading&&d.isFetching&&!a){let e=c?b(l,u,r):s.getQueryCache().get(l.queryHash)?.promise;e?.catch(o.noop).finally(()=>{u.updateResult()})}return l.notifyOnChangeProps?d:u.trackResult(d)}(e,c,t)}e.s(["useQuery",()=>f],17736)},43771,e=>{"use strict";let t=`Software & IT
  ├─ Application Development
  │    ├─ Web Application Development
  │    ├─ Mobile Application Development
  │    └─ Desktop & Cross-Platform Apps
  ├─ Cloud & DevOps
  │    ├─ Site Reliability Engineering (SRE)
  │    ├─ CI/CD & Build Engineering
  │    └─ Cloud Architecture & Migration
  ├─ IT Operations & Support
  │    ├─ Helpdesk & Service Desk
  │    ├─ Systems Administration
  │    └─ Network Administration
  ├─ Quality Assurance & Testing
  │    ├─ Test Automation
  │    ├─ Performance & Load Testing
  │    └─ QA Management & Test Strategy
  └─ Enterprise Systems & Integration
       ├─ ERP/CRM Implementation
       ├─ API & Integration Engineering
       └─ IT Architecture & Governance
Data & AI
  ├─ Data Engineering
  │    ├─ ETL/ELT Pipelines
  │    ├─ Data Warehousing
  │    └─ Streaming Data Platforms
  ├─ Analytics & Business Intelligence
  │    ├─ Dashboarding & Reporting
  │    ├─ KPI & Metrics Modeling
  │    └─ Self-Serve Analytics Enablement
  ├─ Data Science
  │    ├─ Statistical Modeling
  │    ├─ Experimentation & A/B Testing
  │    └─ Forecasting & Time Series
  ├─ Machine Learning Engineering
  │    ├─ Model Training & Serving
  │    ├─ Feature Engineering
  │    └─ MLOps & Model Monitoring
  └─ AI Product, Ops & Governance
       ├─ Prompt Engineering & LLM Apps
       ├─ AI Evaluation & Red Teaming
       └─ Responsible AI & Model Risk
Cybersecurity
  ├─ Security Engineering
  │    ├─ Security Architecture
  │    ├─ Identity & Access Management (IAM)
  │    └─ Security Tooling & Automation
  ├─ Security Operations (SOC)
  │    ├─ Incident Response
  │    ├─ Threat Hunting
  │    └─ SIEM/SOAR Operations
  ├─ Application Security
  │    ├─ Secure Code Review
  │    ├─ Penetration Testing
  │    └─ DevSecOps Pipelines
  ├─ Cloud & Infrastructure Security
  │    ├─ Cloud Security Posture Management
  │    ├─ Endpoint & EDR
  │    └─ Network Security (FW/VPN/ZTNA)
  └─ Governance, Risk & Compliance (GRC)
       ├─ Risk Assessments
       ├─ Compliance Audits (ISO/SOC2)
       └─ Policies, Awareness & Training
Blockchain & Web3
  ├─ Smart Contract Development
  │    ├─ Solidity (EVM)
  │    ├─ Rust (Solana/Substrate)
  │    └─ Smart Contract Testing
  ├─ Protocol & Node Infrastructure
  │    ├─ Node Operations & RPC
  │    ├─ Layer-2 Engineering
  │    └─ Key Management & Wallet Infra
  ├─ Web3 Security
  │    ├─ Smart Contract Auditing
  │    ├─ Exploit Research
  │    └─ Bug Bounty Programs
  ├─ Token Economics & Governance
  │    ├─ Token Design & Modeling
  │    ├─ DAO Operations
  │    └─ Governance Analytics
  └─ Web3 Product & Community
       ├─ Developer Relations
       ├─ Community Moderation
       └─ On-Chain Growth & Partnerships
Engineering
  ├─ Mechanical Engineering
  │    ├─ CAD & Mechanical Design
  │    ├─ Thermal/Fluid Systems
  │    └─ Mechatronics
  ├─ Electrical Engineering
  │    ├─ Power Systems
  │    ├─ Control Systems
  │    └─ Embedded Hardware Integration
  ├─ Civil Engineering
  │    ├─ Structural Engineering
  │    ├─ Geotechnical Engineering
  │    └─ Transportation Engineering
  ├─ Chemical & Process Engineering
  │    ├─ Process Design
  │    ├─ Plant Operations Support
  │    └─ Process Safety (HAZOP)
  └─ Systems & Industrial Engineering
       ├─ Systems Engineering
       ├─ Industrial Engineering
       └─ Reliability Engineering
Design & Creative
  ├─ UX/UI Design
  │    ├─ UX Research
  │    ├─ UI Design Systems
  │    └─ Prototyping & Wireframing
  ├─ Graphic & Visual Design
  │    ├─ Branding & Identity
  │    ├─ Marketing & Advertising Design
  │    └─ Illustration
  ├─ Product & Industrial Design
  │    ├─ Industrial Design
  │    ├─ Packaging Design
  │    └─ 3D CAD Modeling
  ├─ Motion & Interaction Design
  │    ├─ Motion Graphics
  │    ├─ Micro-Interaction Design
  │    └─ 3D Motion & Animation
  └─ Creative Direction
       ├─ Art Direction
       ├─ Campaign Concepting
       └─ Creative Strategy
Media & Entertainment
  ├─ Film & Video Production
  │    ├─ Cinematography
  │    ├─ Production Coordination
  │    └─ Video Editing
  ├─ Audio & Music Production
  │    ├─ Sound Engineering
  │    ├─ Music Composition
  │    └─ Podcast Production
  ├─ Live Events & Broadcasting
  │    ├─ Live Streaming
  │    ├─ Broadcast Operations
  │    └─ Stage Management
  ├─ Post-Production & VFX
  │    ├─ Color Grading
  │    ├─ Visual Effects
  │    └─ Compositing
  └─ Talent & Rights Management
       ├─ Casting & Talent
       ├─ Rights & Clearances
       └─ Distribution Operations
Writing & Translation
  ├─ Copywriting & Content Marketing
  │    ├─ Brand Copywriting
  │    ├─ Ads & Landing Pages
  │    └─ Email & CRM Copy
  ├─ Technical Writing
  │    ├─ API Documentation
  │    ├─ User Guides & Manuals
  │    └─ SOPs & Playbooks
  ├─ Editing & Proofreading
  │    ├─ Developmental Editing
  │    ├─ Copy Editing
  │    └─ Fact Checking
  ├─ Translation & Localization
  │    ├─ Software Localization
  │    ├─ Legal Translation
  │    └─ Medical Translation
  └─ Subtitling & Transcription
       ├─ Subtitles & Captions
       ├─ Verbatim Transcription
       └─ Timecoding & QC
Business & Management
  ├─ Strategy & Consulting
  │    ├─ Market Strategy
  │    ├─ Competitive Analysis
  │    └─ Operating Model Design
  ├─ Project & Program Management
  │    ├─ PMO & Governance
  │    ├─ Agile Delivery
  │    └─ Portfolio Management
  ├─ Operations Management
  │    ├─ Process Improvement
  │    ├─ Service Operations
  │    └─ Operational Excellence
  ├─ Procurement & Vendor Management
  │    ├─ Strategic Sourcing
  │    ├─ Contract Negotiation
  │    └─ Supplier Performance
  └─ Entrepreneurship & General Management
       ├─ Business Development
       ├─ Startup Operations
       └─ Executive Management
Finance & Accounting
  ├─ Accounting & Bookkeeping
  │    ├─ General Ledger
  │    ├─ AP/AR
  │    └─ Financial Statements
  ├─ Financial Planning & Analysis (FP&A)
  │    ├─ Budgeting & Forecasting
  │    ├─ Variance Analysis
  │    └─ Management Reporting
  ├─ Tax & Payroll
  │    ├─ Payroll Processing
  │    ├─ Corporate Tax
  │    └─ VAT/GST Compliance
  ├─ Audit & Assurance
  │    ├─ Internal Audit
  │    ├─ External Audit
  │    └─ Controls Testing (SOX)
  └─ Treasury & Cash Management
       ├─ Cash Forecasting
       ├─ Bank Reconciliations
       └─ FX & Liquidity
Sales & Marketing
  ├─ B2B Sales
  │    ├─ Enterprise Sales
  │    ├─ Account Management
  │    └─ Solution Selling
  ├─ B2C Sales & Retail Sales
  │    ├─ Store Sales
  │    ├─ Inside Sales
  │    └─ Customer Retention
  ├─ Digital Marketing
  │    ├─ SEO/SEM
  │    ├─ Paid Social
  │    └─ Email Marketing
  ├─ Brand & Communications
  │    ├─ Brand Strategy
  │    ├─ PR & Media Relations
  │    └─ Content Strategy
  └─ Growth & Performance
       ├─ Conversion Rate Optimization
       ├─ Funnel Analytics
       └─ A/B Testing
Customer Support
  ├─ Customer Service
  │    ├─ Email & Chat Support
  │    ├─ Phone Support
  │    └─ Social Support
  ├─ Technical Support
  │    ├─ SaaS Support
  │    ├─ Hardware Support
  │    └─ API Support
  ├─ Customer Success
  │    ├─ Onboarding
  │    ├─ Renewals
  │    └─ Adoption Programs
  ├─ Support Operations
  │    ├─ Support QA & Coaching
  │    ├─ Knowledge Base Management
  │    └─ Support Analytics
  └─ Community & Trust/Safety
       ├─ Community Moderation
       ├─ Dispute Resolution
       └─ Fraud Review
Education & Training
  ├─ K-12 Education
  │    ├─ Primary Teaching
  │    ├─ Secondary Teaching
  │    └─ Special Education
  ├─ Higher Education
  │    ├─ Lecturing
  │    ├─ Academic Advising
  │    └─ Registrar Services
  ├─ Corporate Training & L&D
  │    ├─ Onboarding Programs
  │    ├─ Leadership Training
  │    └─ Compliance Training
  ├─ Vocational & Technical Training
  │    ├─ Trade Instruction
  │    ├─ Certification Programs
  │    └─ Safety Training
  └─ Tutoring & Coaching
       ├─ Test Preparation
       ├─ Language Tutoring
       └─ Career Coaching
Healthcare & Medical
  ├─ Clinical Care
  │    ├─ Primary Care
  │    ├─ Emergency Care
  │    └─ Surgical Services
  ├─ Nursing & Midwifery
  │    ├─ Hospital Nursing
  │    ├─ Community Nursing
  │    └─ Midwifery
  ├─ Allied Health
  │    ├─ Physiotherapy
  │    ├─ Radiology Technology
  │    └─ Laboratory Technology
  ├─ Healthcare Administration
  │    ├─ Medical Billing
  │    ├─ Patient Scheduling
  │    └─ Health Information Management
  └─ Mental Health & Counseling
       ├─ Therapy & Counseling
       ├─ Psychiatry Support
       └─ Substance Use Programs
Legal & Compliance
  ├─ Corporate & Commercial Law
  │    ├─ Corporate Governance
  │    ├─ Legal Advisory
  │    └─ Entity Management
  ├─ Contract Management
  │    ├─ Drafting & Review
  │    ├─ Negotiation Support
  │    └─ CLM Administration
  ├─ Regulatory Compliance
  │    ├─ Compliance Programs
  │    ├─ Policy Drafting
  │    └─ Audit Readiness
  ├─ Privacy & Data Protection
  │    ├─ GDPR/CCPA Programs
  │    ├─ Data Processing Agreements
  │    └─ Privacy Incident Response
  └─ Litigation & Dispute Resolution
       ├─ Case Management
       ├─ E-Discovery
       └─ Mediation & Arbitration
Government & Public Sector
  ├─ Public Administration
  │    ├─ Citizen Services
  │    ├─ Records & Registry
  │    └─ Permitting
  ├─ Policy & Program Management
  │    ├─ Policy Analysis
  │    ├─ Program Evaluation
  │    └─ Grant Administration
  ├─ Public Works & Infrastructure
  │    ├─ Utilities Maintenance
  │    ├─ Transportation Planning
  │    └─ City Engineering
  ├─ Digital Government (GovTech)
  │    ├─ Digital Identity
  │    ├─ Service Design
  │    └─ Open Data Portals
  └─ Public Finance & Procurement
       ├─ Budgeting
       ├─ Tendering
       └─ Contracting
Manufacturing & Industrial
  ├─ Production & Assembly
  │    ├─ Assembly Line Operations
  │    ├─ CNC Machining
  │    └─ Welding & Fabrication
  ├─ Quality & Inspection
  │    ├─ QA/QC Inspection
  │    ├─ Metrology
  │    └─ Supplier Quality
  ├─ Process & Lean Improvement
  │    ├─ Lean Six Sigma
  │    ├─ Continuous Improvement
  │    └─ OEE Optimization
  ├─ Maintenance & Reliability
  │    ├─ Preventive Maintenance
  │    ├─ Predictive Maintenance
  │    └─ CMMS Administration
  └─ Industrial Safety & HSE
       ├─ Safety Audits
       ├─ Incident Investigation
       └─ Environmental Compliance
Construction & Architecture
  ├─ Architectural Design
  │    ├─ Residential Design
  │    ├─ Commercial Design
  │    └─ Interior Architecture
  ├─ Construction Management
  │    ├─ Site Management
  │    ├─ Cost Control
  │    └─ Scheduling
  ├─ Building Systems (MEP)
  │    ├─ HVAC Design
  │    ├─ Electrical Design
  │    └─ Plumbing Design
  ├─ Structural & Civil Works
  │    ├─ Structural Engineering
  │    ├─ Roads & Utilities
  │    └─ Concrete & Steel
  └─ BIM, CAD & Drafting
       ├─ BIM Coordination
       ├─ CAD Drafting
       └─ 3D Modeling
Energy & Utilities
  ├─ Power Generation
  │    ├─ Thermal Plants
  │    ├─ Hydropower
  │    └─ Plant Maintenance
  ├─ Transmission & Distribution
  │    ├─ Substation Engineering
  │    ├─ Grid Operations
  │    └─ Protection & Relays
  ├─ Renewable Energy
  │    ├─ Solar PV
  │    ├─ Wind Energy
  │    └─ Energy Storage
  ├─ Utilities Operations
  │    ├─ Water Treatment
  │    ├─ Gas Distribution
  │    └─ Metering & Billing
  └─ Energy Policy & Regulation
       ├─ Regulatory Compliance
       ├─ Permitting
       └─ Energy Economics
Agriculture & Environment
  ├─ Crop Production
  │    ├─ Precision Agriculture
  │    ├─ Irrigation Management
  │    └─ Pest Management
  ├─ Livestock & Animal Care
  │    ├─ Dairy Operations
  │    ├─ Poultry Farming
  │    └─ Animal Nutrition
  ├─ Forestry & Conservation
  │    ├─ Forest Management
  │    ├─ Reforestation
  │    └─ Wildlife Habitat
  ├─ Environmental Services
  │    ├─ Environmental Monitoring
  │    ├─ Remediation
  │    └─ Compliance Inspections
  └─ Water Resources Management
       ├─ Hydrology
       ├─ Watershed Management
       └─ Flood Risk
Logistics & Supply Chain
  ├─ Supply Chain Planning
  │    ├─ Demand Planning
  │    ├─ Inventory Planning
  │    └─ S&OP
  ├─ Warehousing & Fulfillment
  │    ├─ WMS Operations
  │    ├─ Picking & Packing
  │    └─ Warehouse Management
  ├─ Procurement & Sourcing
  │    ├─ Strategic Sourcing
  │    ├─ Vendor Negotiation
  │    └─ Purchase Operations
  ├─ Freight & Transportation Logistics
  │    ├─ Freight Forwarding
  │    ├─ Route Planning
  │    └─ Dispatch
  └─ Trade Compliance & Customs
       ├─ Import/Export Documentation
       ├─ Tariff Classification
       └─ Sanctions Compliance
Transportation & Automotive
  ├─ Public Transportation
  │    ├─ Bus Operations
  │    ├─ Rail Operations
  │    └─ Transit Scheduling
  ├─ Commercial Driving & Delivery
  │    ├─ Truck Driving
  │    ├─ Courier Delivery
  │    └─ Last-Mile Logistics
  ├─ Automotive Service & Repair
  │    ├─ Diagnostics
  │    ├─ Bodywork & Paint
  │    └─ Tire & Brake Service
  ├─ Mobility Operations
  │    ├─ Fleet Operations
  │    ├─ Ride-Hailing Operations
  │    └─ Telematics & Tracking
  └─ Automotive Engineering
       ├─ EV Systems
       ├─ Vehicle Testing
       └─ Powertrain Engineering
Aviation & Aerospace
  ├─ Airline Operations
  │    ├─ Flight Dispatch
  │    ├─ Crew Scheduling
  │    └─ Network Planning
  ├─ Airport Operations
  │    ├─ Ground Handling
  │    ├─ Terminal Operations
  │    └─ Baggage Systems
  ├─ Aircraft Maintenance (MRO)
  │    ├─ Line Maintenance
  │    ├─ Base Maintenance
  │    └─ Avionics
  ├─ Aerospace Engineering
  │    ├─ Structures
  │    ├─ Propulsion
  │    └─ Systems Integration
  └─ Air Traffic & Safety
       ├─ Air Traffic Services
       ├─ Safety Management Systems
       └─ Aviation Compliance
Maritime & Offshore
  ├─ Port & Terminal Operations
  │    ├─ Cargo Handling
  │    ├─ Yard Planning
  │    └─ Crane Operations
  ├─ Shipping & Vessel Operations
  │    ├─ Navigation
  │    ├─ Vessel Scheduling
  │    └─ Chartering
  ├─ Offshore Oil & Gas Support
  │    ├─ Offshore Logistics
  │    ├─ Supply Vessels
  │    └─ Rig Support
  ├─ Marine Engineering
  │    ├─ Ship Maintenance
  │    ├─ Marine Electrical
  │    └─ Hull & Machinery
  └─ Maritime Safety & Compliance
       ├─ ISM/ISPS Compliance
       ├─ Marine Surveying
       └─ HSE Offshore
Retail & E-commerce
  ├─ Online Store Operations
  │    ├─ Order Management
  │    ├─ Returns & Refunds
  │    └─ Marketplace Integrations
  ├─ Marketplace Operations
  │    ├─ Seller Management
  │    ├─ Listing Quality
  │    └─ Marketplace Trust & Safety
  ├─ Merchandising & Category Management
  │    ├─ Assortment Planning
  │    ├─ Pricing & Promotions
  │    └─ Visual Merchandising
  ├─ Store Operations
  │    ├─ Store Management
  │    ├─ Inventory Receiving
  │    └─ Loss Prevention
  └─ E-commerce Product & Catalog
       ├─ Product Data Management
       ├─ Product Photography
       └─ Product Copywriting
Hospitality & Tourism
  ├─ Hotels & Accommodation
  │    ├─ Front Desk
  │    ├─ Housekeeping
  │    └─ Property Management Systems
  ├─ Travel Services & Agencies
  │    ├─ Trip Planning
  │    ├─ Corporate Travel
  │    └─ Visa & Documentation
  ├─ Guest Experience
  │    ├─ Concierge Services
  │    ├─ Loyalty Programs
  │    └─ Complaint Resolution
  ├─ Tourism Operations
  │    ├─ Tour Guiding
  │    ├─ Destination Services
  │    └─ Attractions Management
  └─ Hospitality Revenue Management
       ├─ Yield Management
       ├─ Pricing Strategy
       └─ Channel Management
Food & Beverage
  ├─ Culinary & Kitchen
  │    ├─ Chef Operations
  │    ├─ Pastry & Baking
  │    └─ Menu Development
  ├─ Restaurant Service
  │    ├─ Waitstaff Service
  │    ├─ Bar Service
  │    └─ Guest Relations
  ├─ Catering & Events
  │    ├─ Banquet Service
  │    ├─ Menu Planning
  │    └─ Staffing Coordination
  ├─ Food Safety & Quality
  │    ├─ HACCP Programs
  │    ├─ Supplier Audits
  │    └─ Compliance Inspections
  └─ Beverage Production
       ├─ Brewing Operations
       ├─ Distilling Operations
       └─ Beverage QA
Sports & Fitness
  ├─ Coaching & Training
  │    ├─ Team Coaching
  │    ├─ Youth Coaching
  │    └─ Strength & Conditioning
  ├─ Fitness Instruction
  │    ├─ Group Classes
  │    ├─ Personal Training
  │    └─ Online Coaching
  ├─ Sports Management
  │    ├─ Club Management
  │    ├─ Event Management
  │    └─ Sponsorship Management
  ├─ Sports Medicine & Rehab
  │    ├─ Athletic Training
  │    ├─ Physiotherapy
  │    └─ Injury Prevention
  └─ Fitness Operations
       ├─ Membership Sales
       ├─ Front Desk Operations
       └─ Facility Management
Beauty & Personal Care
  ├─ Salon Services
  │    ├─ Hair Styling
  │    ├─ Barbering
  │    └─ Hair Coloring
  ├─ Spa & Wellness
  │    ├─ Massage Therapy
  │    ├─ Body Treatments
  │    └─ Spa Operations
  ├─ Skincare & Aesthetics
  │    ├─ Facials
  │    ├─ Waxing
  │    └─ Laser/IPL (where legal)
  ├─ Cosmetics & Makeup
  │    ├─ Bridal Makeup
  │    ├─ Editorial Makeup
  │    └─ SFX Makeup
  └─ Beauty Retail & Operations
       ├─ Product Consultation
       ├─ Store Management
       └─ Inventory & Merchandising
Fashion & Textile
  ├─ Fashion Design
  │    ├─ Womenswear Design
  │    ├─ Menswear Design
  │    └─ Accessories & Footwear
  ├─ Textile Production
  │    ├─ Dyeing & Finishing
  │    ├─ Weaving/Knitting
  │    └─ Fabric Testing
  ├─ Apparel Manufacturing
  │    ├─ Pattern Making
  │    ├─ Sampling
  │    └─ Production Planning
  ├─ Fashion Merchandising
  │    ├─ Trend Forecasting
  │    ├─ Assortment Planning
  │    └─ Visual Merchandising
  └─ Fashion Retail & Styling
       ├─ Personal Styling
       ├─ Wardrobe Consulting
       └─ Styling for Shoots
Security & Law Enforcement
  ├─ Law Enforcement Operations
  │    ├─ Patrol Services
  │    ├─ Traffic Enforcement
  │    └─ Community Policing
  ├─ Physical Security
  │    ├─ Access Control
  │    ├─ CCTV Monitoring
  │    └─ Guard Services
  ├─ Investigations & Intelligence
  │    ├─ Case Investigation
  │    ├─ Evidence Handling
  │    └─ Threat Assessment
  ├─ Emergency Response
  │    ├─ Dispatch Operations
  │    ├─ Crisis Management
  │    └─ First Aid/EMS
  └─ Corrections & Rehabilitation
       ├─ Correctional Officers
       ├─ Rehabilitation Programs
       └─ Probation/Parole
NGO & Humanitarian
  ├─ Humanitarian Response
  │    ├─ Aid Distribution
  │    ├─ Shelter & WASH
  │    └─ Protection Services
  ├─ Community Development
  │    ├─ Livelihood Programs
  │    ├─ Youth Programs
  │    └─ Community Outreach
  ├─ Program Management (Nonprofit)
  │    ├─ Project Delivery
  │    ├─ Partner Coordination
  │    └─ Compliance Reporting
  ├─ Fundraising & Grants
  │    ├─ Grant Writing
  │    ├─ Donor Relations
  │    └─ Campaign Management
  └─ Monitoring & Evaluation (M&E)
       ├─ Impact Evaluation
       ├─ Data Collection
       └─ Learning & Reporting
Research & Science
  ├─ Life Sciences
  │    ├─ Molecular Biology
  │    ├─ Genetics
  │    └─ Microbiology
  ├─ Physical Sciences
  │    ├─ Chemistry
  │    ├─ Physics
  │    └─ Materials Science
  ├─ Social Sciences
  │    ├─ Economics Research
  │    ├─ Behavioral Science
  │    └─ Policy Research
  ├─ Applied Research & R&D
  │    ├─ Prototype Development
  │    ├─ Experimental Engineering
  │    └─ Product R&D
  └─ Scientific Operations
       ├─ Laboratory Management
       ├─ Research Data Management
       └─ Grant Support
Telecommunications
  ├─ Network Engineering
  │    ├─ Core Networks
  │    ├─ IP Routing/Switching
  │    └─ Network Operations
  ├─ RF & Wireless
  │    ├─ Cellular RF Planning
  │    ├─ Microwave Links
  │    └─ Spectrum Management
  ├─ Field Installation & Service
  │    ├─ Fiber Splicing
  │    ├─ Customer Premises Equipment
  │    └─ Tower Technicians
  ├─ OSS/BSS Systems
  │    ├─ Billing Systems
  │    ├─ Provisioning
  │    └─ Service Assurance
  └─ Telecom Security & Compliance
       ├─ Network Security
       ├─ Fraud Management
       └─ Regulatory Compliance
Hardware & Electronics
  ├─ Embedded Systems
  │    ├─ Firmware Development
  │    ├─ RTOS Development
  │    └─ Hardware Bring-up
  ├─ PCB Design & Layout
  │    ├─ Schematic Capture
  │    ├─ PCB Layout
  │    └─ DFM/DFT
  ├─ Semiconductor & Silicon
  │    ├─ IC Design
  │    ├─ Verification
  │    └─ Silicon Validation
  ├─ Hardware Testing & Validation
  │    ├─ EVT/DVT/PVT
  │    ├─ EMC/EMI Testing
  │    └─ Reliability Testing
  └─ Electronics Manufacturing Support
       ├─ Production Engineering
       ├─ Failure Analysis
       └─ Test Fixtures
Robotics & Automation
  ├─ Industrial Automation
  │    ├─ PLC Programming
  │    ├─ SCADA/HMI
  │    └─ Factory Automation
  ├─ Robot Software & Controls
  │    ├─ Motion Planning
  │    ├─ Control Systems
  │    └─ ROS Development
  ├─ Autonomous Systems
  │    ├─ Autonomous Navigation
  │    ├─ SLAM
  │    └─ Sensor Fusion
  ├─ Robotics Perception (Vision)
  │    ├─ Computer Vision
  │    ├─ Sensor Calibration
  │    └─ Object Detection
  └─ Safety & Compliance (Robotics)
       ├─ Functional Safety
       ├─ Risk Assessment
       └─ Standards Compliance
Internet of Things (IoT)
  ├─ IoT Device Engineering
  │    ├─ Embedded IoT
  │    ├─ Low-Power Design
  │    └─ Hardware/Firmware Integration
  ├─ Connectivity & Protocols
  │    ├─ BLE/Zigbee
  │    ├─ LoRaWAN
  │    └─ Cellular IoT
  ├─ Edge Computing
  │    ├─ Edge AI
  │    ├─ Gateway Engineering
  │    └─ On-Device Analytics
  ├─ IoT Platform & Cloud
  │    ├─ Device Management
  │    ├─ Digital Twins
  │    └─ IoT Security
  └─ Device Fleet Operations
       ├─ Provisioning
       ├─ OTA Updates
       └─ Monitoring & Diagnostics
Smart Cities
  ├─ Urban Mobility Systems
  │    ├─ Traffic Management
  │    ├─ MaaS Platforms
  │    └─ Parking Systems
  ├─ Smart Energy & Utilities
  │    ├─ Smart Grid
  │    ├─ Smart Metering
  │    └─ Demand Response
  ├─ City Data & Analytics
  │    ├─ Urban Dashboards
  │    ├─ Data Governance
  │    └─ Open Data Portals
  ├─ Public Safety Technology
  │    ├─ Command Centers
  │    ├─ City Surveillance Systems
  │    └─ Mass Alerting
  └─ Smart Infrastructure (Sensors)
       ├─ Sensor Networks
       ├─ Asset Monitoring
       └─ Predictive Maintenance
Climate & Sustainability
  ├─ ESG Strategy & Reporting
  │    ├─ ESG Program Design
  │    ├─ Sustainability KPIs
  │    └─ Supplier ESG
  ├─ Carbon Accounting & MRV
  │    ├─ Scope 1/2/3 Accounting
  │    ├─ GHG Inventories
  │    └─ Verification & Assurance
  ├─ Renewable & Clean Tech
  │    ├─ Climate Software
  │    ├─ Carbon Capture
  │    └─ Energy Storage
  ├─ Climate Risk & Resilience
  │    ├─ Physical Risk Modeling
  │    ├─ Transition Risk
  │    └─ Adaptation Planning
  └─ Circular Economy
       ├─ Waste Reduction
       ├─ Recycling Systems
       └─ Product Stewardship
Mining & Natural Resources
  ├─ Exploration & Geology
  │    ├─ Geological Mapping
  │    ├─ Drilling Programs
  │    └─ Resource Modeling
  ├─ Mine Operations
  │    ├─ Open-Pit Mining
  │    ├─ Underground Mining
  │    └─ Haulage & Dispatch
  ├─ Mineral Processing
  │    ├─ Crushing & Grinding
  │    ├─ Flotation
  │    └─ Metallurgy
  ├─ Mine Maintenance & Reliability
  │    ├─ Heavy Equipment Maintenance
  │    ├─ Reliability Engineering
  │    └─ Spare Parts Management
  └─ Mine Safety & Environment
       ├─ HSE Compliance
       ├─ Tailings Management
       └─ Environmental Monitoring
Real Estate & Property
  ├─ Property Management
  │    ├─ Residential Management
  │    ├─ Commercial Management
  │    └─ Tenant Relations
  ├─ Real Estate Sales & Brokerage
  │    ├─ Leasing
  │    ├─ Sales Negotiation
  │    └─ Real Estate Marketing
  ├─ Valuation & Appraisal
  │    ├─ Appraisals
  │    ├─ Market Analysis
  │    └─ Investment Valuation
  ├─ Facilities & Asset Management
  │    ├─ Building Maintenance
  │    ├─ Space Planning
  │    └─ Vendor Management
  └─ PropTech & Real Estate Ops
       ├─ Lease Administration
       ├─ Property Data Systems
       └─ Real Estate Analytics
Insurance & Risk
  ├─ Underwriting
  │    ├─ Commercial Underwriting
  │    ├─ Personal Lines
  │    └─ Specialty Insurance
  ├─ Claims Management
  │    ├─ Claims Adjusting
  │    ├─ Claims Operations
  │    └─ Litigation Claims Support
  ├─ Risk Engineering
  │    ├─ Site Risk Surveys
  │    ├─ Loss Control
  │    └─ Risk Reporting
  ├─ Actuarial & Pricing
  │    ├─ Pricing Models
  │    ├─ Reserving
  │    └─ Catastrophe Modeling
  └─ Compliance & Fraud (Insurance)
       ├─ Insurance Compliance
       ├─ SIU Investigations
       └─ Fraud Analytics
Human Resources
  ├─ Talent Acquisition
  │    ├─ Sourcing
  │    ├─ Recruiting
  │    └─ Interview Coordination
  ├─ HR Operations
  │    ├─ HRIS Administration
  │    ├─ Policy Management
  │    └─ HR Compliance
  ├─ Compensation & Benefits
  │    ├─ Salary Benchmarking
  │    ├─ Benefits Administration
  │    └─ Incentive Plans
  ├─ Employee Relations
  │    ├─ Investigations
  │    ├─ Conflict Resolution
  │    └─ Labor Relations
  └─ Learning & Development
       ├─ Onboarding
       ├─ Leadership Development
       └─ Skills Training
Administration & Office Support
  ├─ Office Administration
  │    ├─ Office Coordination
  │    ├─ Supplies & Procurement
  │    └─ Vendor Coordination
  ├─ Executive Assistance
  │    ├─ Calendar Management
  │    ├─ Travel Planning
  │    └─ Board Support
  ├─ Document & Records Management
  │    ├─ Filing Systems
  │    ├─ Digitization
  │    └─ Compliance Records
  ├─ Scheduling & Coordination
  │    ├─ Meeting Coordination
  │    ├─ Event Coordination
  │    └─ Resource Booking
  └─ Reception & Front Desk
       ├─ Visitor Management
       ├─ Switchboard
       └─ Mailroom Operations
Virtual Assistance
  ├─ Administrative VA
  │    ├─ Calendar & Inbox Management
  │    ├─ Travel Booking
  │    └─ Document Preparation
  ├─ Customer Support VA
  │    ├─ Ticket Handling
  │    ├─ Live Chat
  │    └─ CRM Updates
  ├─ Research & Data VA
  │    ├─ Web Research
  │    ├─ Data Entry
  │    └─ Lead Lists
  ├─ E-commerce VA
  │    ├─ Product Listings
  │    ├─ Order Tracking
  │    └─ Returns Handling
  └─ Social Media VA
       ├─ Scheduling Posts
       ├─ Comment Moderation
       └─ Community Support
Crowd & Micro Tasks
  ├─ Data Entry & Verification
  │    ├─ Form Entry
  │    ├─ Data Cleanup
  │    └─ Duplicate Resolution
  ├─ Annotation & Labeling
  │    ├─ Image Labeling
  │    ├─ Text Classification
  │    └─ Audio Tagging
  ├─ Content Review & Moderation
  │    ├─ Policy Review
  │    ├─ Spam Detection
  │    └─ Abuse Reporting
  ├─ Micro-Testing & QA
  │    ├─ Website Testing
  │    ├─ Bug Reporting
  │    └─ UX Feedback
  └─ Local Tasking & Field Checks
       ├─ Mystery Shopping
       ├─ Store Audits
       └─ Photo Collection
Field & On-Site Services
  ├─ Installations & Setup
  │    ├─ Equipment Installation
  │    ├─ Commissioning
  │    └─ Calibration
  ├─ Field Technician Support
  │    ├─ On-Site Troubleshooting
  │    ├─ Preventive Visits
  │    └─ Parts Replacement
  ├─ Inspections & Audits
  │    ├─ Safety Inspections
  │    ├─ Quality Audits
  │    └─ Compliance Checks
  ├─ Emergency & Repair Dispatch
  │    ├─ Break/Fix Response
  │    ├─ After-Hours Callouts
  │    └─ Incident Support
  └─ Customer Premises Services
       ├─ Home Installations
       ├─ Business Installations
       └─ On-Site Training
Maintenance & Repair
  ├─ Building Maintenance
  │    ├─ HVAC Maintenance
  │    ├─ Plumbing Maintenance
  │    └─ Electrical Maintenance
  ├─ Equipment & Machinery Repair
  │    ├─ Industrial Equipment Repair
  │    ├─ Pumps & Motors
  │    └─ Conveyors & Robotics
  ├─ Electrical & Electronics Repair
  │    ├─ PCB Repair
  │    ├─ Appliance Repair
  │    └─ Instrument Repair
  ├─ Vehicle & Fleet Maintenance
  │    ├─ Fleet Service
  │    ├─ Tire & Brake
  │    └─ Diagnostics
  └─ Preventive Maintenance Programs
       ├─ PM Scheduling
       ├─ Predictive Maintenance
       └─ CMMS Management
Home & Domestic Services
  ├─ Housekeeping & Cleaning
  │    ├─ Regular Cleaning
  │    ├─ Deep Cleaning
  │    └─ Move-Out Cleaning
  ├─ Childcare & Nannying
  │    ├─ Babysitting
  │    ├─ After-School Care
  │    └─ Special Needs Childcare
  ├─ Elder Care & Home Health
  │    ├─ Companion Care
  │    ├─ Personal Care Aide
  │    └─ Dementia Support
  ├─ Home Cooking & Meal Prep
  │    ├─ Meal Planning
  │    ├─ Meal Preparation
  │    └─ Special Diet Cooking
  └─ Pet Care Services
       ├─ Dog Walking
       ├─ Pet Sitting
       └─ Pet Transport
Personal Services
  ├─ Personal Assistance & Errands
  │    ├─ Grocery Runs
  │    ├─ Appointment Runs
  │    └─ Courier Errands
  ├─ Personal Finance Help
  │    ├─ Budget Coaching
  │    ├─ Bill Paying Assistance
  │    └─ Expense Tracking
  ├─ Lifestyle & Wellness Services
  │    ├─ Habit Coaching
  │    ├─ Wellness Planning
  │    └─ Meditation Coaching
  ├─ Personal Coaching
  │    ├─ Life Coaching
  │    ├─ Career Coaching
  │    └─ Executive Coaching
  └─ Concierge & Travel Assistance
       ├─ Trip Planning
       ├─ Reservations
       └─ Local Experience Booking
Religious & Cultural Services
  ├─ Clergy & Ministry
  │    ├─ Pastoral Care
  │    ├─ Worship Leadership
  │    └─ Chaplaincy
  ├─ Religious Education
  │    ├─ Study Groups
  │    ├─ Youth Programs
  │    └─ Faith-Based Schools Support
  ├─ Community Outreach
  │    ├─ Charity Programs
  │    ├─ Counseling Support
  │    └─ Community Events
  ├─ Ceremony & Ritual Services
  │    ├─ Weddings
  │    ├─ Funerals
  │    └─ Naming/Blessings
  └─ Cultural Program Management
       ├─ Cultural Festivals
       ├─ Heritage Programs
       └─ Interfaith Dialogue
Event & Wedding Services
  ├─ Event Planning
  │    ├─ Corporate Events
  │    ├─ Conferences
  │    └─ Private Events
  ├─ Wedding Coordination
  │    ├─ Full-Service Planning
  │    ├─ Day-Of Coordination
  │    └─ Vendor Management
  ├─ Event Production
  │    ├─ AV/Lighting
  │    ├─ Stage Management
  │    └─ Live Streaming
  ├─ Catering & Banquets
  │    ├─ Banquet Service
  │    ├─ Menu Planning
  │    └─ Staffing Coordination
  └─ Venue Operations
       ├─ Reservations
       ├─ Setup & Teardown
       └─ Guest Management
Art & Culture
  ├─ Museums & Galleries
  │    ├─ Collections Management
  │    ├─ Exhibition Design
  │    └─ Visitor Programs
  ├─ Performing Arts
  │    ├─ Theatre Production
  │    ├─ Dance Production
  │    └─ Music Performance
  ├─ Cultural Heritage
  │    ├─ Preservation
  │    ├─ Archiving
  │    └─ Heritage Documentation
  ├─ Arts Administration
  │    ├─ Grants & Funding
  │    ├─ Program Management
  │    └─ Venue Administration
  └─ Community Arts
       ├─ Workshops
       ├─ Public Art
       └─ Arts Outreach
Gaming & Esports
  ├─ Game Development
  │    ├─ Gameplay Programming
  │    ├─ Engine Development
  │    └─ Tools Programming
  ├─ Game Art & Animation
  │    ├─ 3D Modeling
  │    ├─ Concept Art
  │    └─ Character Animation
  ├─ Live Operations (LiveOps)
  │    ├─ Content Updates
  │    ├─ Monetization Operations
  │    └─ Player Analytics
  ├─ Esports Operations
  │    ├─ Tournament Operations
  │    ├─ Broadcast Production
  │    └─ Team Management
  └─ Community & Player Support
       ├─ Community Management
       ├─ Moderation
       └─ Player Support
Metaverse & Virtual Worlds
  ├─ Real-Time 3D Development
  │    ├─ Unity/Unreal Development
  │    ├─ Rendering Optimization
  │    └─ Networked Worlds
  ├─ Virtual World Design
  │    ├─ Level Design
  │    ├─ Environmental Art
  │    └─ World Building
  ├─ Avatar & Identity Systems
  │    ├─ Character Rigging
  │    ├─ Avatar Customization
  │    └─ Motion Capture
  ├─ Virtual Economy & Commerce
  │    ├─ Digital Goods
  │    ├─ Marketplace Operations
  │    └─ Payments & Wallets
  └─ Trust, Safety & Moderation
       ├─ Community Guidelines
       ├─ Abuse Reporting
       └─ Safety Tooling
Space & Astronomy
  ├─ Satellite Systems
  │    ├─ Payload Engineering
  │    ├─ Attitude Control
  │    └─ Satellite Testing
  ├─ Launch & Mission Operations
  │    ├─ Mission Planning
  │    ├─ Flight Dynamics
  │    └─ Operations Control
  ├─ Space Science & Research
  │    ├─ Astrophysics
  │    ├─ Planetary Science
  │    └─ Space Weather
  ├─ Ground Segment & Communications
  │    ├─ Ground Stations
  │    ├─ TT&C Systems
  │    └─ Network Operations
  └─ Space Policy & Compliance
       ├─ Licensing
       ├─ Export Controls
       └─ Space Safety Standards`;function i(e){let t=e.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/&/g," ").replace(/\+/g," plus ").replace(/\//g," ").replace(/[^a-z0-9]+/g,"-").replace(/-{2,}/g,"-").replace(/^-+|-+$/g,"");return t.length>0?t:"unknown"}function n(e,t,i){let n=i.get(e)??new Map;i.set(e,n);let a=(n.get(t)??0)+1;return n.set(t,a),1===a?t:`${t}-${a}`}let a=function(e=t){let a=[],r=new Map,s=[],o=[],l=new Map,c=null,u=null;for(let t of e.split(/\r?\n/)){let e=t.replace(/\s+$/,"");if(!e.trim())continue;let d=e.match(/[├└]─\s*(.+)$/);if(!d){let t=e.trim(),o=n("__root__",i(t),l),d={id:o,label:t,depth:0,children:[]};a.push(d),s.push(d),r.set(o,d),c=d,u=null;continue}let g=d[1].trim(),m=2>=Math.max(e.indexOf("├─"),e.indexOf("└─"))?1:2,h=1===m?c:u;if(!h)continue;let p=i(g),y=n(h.id,p,l),S=`${h.id}.${y}`,b={id:S,label:g,depth:m,parentId:h.id,children:[]};h.children.push(b),s.push(b),r.set(S,b),1===m&&(u=b),2===m&&o.push(b)}return{roots:a,byId:r,all:s,leaves:o}}();function r(e){let t=a.byId.get(e);if(!t)return null;let i=[t.id],n=t.parentId;for(;n;)i.push(n),n=a.byId.get(n)?.parentId;return i.reverse()}function s(e,t){let i;if(!e)return t?.unknownFallback??"";let n=(i=r(e))?i.map(e=>a.byId.get(e)?.label??e):null;return n?n.join(t?.separator??" › "):t?.unknownFallback??e}function o(e,t){return!t||"all"===t||!!e&&(e===t||e.startsWith(`${t}.`))}e.s(["JOB_TAXONOMY",0,a,"getJobCategoryDisplay",()=>s,"getJobCategoryPathIds",()=>r,"jobCategoryMatches",()=>o],43771)},57752,e=>{"use strict";var t=e.i(22047),i=e.i(21525),n=e.i(29364),a=e.i(38286),r=e.i(43771);function s(e,t){if(!e||e===t)return{mainId:r.JOB_TAXONOMY.roots[0]?.id??"",subId:""};let i=(0,r.getJobCategoryPathIds)(e);return i&&0!==i.length?{mainId:i[0]??"",subId:i.length>=2?i[1]:""}:{mainId:r.JOB_TAXONOMY.roots[0]?.id??"",subId:""}}function o(e){let o,c,u,d,g,m,h,p,y,S,b,f,v,C,x,M,P,R,A,E,T,D,w=(0,i.c)(93),{value:I,onChange:O,placeholder:k,disabled:j,className:N,allowNonLeaf:L,allowAllOption:F,allValue:B,allLabel:Q,label:H,helperText:G}=e,V=void 0===k?"Select a category":k,W=void 0!==L&&L,_=void 0!==F&&F,U=void 0===B?"all":B,q=void 0===Q?"All categories":Q,[z,J]=(0,n.useState)(!1),[X,K]=(0,n.useState)("");w[0]!==U||w[1]!==I?(o=()=>s(I,U),w[0]=U,w[1]=I,w[2]=o):o=w[2];let[$,Y]=(0,n.useState)(o),{mainId:Z,subId:ee}=$;w[3]!==U||w[4]!==z||w[5]!==I?(c=()=>{z&&(K(""),Y(s(I,U)))},u=[z,I,U],w[3]=U,w[4]=z,w[5]=I,w[6]=c,w[7]=u):(c=w[6],u=w[7]),(0,n.useEffect)(c,u);e:{let e;if(_&&I===U){d=q;break e}if(!I){d="";break e}w[8]!==I?(e=(0,r.getJobCategoryDisplay)(I,{separator:" › ",unknownFallback:I}),w[8]=I,w[9]=e):e=w[9],d=e}let et=d,ei=r.JOB_TAXONOMY.roots;if(w[10]!==q||w[11]!==U||w[12]!==_||w[13]!==W||w[14]!==N||w[15]!==j||w[16]!==G||w[17]!==H||w[18]!==Z||w[19]!==O||w[20]!==z||w[21]!==V||w[22]!==X||w[23]!==et||w[24]!==ee||w[25]!==I){let e,i,n,s,o,c,u,d,P,R=ei.find(e=>e.id===Z)??ei[0],A=R?.children??[],E=A.find(e=>e.id===ee)??A[0],T=E?.children??[];if(w[38]!==X){t:{let t=X.trim().toLowerCase();if(!t){let t;w[40]===Symbol.for("react.memo_cache_sentinel")?(t=[],w[40]=t):t=w[40],e=t;break t}e=r.JOB_TAXONOMY.leaves.map(l).filter(e=>e.display.toLowerCase().includes(t)).slice(0,80)}w[38]=X,w[39]=e}else e=w[39];let D=e;w[41]===Symbol.for("react.memo_cache_sentinel")?(i=()=>J(!0),w[41]=i):i=w[41],w[42]!==N?(n=(0,a.cn)("w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-left text-sm transition focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100/70 disabled:bg-slate-50 disabled:cursor-not-allowed",N),w[42]=N,w[43]=n):n=w[43];let k=et?"text-slate-900":"text-slate-400";w[44]!==k?(s=(0,a.cn)("truncate",k),w[44]=k,w[45]=s):s=w[45];let L=et||V;w[46]!==s||w[47]!==L?(o=(0,t.jsx)("div",{className:"min-w-0",children:(0,t.jsx)("div",{className:s,children:L})}),w[46]=s,w[47]=L,w[48]=o):o=w[48],w[49]===Symbol.for("react.memo_cache_sentinel")?(c=(0,t.jsx)("svg",{className:"h-4 w-4 flex-shrink-0 text-slate-400",viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":!0,children:(0,t.jsx)("path",{fillRule:"evenodd",d:"M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.7a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z",clipRule:"evenodd"})}),w[49]=c):c=w[49],w[50]!==o?(u=(0,t.jsxs)("div",{className:"flex items-center justify-between gap-3",children:[o,c]}),w[50]=o,w[51]=u):u=w[51],w[52]!==j||w[53]!==n||w[54]!==u?(d=(0,t.jsx)("button",{type:"button",disabled:j,onClick:i,className:n,children:u}),w[52]=j,w[53]=n,w[54]=u,w[55]=d):d=w[55];let F=d;v="grid gap-2",w[56]!==H?(C=H?(0,t.jsx)("label",{className:"text-sm font-medium text-slate-700",children:H}):null,w[56]=H,w[57]=C):C=w[57],x=F,w[58]!==G?(M=G?(0,t.jsx)("p",{className:"text-xs text-slate-500",children:G}):null,w[58]=G,w[59]=M):M=w[59],g=a.Modal,S=z,w[60]===Symbol.for("react.memo_cache_sentinel")?(b=()=>J(!1),w[60]=b):b=w[60],f=W?"Choose a category":"Choose a specialization",m="space-y-4",w[61]===Symbol.for("react.memo_cache_sentinel")?(P=e=>K(e.target.value),w[61]=P):P=w[61],w[62]!==X?(h=(0,t.jsx)(a.Input,{value:X,onChange:P,placeholder:"Search categories..."}),w[62]=X,w[63]=h):h=w[63],w[64]!==q||w[65]!==U||w[66]!==_||w[67]!==O||w[68]!==I?(p=_&&(0,t.jsxs)("button",{type:"button",onClick:()=>{O(U),J(!1)},className:(0,a.cn)("flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",I===U?"border-emerald-200 bg-emerald-50/60 text-emerald-800":"border-slate-200/70 bg-white/80 text-slate-700 hover:border-slate-300"),children:[(0,t.jsx)("span",{children:q}),(0,t.jsx)("span",{className:"text-xs font-semibold text-slate-400",children:"Reset"})]}),w[64]=q,w[65]=U,w[66]=_,w[67]=O,w[68]=I,w[69]=p):p=w[69],y=X.trim()?(0,t.jsx)("div",{className:"max-h-[55vh] overflow-auto rounded-2xl border border-slate-200/70 bg-white/70",children:0===D.length?(0,t.jsx)("div",{className:"p-4 text-sm text-slate-600",children:"No matches."}):(0,t.jsx)("div",{className:"divide-y divide-slate-200/70",children:D.map(e=>(0,t.jsxs)("button",{type:"button",onClick:()=>{O(e.id),J(!1)},className:(0,a.cn)("flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/80",I===e.id?"bg-emerald-50/60":""),children:[(0,t.jsx)("span",{className:"min-w-0 truncate font-semibold text-slate-900",children:e.display}),(0,t.jsx)("span",{className:"text-xs font-semibold text-slate-400",children:"Select"})]},e.id))})}):(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-3",children:[(0,t.jsxs)("div",{className:"rounded-2xl border border-slate-200/70 bg-white/70",children:[(0,t.jsx)("div",{className:"border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500",children:"Main"}),(0,t.jsx)("div",{className:"max-h-[45vh] overflow-auto p-2",children:ei.map(e=>(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)("button",{type:"button",onClick:()=>Y({mainId:e.id,subId:e.children[0]?.id??""}),className:(0,a.cn)("flex-1 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",e.id===Z?"bg-slate-900 text-white":"text-slate-700 hover:bg-white/80"),children:e.label}),W&&(0,t.jsx)("button",{type:"button",onClick:()=>{O(e.id),J(!1)},className:"rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300",children:"Use"})]},e.id))})]}),(0,t.jsxs)("div",{className:"rounded-2xl border border-slate-200/70 bg-white/70",children:[(0,t.jsx)("div",{className:"border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500",children:"Subcategory"}),(0,t.jsx)("div",{className:"max-h-[45vh] overflow-auto p-2",children:0===A.length?(0,t.jsx)("div",{className:"p-4 text-sm text-slate-600",children:"Pick a main category first."}):A.map(e=>(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)("button",{type:"button",onClick:()=>Y({mainId:Z,subId:e.id}),className:(0,a.cn)("flex-1 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",e.id===ee?"bg-slate-900 text-white":"text-slate-700 hover:bg-white/80"),children:e.label}),W&&(0,t.jsx)("button",{type:"button",onClick:()=>{O(e.id),J(!1)},className:"rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300",children:"Use"})]},e.id))})]}),(0,t.jsxs)("div",{className:"rounded-2xl border border-slate-200/70 bg-white/70",children:[(0,t.jsx)("div",{className:"border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500",children:"Specialization"}),(0,t.jsx)("div",{className:"max-h-[45vh] overflow-auto p-2",children:0===T.length?(0,t.jsx)("div",{className:"p-4 text-sm text-slate-600",children:"Pick a subcategory to see specializations."}):T.map(e=>(0,t.jsxs)("button",{type:"button",onClick:()=>{O(e.id),J(!1)},className:(0,a.cn)("flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-white/80",e.id===I?"bg-emerald-50/60 text-emerald-800":"text-slate-700"),children:[(0,t.jsx)("span",{className:"min-w-0 truncate",children:e.label}),(0,t.jsx)("span",{className:"text-xs font-semibold text-slate-400",children:"Select"})]},e.id))})]})]}),w[10]=q,w[11]=U,w[12]=_,w[13]=W,w[14]=N,w[15]=j,w[16]=G,w[17]=H,w[18]=Z,w[19]=O,w[20]=z,w[21]=V,w[22]=X,w[23]=et,w[24]=ee,w[25]=I,w[26]=g,w[27]=m,w[28]=h,w[29]=p,w[30]=y,w[31]=S,w[32]=b,w[33]=f,w[34]=v,w[35]=C,w[36]=x,w[37]=M}else g=w[26],m=w[27],h=w[28],p=w[29],y=w[30],S=w[31],b=w[32],f=w[33],v=w[34],C=w[35],x=w[36],M=w[37];return w[70]!==O?(P=(0,t.jsx)("button",{type:"button",onClick:()=>{O(""),J(!1)},className:"text-sm font-semibold text-slate-600 transition hover:text-slate-900",children:"Clear selection"}),w[70]=O,w[71]=P):P=w[71],w[72]===Symbol.for("react.memo_cache_sentinel")?(R=(0,t.jsx)("button",{type:"button",onClick:()=>J(!1),className:"rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300",children:"Done"}),w[72]=R):R=w[72],w[73]!==P?(A=(0,t.jsxs)("div",{className:"flex items-center justify-between gap-3 pt-2",children:[P,R]}),w[73]=P,w[74]=A):A=w[74],w[75]!==m||w[76]!==h||w[77]!==p||w[78]!==y||w[79]!==A?(E=(0,t.jsxs)("div",{className:m,children:[h,p,y,A]}),w[75]=m,w[76]=h,w[77]=p,w[78]=y,w[79]=A,w[80]=E):E=w[80],w[81]!==g||w[82]!==S||w[83]!==b||w[84]!==f||w[85]!==E?(T=(0,t.jsx)(g,{open:S,onClose:b,title:f,children:E}),w[81]=g,w[82]=S,w[83]=b,w[84]=f,w[85]=E,w[86]=T):T=w[86],w[87]!==v||w[88]!==C||w[89]!==x||w[90]!==M||w[91]!==T?(D=(0,t.jsxs)("div",{className:v,children:[C,x,M,T]}),w[87]=v,w[88]=C,w[89]=x,w[90]=M,w[91]=T,w[92]=D):D=w[92],D}function l(e){return{id:e.id,display:(0,r.getJobCategoryDisplay)(e.id,{unknownFallback:e.label})}}e.s(["default",()=>o])},58750,e=>{"use strict";var t=e.i(22047),i=e.i(21525),n=e.i(64231),a=e.i(17736),r=e.i(9165),s=e.i(38286),o=e.i(29364),l=e.i(57752),c=e.i(43771);function u(){let e,u,g,h,p,y,S,b,f,v,C,x,M,P=(0,i.c)(58);P[0]===Symbol.for("react.memo_cache_sentinel")?(e={queryKey:["jobs"],queryFn:r.listJobs},P[0]=e):e=P[0];let{data:R,isLoading:A,error:E}=(0,a.useQuery)(e),[T,D]=(0,o.useState)(""),[w,I]=(0,o.useState)("all"),[O,k]=(0,o.useState)("recent");if(P[1]!==w||P[2]!==R||P[3]!==E||P[4]!==A||P[5]!==T||P[6]!==O){let e,i,a,r,o,x,M,j,N,L,F,B,Q,H=R?.filter(e=>{let t=e.title?.toLowerCase().includes(T.toLowerCase())||e.description?.toLowerCase().includes(T.toLowerCase()),i=(0,c.jobCategoryMatches)(e.categoryId,w);return t&&i})||[];P[17]!==O?(e=(e,t)=>"recent"===O?new Date(t.createdAt||0).getTime()-new Date(e.createdAt||0).getTime():"budget-high"===O?(t.budget?.max||0)-(e.budget?.max||0):"budget-low"===O?(e.budget?.min||0)-(t.budget?.min||0):0,P[17]=O,P[18]=e):e=P[18];let G=[...H].sort(e);v="relative isolate min-h-screen overflow-hidden bg-slate-950 p-6 text-slate-900",P[19]===Symbol.for("react.memo_cache_sentinel")?(C=(0,t.jsx)("div",{className:"pointer-events-none absolute inset-0 -z-20","aria-hidden":!0,children:(0,t.jsx)("img",{src:"/images/backgrounds/aurora-blur.svg",alt:"Aurora",className:"h-full w-full object-cover opacity-75"})}),P[19]=C):C=P[19],P[20]===Symbol.for("react.memo_cache_sentinel")?(g=(0,t.jsx)("div",{className:"pointer-events-none absolute inset-0 -z-10","aria-hidden":!0,children:(0,t.jsx)("img",{src:"/images/backgrounds/geo-light-grid.svg",alt:"Grid",className:"h-full w-full object-cover opacity-55"})}),P[20]=g):g=P[20],u="mx-auto max-w-7xl",P[21]===Symbol.for("react.memo_cache_sentinel")?(i=(0,t.jsxs)("div",{children:[(0,t.jsx)("h1",{className:"text-3xl font-bold text-slate-900",children:"Browse Jobs"}),(0,t.jsx)("p",{className:"mt-1 text-slate-600",children:"Find and apply to freelance opportunities"})]}),P[21]=i):i=P[21],P[22]===Symbol.for("react.memo_cache_sentinel")?(h=(0,t.jsx)("header",{className:"mb-8",children:(0,t.jsxs)("div",{className:"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",children:[i,(0,t.jsx)(n.default,{href:"/dashboard/jobs/new",children:(0,t.jsx)(s.Button,{size:"lg",leftIcon:(0,t.jsx)("svg",{className:"h-5 w-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 4v16m8-8H4"})}),children:"Post a Job"})})]})}),P[22]=h):h=P[22],P[23]===Symbol.for("react.memo_cache_sentinel")?(a=(0,t.jsx)("label",{className:"mb-2 block text-sm font-medium text-slate-700",children:"Search"}),P[23]=a):a=P[23],P[24]===Symbol.for("react.memo_cache_sentinel")?(r=e=>D(e.target.value),P[24]=r):r=P[24],P[25]!==T?(o=(0,t.jsxs)("div",{className:"md:col-span-1",children:[a,(0,t.jsx)(s.Input,{type:"search",placeholder:"Search jobs...",value:T,onChange:r})]}),P[25]=T,P[26]=o):o=P[26],P[27]===Symbol.for("react.memo_cache_sentinel")?(x=(0,t.jsx)("label",{className:"mb-2 block text-sm font-medium text-slate-700",children:"Category"}),P[27]=x):x=P[27],P[28]!==w?(M=(0,t.jsxs)("div",{children:[x,(0,t.jsx)(l.default,{value:w,onChange:I,allowAllOption:!0,allowNonLeaf:!0,allValue:"all",allLabel:"All categories",placeholder:"Filter by category"})]}),P[28]=w,P[29]=M):M=P[29],P[30]===Symbol.for("react.memo_cache_sentinel")?(j=(0,t.jsx)("label",{className:"mb-2 block text-sm font-medium text-slate-700",children:"Sort By"}),P[30]=j):j=P[30],P[31]===Symbol.for("react.memo_cache_sentinel")?(N=e=>k(e.target.value),L=(0,t.jsx)("option",{value:"recent",children:"Most Recent"}),F=(0,t.jsx)("option",{value:"budget-high",children:"Budget: High to Low"}),B=(0,t.jsx)("option",{value:"budget-low",children:"Budget: Low to High"}),P[31]=N,P[32]=L,P[33]=F,P[34]=B):(N=P[31],L=P[32],F=P[33],B=P[34]),P[35]!==O?(Q=(0,t.jsxs)("div",{children:[j,(0,t.jsxs)(s.Select,{value:O,onChange:N,children:[L,F,B]})]}),P[35]=O,P[36]=Q):Q=P[36],P[37]!==o||P[38]!==M||P[39]!==Q?(p=(0,t.jsx)(s.Card,{className:"mb-6 p-6 border border-white/25 bg-white/85 backdrop-blur",children:(0,t.jsxs)("div",{className:"grid gap-4 md:grid-cols-3",children:[o,M,Q]})}),P[37]=o,P[38]=M,P[39]=Q,P[40]=p):p=P[40],P[41]!==A?(y=A&&(0,t.jsx)("div",{className:"space-y-4",children:[1,2,3,4].map(m)}),P[41]=A,P[42]=y):y=P[42],P[43]!==E?(S=E&&(0,t.jsxs)(s.Card,{variant:"bordered",className:"border border-rose-200/70 bg-rose-50/90 p-8 text-center",children:[(0,t.jsx)("div",{className:"mb-2 text-4xl",children:"⚠️"}),(0,t.jsx)("p",{className:"font-medium text-rose-700",children:"Failed to load jobs"}),(0,t.jsx)("p",{className:"text-sm text-rose-600",children:"Please try again later"})]}),P[43]=E,P[44]=S):S=P[44],b=!A&&!E&&0===G.length&&(0,t.jsxs)(s.Card,{variant:"bordered",className:"p-12 text-center border border-white/25 bg-white/85 backdrop-blur",children:[(0,t.jsx)("div",{className:"mb-4 text-6xl",children:"🔍"}),(0,t.jsx)("h3",{className:"mb-2 text-xl font-bold text-slate-900",children:"No jobs found"}),(0,t.jsx)("p",{className:"mb-6 text-slate-600",children:T||"all"!==w?"Try adjusting your filters":"Be the first to post a job!"}),(T||"all"!==w)&&(0,t.jsx)(s.Button,{variant:"outline",onClick:()=>{D(""),I("all")},children:"Clear Filters"})]}),f=!A&&!E&&G.length>0&&(0,t.jsx)("div",{className:"grid gap-6",children:G.map(d)}),P[1]=w,P[2]=R,P[3]=E,P[4]=A,P[5]=T,P[6]=O,P[7]=u,P[8]=g,P[9]=h,P[10]=p,P[11]=y,P[12]=S,P[13]=b,P[14]=f,P[15]=v,P[16]=C}else u=P[7],g=P[8],h=P[9],p=P[10],y=P[11],S=P[12],b=P[13],f=P[14],v=P[15],C=P[16];return P[45]!==u||P[46]!==h||P[47]!==p||P[48]!==y||P[49]!==S||P[50]!==b||P[51]!==f?(x=(0,t.jsxs)("div",{className:u,children:[h,p,y,S,b,f]}),P[45]=u,P[46]=h,P[47]=p,P[48]=y,P[49]=S,P[50]=b,P[51]=f,P[52]=x):x=P[52],P[53]!==g||P[54]!==x||P[55]!==v||P[56]!==C?(M=(0,t.jsxs)("main",{className:v,children:[C,g,x]}),P[53]=g,P[54]=x,P[55]=v,P[56]=C,P[57]=M):M=P[57],M}function d(e){return(0,t.jsx)(n.default,{href:`/dashboard/jobs/${e.id}`,children:(0,t.jsx)(s.Card,{hover:!0,className:"group p-6 border border-white/25 bg-white/85 backdrop-blur",children:(0,t.jsxs)("div",{className:"flex items-start justify-between gap-4",children:[(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsxs)("div",{className:"mb-3 flex items-start gap-3",children:[(0,t.jsx)("div",{className:"flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 text-2xl",children:"💼"}),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsx)("h3",{className:"mb-1 text-xl font-bold text-slate-900 group-hover:text-sky-600 transition truncate",children:e.title}),e.categoryId?(0,t.jsx)("p",{className:"mb-1 text-xs font-semibold text-slate-500 truncate",title:(0,c.getJobCategoryDisplay)(e.categoryId,{unknownFallback:e.categoryId}),children:(0,c.getJobCategoryDisplay)(e.categoryId,{unknownFallback:e.categoryId})}):null,(0,t.jsx)("p",{className:"text-sm text-slate-600 line-clamp-2",children:e.description})]})]}),(0,t.jsxs)("div",{className:"mb-4 flex flex-wrap gap-2",children:[e.skills?.slice(0,5).map(g),e.skills?.length>5&&(0,t.jsxs)(s.Badge,{variant:"default",size:"sm",children:["+",e.skills.length-5," more"]})]}),(0,t.jsxs)("div",{className:"flex flex-wrap items-center gap-4 text-sm text-slate-600",children:[(0,t.jsxs)("div",{className:"flex items-center gap-1.5",children:[(0,t.jsx)("svg",{className:"h-4 w-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})}),(0,t.jsxs)("span",{className:"font-semibold text-slate-900",children:["$",e.budget?.min?.toLocaleString()," - $",e.budget?.max?.toLocaleString()]})]}),(0,t.jsxs)("div",{className:"flex items-center gap-1.5",children:[(0,t.jsx)("svg",{className:"h-4 w-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})}),(0,t.jsx)("span",{children:new Date(e.createdAt).toLocaleDateString()})]}),(0,t.jsxs)("div",{className:"flex items-center gap-1.5",children:[(0,t.jsx)("svg",{className:"h-4 w-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"})}),(0,t.jsxs)("span",{children:[e.proposalCount||0," proposals"]})]})]})]}),(0,t.jsx)(s.Badge,{variant:"OPEN"===e.status?"success":"IN_PROGRESS"===e.status?"info":"COMPLETED"===e.status?"default":"warning",children:e.status})]})})},e.id)}function g(e,i){return(0,t.jsx)(s.Badge,{variant:"info",size:"sm",children:e},i)}function m(e){return(0,t.jsxs)(s.Card,{className:"p-6 border border-white/25 bg-white/80 backdrop-blur",children:[(0,t.jsx)(s.Skeleton,{className:"mb-3 h-6 w-2/3"}),(0,t.jsx)(s.Skeleton,{className:"mb-2 h-4 w-full"}),(0,t.jsx)(s.Skeleton,{className:"h-4 w-3/4"}),(0,t.jsxs)("div",{className:"mt-4 flex gap-2",children:[(0,t.jsx)(s.Skeleton,{className:"h-6 w-20",variant:"rectangular"}),(0,t.jsx)(s.Skeleton,{className:"h-6 w-20",variant:"rectangular"})]})]},e)}e.s(["default",()=>u])}]);