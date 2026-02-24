(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,48283,(e,t,i)=>{"use strict";function n({widthInt:e,heightInt:t,blurWidth:i,blurHeight:n,blurDataURL:a,objectFit:r}){let s=i?40*i:e,o=n?40*n:t,l=s&&o?`viewBox='0 0 ${s} ${o}'`:"";return`%3Csvg xmlns='http://www.w3.org/2000/svg' ${l}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${l?"none":"contain"===r?"xMidYMid":"cover"===r?"xMidYMid slice":"none"}' style='filter: url(%23b);' href='${a}'/%3E%3C/svg%3E`}Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"getImageBlurSvg",{enumerable:!0,get:function(){return n}})},75428,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0});var n={VALID_LOADERS:function(){return r},imageConfigDefault:function(){return s}};for(var a in n)Object.defineProperty(i,a,{enumerable:!0,get:n[a]});let r=["default","imgix","cloudinary","akamai","custom"],s={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],path:"/_next/image",loader:"default",loaderFile:"",domains:[],disableStaticImages:!1,minimumCacheTTL:14400,formats:["image/webp"],maximumRedirects:3,dangerouslyAllowLocalIP:!1,dangerouslyAllowSVG:!1,contentSecurityPolicy:"script-src 'none'; frame-src 'none'; sandbox;",contentDispositionType:"attachment",localPatterns:void 0,remotePatterns:[],qualities:[75],unoptimized:!1}},76101,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"getImgProps",{enumerable:!0,get:function(){return l}}),e.r(12832);let n=e.r(48283),a=e.r(75428),r=["-moz-initial","fill","none","scale-down",void 0];function s(e){return void 0!==e.default}function o(e){return void 0===e?e:"number"==typeof e?Number.isFinite(e)?e:NaN:"string"==typeof e&&/^[0-9]+$/.test(e)?parseInt(e,10):NaN}function l({src:e,sizes:t,unoptimized:i=!1,priority:l=!1,preload:c=!1,loading:u,className:d,quality:m,width:g,height:p,fill:h=!1,style:y,overrideSrc:f,onLoad:v,onLoadingComplete:S,placeholder:x="empty",blurDataURL:b,fetchPriority:C,decoding:P="async",layout:M,objectFit:R,objectPosition:E,lazyBoundary:j,lazyRoot:A,...D},T){var O;let w,I,k,{imgConf:N,showAltText:_,blurComplete:q,defaultLoader:L}=T,F=N||a.imageConfigDefault;if("allSizes"in F)w=F;else{let e=[...F.deviceSizes,...F.imageSizes].sort((e,t)=>e-t),t=F.deviceSizes.sort((e,t)=>e-t),i=F.qualities?.sort((e,t)=>e-t);w={...F,allSizes:e,deviceSizes:t,qualities:i}}if(void 0===L)throw Object.defineProperty(Error("images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config"),"__NEXT_ERROR_CODE",{value:"E163",enumerable:!1,configurable:!0});let B=D.loader||L;delete D.loader,delete D.srcSet;let G="__next_img_default"in B;if(G){if("custom"===w.loader)throw Object.defineProperty(Error(`Image with src "${e}" is missing "loader" prop.
Read more: https://nextjs.org/docs/messages/next-image-missing-loader`),"__NEXT_ERROR_CODE",{value:"E252",enumerable:!1,configurable:!0})}else{let e=B;B=t=>{let{config:i,...n}=t;return e(n)}}if(M){"fill"===M&&(h=!0);let e={intrinsic:{maxWidth:"100%",height:"auto"},responsive:{width:"100%",height:"auto"}}[M];e&&(y={...y,...e});let i={responsive:"100vw",fill:"100vw"}[M];i&&!t&&(t=i)}let V="",H=o(g),U=o(p);if((O=e)&&"object"==typeof O&&(s(O)||void 0!==O.src)){let t=s(e)?e.default:e;if(!t.src)throw Object.defineProperty(Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(t)}`),"__NEXT_ERROR_CODE",{value:"E460",enumerable:!1,configurable:!0});if(!t.height||!t.width)throw Object.defineProperty(Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(t)}`),"__NEXT_ERROR_CODE",{value:"E48",enumerable:!1,configurable:!0});if(I=t.blurWidth,k=t.blurHeight,b=b||t.blurDataURL,V=t.src,!h)if(H||U){if(H&&!U){let e=H/t.width;U=Math.round(t.height*e)}else if(!H&&U){let e=U/t.height;H=Math.round(t.width*e)}}else H=t.width,U=t.height}let z=!l&&!c&&("lazy"===u||void 0===u);(!(e="string"==typeof e?e:V)||e.startsWith("data:")||e.startsWith("blob:"))&&(i=!0,z=!1),w.unoptimized&&(i=!0),G&&!w.dangerouslyAllowSVG&&e.split("?",1)[0].endsWith(".svg")&&(i=!0);let W=o(m),$=Object.assign(h?{position:"absolute",height:"100%",width:"100%",left:0,top:0,right:0,bottom:0,objectFit:R,objectPosition:E}:{},_?{}:{color:"transparent"},y),Q=q||"empty"===x?null:"blur"===x?`url("data:image/svg+xml;charset=utf-8,${(0,n.getImageBlurSvg)({widthInt:H,heightInt:U,blurWidth:I,blurHeight:k,blurDataURL:b||"",objectFit:$.objectFit})}")`:`url("${x}")`,X=r.includes($.objectFit)?"fill"===$.objectFit?"100% 100%":"cover":$.objectFit,J=Q?{backgroundSize:X,backgroundPosition:$.objectPosition||"50% 50%",backgroundRepeat:"no-repeat",backgroundImage:Q}:{},Y=function({config:e,src:t,unoptimized:i,width:n,quality:a,sizes:r,loader:s}){if(i)return{src:t,srcSet:void 0,sizes:void 0};let{widths:o,kind:l}=function({deviceSizes:e,allSizes:t},i,n){if(n){let i=/(^|\s)(1?\d?\d)vw/g,a=[];for(let e;e=i.exec(n);)a.push(parseInt(e[2]));if(a.length){let i=.01*Math.min(...a);return{widths:t.filter(t=>t>=e[0]*i),kind:"w"}}return{widths:t,kind:"w"}}return"number"!=typeof i?{widths:e,kind:"w"}:{widths:[...new Set([i,2*i].map(e=>t.find(t=>t>=e)||t[t.length-1]))],kind:"x"}}(e,n,r),c=o.length-1;return{sizes:r||"w"!==l?r:"100vw",srcSet:o.map((i,n)=>`${s({config:e,src:t,quality:a,width:i})} ${"w"===l?i:n+1}${l}`).join(", "),src:s({config:e,src:t,quality:a,width:o[c]})}}({config:w,src:e,unoptimized:i,width:H,quality:W,sizes:t,loader:B}),K=z?"lazy":u;return{props:{...D,loading:K,fetchPriority:C,width:H,height:U,decoding:P,className:d,style:{...$,...J},sizes:Y.sizes,srcSet:Y.srcSet,src:f||Y.src},meta:{unoptimized:i,preload:c||l,placeholder:x,fill:h}}}},88665,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"default",{enumerable:!0,get:function(){return o}});let n=e.r(29364),a="undefined"==typeof window,r=a?()=>{}:n.useLayoutEffect,s=a?()=>{}:n.useEffect;function o(e){let{headManager:t,reduceComponentsToState:i}=e;function o(){if(t&&t.mountedInstances){let e=n.Children.toArray(Array.from(t.mountedInstances).filter(Boolean));t.updateHead(i(e))}}return a&&(t?.mountedInstances?.add(e.children),o()),r(()=>(t?.mountedInstances?.add(e.children),()=>{t?.mountedInstances?.delete(e.children)})),r(()=>(t&&(t._pendingUpdate=o),()=>{t&&(t._pendingUpdate=o)})),s(()=>(t&&t._pendingUpdate&&(t._pendingUpdate(),t._pendingUpdate=null),()=>{t&&t._pendingUpdate&&(t._pendingUpdate(),t._pendingUpdate=null)})),null}},36396,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0});var n={default:function(){return h},defaultHead:function(){return d}};for(var a in n)Object.defineProperty(i,a,{enumerable:!0,get:n[a]});let r=e.r(81258),s=e.r(44066),o=e.r(22047),l=s._(e.r(29364)),c=r._(e.r(88665)),u=e.r(59277);function d(){return[(0,o.jsx)("meta",{charSet:"utf-8"},"charset"),(0,o.jsx)("meta",{name:"viewport",content:"width=device-width"},"viewport")]}function m(e,t){return"string"==typeof t||"number"==typeof t?e:t.type===l.default.Fragment?e.concat(l.default.Children.toArray(t.props.children).reduce((e,t)=>"string"==typeof t||"number"==typeof t?e:e.concat(t),[])):e.concat(t)}e.r(12832);let g=["name","httpEquiv","charSet","itemProp"];function p(e){let t,i,n,a;return e.reduce(m,[]).reverse().concat(d().reverse()).filter((t=new Set,i=new Set,n=new Set,a={},e=>{let r=!0,s=!1;if(e.key&&"number"!=typeof e.key&&e.key.indexOf("$")>0){s=!0;let i=e.key.slice(e.key.indexOf("$")+1);t.has(i)?r=!1:t.add(i)}switch(e.type){case"title":case"base":i.has(e.type)?r=!1:i.add(e.type);break;case"meta":for(let t=0,i=g.length;t<i;t++){let i=g[t];if(e.props.hasOwnProperty(i))if("charSet"===i)n.has(i)?r=!1:n.add(i);else{let t=e.props[i],n=a[i]||new Set;("name"!==i||!s)&&n.has(t)?r=!1:(n.add(t),a[i]=n)}}}return r})).reverse().map((e,t)=>{let i=e.key||t;return l.default.cloneElement(e,{key:i})})}let h=function({children:e}){let t=(0,l.useContext)(u.HeadManagerContext);return(0,o.jsx)(c.default,{reduceComponentsToState:p,headManager:t,children:e})};("function"==typeof i.default||"object"==typeof i.default&&null!==i.default)&&void 0===i.default.__esModule&&(Object.defineProperty(i.default,"__esModule",{value:!0}),Object.assign(i.default,i),t.exports=i.default)},16858,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"ImageConfigContext",{enumerable:!0,get:function(){return r}});let n=e.r(81258)._(e.r(29364)),a=e.r(75428),r=n.default.createContext(a.imageConfigDefault)},31615,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"RouterContext",{enumerable:!0,get:function(){return n}});let n=e.r(81258)._(e.r(29364)).default.createContext(null)},14555,(e,t,i)=>{"use strict";function n(e,t){let i=e||75;return t?.qualities?.length?t.qualities.reduce((e,t)=>Math.abs(t-i)<Math.abs(e-i)?t:e,0):i}Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"findClosestQuality",{enumerable:!0,get:function(){return n}})},28216,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"default",{enumerable:!0,get:function(){return r}});let n=e.r(14555);function a({config:e,src:t,width:i,quality:a}){if(t.startsWith("/")&&t.includes("?")&&e.localPatterns?.length===1&&"**"===e.localPatterns[0].pathname&&""===e.localPatterns[0].search)throw Object.defineProperty(Error(`Image with src "${t}" is using a query string which is not configured in images.localPatterns.
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`),"__NEXT_ERROR_CODE",{value:"E871",enumerable:!1,configurable:!0});let r=(0,n.findClosestQuality)(a,e);return`${e.path}?url=${encodeURIComponent(t)}&w=${i}&q=${r}${t.startsWith("/_next/static/media/"),""}`}a.__next_img_default=!0;let r=a},58882,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"Image",{enumerable:!0,get:function(){return x}});let n=e.r(81258),a=e.r(44066),r=e.r(22047),s=a._(e.r(29364)),o=n._(e.r(94434)),l=n._(e.r(36396)),c=e.r(76101),u=e.r(75428),d=e.r(16858);e.r(12832);let m=e.r(31615),g=n._(e.r(28216)),p=e.r(65068),h={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],qualities:[75],path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1};function y(e,t,i,n,a,r,s){let o=e?.src;e&&e["data-loaded-src"]!==o&&(e["data-loaded-src"]=o,("decode"in e?e.decode():Promise.resolve()).catch(()=>{}).then(()=>{if(e.parentElement&&e.isConnected){if("empty"!==t&&a(!0),i?.current){let t=new Event("load");Object.defineProperty(t,"target",{writable:!1,value:e});let n=!1,a=!1;i.current({...t,nativeEvent:t,currentTarget:e,target:e,isDefaultPrevented:()=>n,isPropagationStopped:()=>a,persist:()=>{},preventDefault:()=>{n=!0,t.preventDefault()},stopPropagation:()=>{a=!0,t.stopPropagation()}})}n?.current&&n.current(e)}}))}function f(e){return s.use?{fetchPriority:e}:{fetchpriority:e}}"undefined"==typeof window&&(globalThis.__NEXT_IMAGE_IMPORTED=!0);let v=(0,s.forwardRef)(({src:e,srcSet:t,sizes:i,height:n,width:a,decoding:o,className:l,style:c,fetchPriority:u,placeholder:d,loading:m,unoptimized:g,fill:h,onLoadRef:v,onLoadingCompleteRef:S,setBlurComplete:x,setShowAltText:b,sizesInput:C,onLoad:P,onError:M,...R},E)=>{let j=(0,s.useCallback)(e=>{e&&(M&&(e.src=e.src),e.complete&&y(e,d,v,S,x,g,C))},[e,d,v,S,x,M,g,C]),A=(0,p.useMergedRef)(E,j);return(0,r.jsx)("img",{...R,...f(u),loading:m,width:a,height:n,decoding:o,"data-nimg":h?"fill":"1",className:l,style:c,sizes:i,srcSet:t,src:e,ref:A,onLoad:e=>{y(e.currentTarget,d,v,S,x,g,C)},onError:e=>{b(!0),"empty"!==d&&x(!0),M&&M(e)}})});function S({isAppRouter:e,imgAttributes:t}){let i={as:"image",imageSrcSet:t.srcSet,imageSizes:t.sizes,crossOrigin:t.crossOrigin,referrerPolicy:t.referrerPolicy,...f(t.fetchPriority)};return e&&o.default.preload?(o.default.preload(t.src,i),null):(0,r.jsx)(l.default,{children:(0,r.jsx)("link",{rel:"preload",href:t.srcSet?void 0:t.src,...i},"__nimg-"+t.src+t.srcSet+t.sizes)})}let x=(0,s.forwardRef)((e,t)=>{let i=(0,s.useContext)(m.RouterContext),n=(0,s.useContext)(d.ImageConfigContext),a=(0,s.useMemo)(()=>{let e=h||n||u.imageConfigDefault,t=[...e.deviceSizes,...e.imageSizes].sort((e,t)=>e-t),i=e.deviceSizes.sort((e,t)=>e-t),a=e.qualities?.sort((e,t)=>e-t);return{...e,allSizes:t,deviceSizes:i,qualities:a,localPatterns:"undefined"==typeof window?n?.localPatterns:e.localPatterns}},[n]),{onLoad:o,onLoadingComplete:l}=e,p=(0,s.useRef)(o);(0,s.useEffect)(()=>{p.current=o},[o]);let y=(0,s.useRef)(l);(0,s.useEffect)(()=>{y.current=l},[l]);let[f,x]=(0,s.useState)(!1),[b,C]=(0,s.useState)(!1),{props:P,meta:M}=(0,c.getImgProps)(e,{defaultLoader:g.default,imgConf:a,blurComplete:f,showAltText:b});return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(v,{...P,unoptimized:M.unoptimized,placeholder:M.placeholder,fill:M.fill,onLoadRef:p,onLoadingCompleteRef:y,setBlurComplete:x,setShowAltText:C,sizesInput:e.sizes,ref:t}),M.preload?(0,r.jsx)(S,{isAppRouter:!i,imgAttributes:P}):null]})});("function"==typeof i.default||"object"==typeof i.default&&null!==i.default)&&void 0===i.default.__esModule&&(Object.defineProperty(i.default,"__esModule",{value:!0}),Object.assign(i.default,i),t.exports=i.default)},92895,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0});var n={default:function(){return u},getImageProps:function(){return c}};for(var a in n)Object.defineProperty(i,a,{enumerable:!0,get:n[a]});let r=e.r(81258),s=e.r(76101),o=e.r(58882),l=r._(e.r(28216));function c(e){let{props:t}=(0,s.getImgProps)(e,{defaultLoader:l.default,imgConf:{deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],qualities:[75],path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1}});for(let[e,i]of Object.entries(t))void 0===i&&delete t[e];return{props:t}}let u=o.Image},34022,(e,t,i)=>{t.exports=e.r(92895)},25284,e=>{"use strict";var t=e.i(29364),i=e.i(97580),n=e.i(99276),a=e.i(44536),r=e.i(91003),s=class extends a.Subscribable{#e;#t=void 0;#i;#n;constructor(e,t){super(),this.#e=e,this.setOptions(t),this.bindMethods(),this.#a()}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(e){let t=this.options;this.options=this.#e.defaultMutationOptions(e),(0,r.shallowEqualObjects)(this.options,t)||this.#e.getMutationCache().notify({type:"observerOptionsUpdated",mutation:this.#i,observer:this}),t?.mutationKey&&this.options.mutationKey&&(0,r.hashKey)(t.mutationKey)!==(0,r.hashKey)(this.options.mutationKey)?this.reset():this.#i?.state.status==="pending"&&this.#i.setOptions(this.options)}onUnsubscribe(){this.hasListeners()||this.#i?.removeObserver(this)}onMutationUpdate(e){this.#a(),this.#r(e)}getCurrentResult(){return this.#t}reset(){this.#i?.removeObserver(this),this.#i=void 0,this.#a(),this.#r()}mutate(e,t){return this.#n=t,this.#i?.removeObserver(this),this.#i=this.#e.getMutationCache().build(this.#e,this.options),this.#i.addObserver(this),this.#i.execute(e)}#a(){let e=this.#i?.state??(0,i.getDefaultState)();this.#t={...e,isPending:"pending"===e.status,isSuccess:"success"===e.status,isError:"error"===e.status,isIdle:"idle"===e.status,mutate:this.mutate,reset:this.reset}}#r(e){n.notifyManager.batch(()=>{if(this.#n&&this.hasListeners()){let t=this.#t.variables,i=this.#t.context,n={client:this.#e,meta:this.options.meta,mutationKey:this.options.mutationKey};e?.type==="success"?(this.#n.onSuccess?.(e.data,t,i,n),this.#n.onSettled?.(e.data,null,t,i,n)):e?.type==="error"&&(this.#n.onError?.(e.error,t,i,n),this.#n.onSettled?.(void 0,e.error,t,i,n))}this.listeners.forEach(e=>{e(this.#t)})})}},o=e.i(4004);function l(e,i){let a=(0,o.useQueryClient)(i),[l]=t.useState(()=>new s(a,e));t.useEffect(()=>{l.setOptions(e)},[l,e]);let c=t.useSyncExternalStore(t.useCallback(e=>l.subscribe(n.notifyManager.batchCalls(e)),[l]),()=>l.getCurrentResult(),()=>l.getCurrentResult()),u=t.useCallback((e,t)=>{l.mutate(e,t).catch(r.noop)},[l]);if(c.error&&(0,r.shouldThrowError)(l.options.throwOnError,[c.error]))throw c.error;return{...c,mutate:u,mutateAsync:c.mutate}}e.s(["useMutation",()=>l],25284)},43771,e=>{"use strict";let t=`Software & IT
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
       └─ Space Safety Standards`;function i(e){let t=e.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/&/g," ").replace(/\+/g," plus ").replace(/\//g," ").replace(/[^a-z0-9]+/g,"-").replace(/-{2,}/g,"-").replace(/^-+|-+$/g,"");return t.length>0?t:"unknown"}function n(e,t,i){let n=i.get(e)??new Map;i.set(e,n);let a=(n.get(t)??0)+1;return n.set(t,a),1===a?t:`${t}-${a}`}let a=function(e=t){let a=[],r=new Map,s=[],o=[],l=new Map,c=null,u=null;for(let t of e.split(/\r?\n/)){let e=t.replace(/\s+$/,"");if(!e.trim())continue;let d=e.match(/[├└]─\s*(.+)$/);if(!d){let t=e.trim(),o=n("__root__",i(t),l),d={id:o,label:t,depth:0,children:[]};a.push(d),s.push(d),r.set(o,d),c=d,u=null;continue}let m=d[1].trim(),g=2>=Math.max(e.indexOf("├─"),e.indexOf("└─"))?1:2,p=1===g?c:u;if(!p)continue;let h=i(m),y=n(p.id,h,l),f=`${p.id}.${y}`,v={id:f,label:m,depth:g,parentId:p.id,children:[]};p.children.push(v),s.push(v),r.set(f,v),1===g&&(u=v),2===g&&o.push(v)}return{roots:a,byId:r,all:s,leaves:o}}();function r(e){let t=a.byId.get(e);if(!t)return null;let i=[t.id],n=t.parentId;for(;n;)i.push(n),n=a.byId.get(n)?.parentId;return i.reverse()}function s(e,t){let i;if(!e)return t?.unknownFallback??"";let n=(i=r(e))?i.map(e=>a.byId.get(e)?.label??e):null;return n?n.join(t?.separator??" › "):t?.unknownFallback??e}function o(e,t){return!t||"all"===t||!!e&&(e===t||e.startsWith(`${t}.`))}e.s(["JOB_TAXONOMY",0,a,"getJobCategoryDisplay",()=>s,"getJobCategoryPathIds",()=>r,"jobCategoryMatches",()=>o],43771)},57752,e=>{"use strict";var t=e.i(22047),i=e.i(21525),n=e.i(29364),a=e.i(38286),r=e.i(43771);function s(e,t){if(!e||e===t)return{mainId:r.JOB_TAXONOMY.roots[0]?.id??"",subId:""};let i=(0,r.getJobCategoryPathIds)(e);return i&&0!==i.length?{mainId:i[0]??"",subId:i.length>=2?i[1]:""}:{mainId:r.JOB_TAXONOMY.roots[0]?.id??"",subId:""}}function o(e){let o,c,u,d,m,g,p,h,y,f,v,S,x,b,C,P,M,R,E,j,A,D,T=(0,i.c)(93),{value:O,onChange:w,placeholder:I,disabled:k,className:N,allowNonLeaf:_,allowAllOption:q,allValue:L,allLabel:F,label:B,helperText:G}=e,V=void 0===I?"Select a category":I,H=void 0!==_&&_,U=void 0!==q&&q,z=void 0===L?"all":L,W=void 0===F?"All categories":F,[$,Q]=(0,n.useState)(!1),[X,J]=(0,n.useState)("");T[0]!==z||T[1]!==O?(o=()=>s(O,z),T[0]=z,T[1]=O,T[2]=o):o=T[2];let[Y,K]=(0,n.useState)(o),{mainId:Z,subId:ee}=Y;T[3]!==z||T[4]!==$||T[5]!==O?(c=()=>{$&&(J(""),K(s(O,z)))},u=[$,O,z],T[3]=z,T[4]=$,T[5]=O,T[6]=c,T[7]=u):(c=T[6],u=T[7]),(0,n.useEffect)(c,u);e:{let e;if(U&&O===z){d=W;break e}if(!O){d="";break e}T[8]!==O?(e=(0,r.getJobCategoryDisplay)(O,{separator:" › ",unknownFallback:O}),T[8]=O,T[9]=e):e=T[9],d=e}let et=d,ei=r.JOB_TAXONOMY.roots;if(T[10]!==W||T[11]!==z||T[12]!==U||T[13]!==H||T[14]!==N||T[15]!==k||T[16]!==G||T[17]!==B||T[18]!==Z||T[19]!==w||T[20]!==$||T[21]!==V||T[22]!==X||T[23]!==et||T[24]!==ee||T[25]!==O){let e,i,n,s,o,c,u,d,M,R=ei.find(e=>e.id===Z)??ei[0],E=R?.children??[],j=E.find(e=>e.id===ee)??E[0],A=j?.children??[];if(T[38]!==X){t:{let t=X.trim().toLowerCase();if(!t){let t;T[40]===Symbol.for("react.memo_cache_sentinel")?(t=[],T[40]=t):t=T[40],e=t;break t}e=r.JOB_TAXONOMY.leaves.map(l).filter(e=>e.display.toLowerCase().includes(t)).slice(0,80)}T[38]=X,T[39]=e}else e=T[39];let D=e;T[41]===Symbol.for("react.memo_cache_sentinel")?(i=()=>Q(!0),T[41]=i):i=T[41],T[42]!==N?(n=(0,a.cn)("w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-left text-sm transition focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100/70 disabled:bg-slate-50 disabled:cursor-not-allowed",N),T[42]=N,T[43]=n):n=T[43];let I=et?"text-slate-900":"text-slate-400";T[44]!==I?(s=(0,a.cn)("truncate",I),T[44]=I,T[45]=s):s=T[45];let _=et||V;T[46]!==s||T[47]!==_?(o=(0,t.jsx)("div",{className:"min-w-0",children:(0,t.jsx)("div",{className:s,children:_})}),T[46]=s,T[47]=_,T[48]=o):o=T[48],T[49]===Symbol.for("react.memo_cache_sentinel")?(c=(0,t.jsx)("svg",{className:"h-4 w-4 flex-shrink-0 text-slate-400",viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":!0,children:(0,t.jsx)("path",{fillRule:"evenodd",d:"M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.7a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z",clipRule:"evenodd"})}),T[49]=c):c=T[49],T[50]!==o?(u=(0,t.jsxs)("div",{className:"flex items-center justify-between gap-3",children:[o,c]}),T[50]=o,T[51]=u):u=T[51],T[52]!==k||T[53]!==n||T[54]!==u?(d=(0,t.jsx)("button",{type:"button",disabled:k,onClick:i,className:n,children:u}),T[52]=k,T[53]=n,T[54]=u,T[55]=d):d=T[55];let q=d;x="grid gap-2",T[56]!==B?(b=B?(0,t.jsx)("label",{className:"text-sm font-medium text-slate-700",children:B}):null,T[56]=B,T[57]=b):b=T[57],C=q,T[58]!==G?(P=G?(0,t.jsx)("p",{className:"text-xs text-slate-500",children:G}):null,T[58]=G,T[59]=P):P=T[59],m=a.Modal,f=$,T[60]===Symbol.for("react.memo_cache_sentinel")?(v=()=>Q(!1),T[60]=v):v=T[60],S=H?"Choose a category":"Choose a specialization",g="space-y-4",T[61]===Symbol.for("react.memo_cache_sentinel")?(M=e=>J(e.target.value),T[61]=M):M=T[61],T[62]!==X?(p=(0,t.jsx)(a.Input,{value:X,onChange:M,placeholder:"Search categories..."}),T[62]=X,T[63]=p):p=T[63],T[64]!==W||T[65]!==z||T[66]!==U||T[67]!==w||T[68]!==O?(h=U&&(0,t.jsxs)("button",{type:"button",onClick:()=>{w(z),Q(!1)},className:(0,a.cn)("flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",O===z?"border-emerald-200 bg-emerald-50/60 text-emerald-800":"border-slate-200/70 bg-white/80 text-slate-700 hover:border-slate-300"),children:[(0,t.jsx)("span",{children:W}),(0,t.jsx)("span",{className:"text-xs font-semibold text-slate-400",children:"Reset"})]}),T[64]=W,T[65]=z,T[66]=U,T[67]=w,T[68]=O,T[69]=h):h=T[69],y=X.trim()?(0,t.jsx)("div",{className:"max-h-[55vh] overflow-auto rounded-2xl border border-slate-200/70 bg-white/70",children:0===D.length?(0,t.jsx)("div",{className:"p-4 text-sm text-slate-600",children:"No matches."}):(0,t.jsx)("div",{className:"divide-y divide-slate-200/70",children:D.map(e=>(0,t.jsxs)("button",{type:"button",onClick:()=>{w(e.id),Q(!1)},className:(0,a.cn)("flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/80",O===e.id?"bg-emerald-50/60":""),children:[(0,t.jsx)("span",{className:"min-w-0 truncate font-semibold text-slate-900",children:e.display}),(0,t.jsx)("span",{className:"text-xs font-semibold text-slate-400",children:"Select"})]},e.id))})}):(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-3",children:[(0,t.jsxs)("div",{className:"rounded-2xl border border-slate-200/70 bg-white/70",children:[(0,t.jsx)("div",{className:"border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500",children:"Main"}),(0,t.jsx)("div",{className:"max-h-[45vh] overflow-auto p-2",children:ei.map(e=>(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)("button",{type:"button",onClick:()=>K({mainId:e.id,subId:e.children[0]?.id??""}),className:(0,a.cn)("flex-1 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",e.id===Z?"bg-slate-900 text-white":"text-slate-700 hover:bg-white/80"),children:e.label}),H&&(0,t.jsx)("button",{type:"button",onClick:()=>{w(e.id),Q(!1)},className:"rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300",children:"Use"})]},e.id))})]}),(0,t.jsxs)("div",{className:"rounded-2xl border border-slate-200/70 bg-white/70",children:[(0,t.jsx)("div",{className:"border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500",children:"Subcategory"}),(0,t.jsx)("div",{className:"max-h-[45vh] overflow-auto p-2",children:0===E.length?(0,t.jsx)("div",{className:"p-4 text-sm text-slate-600",children:"Pick a main category first."}):E.map(e=>(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)("button",{type:"button",onClick:()=>K({mainId:Z,subId:e.id}),className:(0,a.cn)("flex-1 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",e.id===ee?"bg-slate-900 text-white":"text-slate-700 hover:bg-white/80"),children:e.label}),H&&(0,t.jsx)("button",{type:"button",onClick:()=>{w(e.id),Q(!1)},className:"rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300",children:"Use"})]},e.id))})]}),(0,t.jsxs)("div",{className:"rounded-2xl border border-slate-200/70 bg-white/70",children:[(0,t.jsx)("div",{className:"border-b border-slate-200/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500",children:"Specialization"}),(0,t.jsx)("div",{className:"max-h-[45vh] overflow-auto p-2",children:0===A.length?(0,t.jsx)("div",{className:"p-4 text-sm text-slate-600",children:"Pick a subcategory to see specializations."}):A.map(e=>(0,t.jsxs)("button",{type:"button",onClick:()=>{w(e.id),Q(!1)},className:(0,a.cn)("flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-white/80",e.id===O?"bg-emerald-50/60 text-emerald-800":"text-slate-700"),children:[(0,t.jsx)("span",{className:"min-w-0 truncate",children:e.label}),(0,t.jsx)("span",{className:"text-xs font-semibold text-slate-400",children:"Select"})]},e.id))})]})]}),T[10]=W,T[11]=z,T[12]=U,T[13]=H,T[14]=N,T[15]=k,T[16]=G,T[17]=B,T[18]=Z,T[19]=w,T[20]=$,T[21]=V,T[22]=X,T[23]=et,T[24]=ee,T[25]=O,T[26]=m,T[27]=g,T[28]=p,T[29]=h,T[30]=y,T[31]=f,T[32]=v,T[33]=S,T[34]=x,T[35]=b,T[36]=C,T[37]=P}else m=T[26],g=T[27],p=T[28],h=T[29],y=T[30],f=T[31],v=T[32],S=T[33],x=T[34],b=T[35],C=T[36],P=T[37];return T[70]!==w?(M=(0,t.jsx)("button",{type:"button",onClick:()=>{w(""),Q(!1)},className:"text-sm font-semibold text-slate-600 transition hover:text-slate-900",children:"Clear selection"}),T[70]=w,T[71]=M):M=T[71],T[72]===Symbol.for("react.memo_cache_sentinel")?(R=(0,t.jsx)("button",{type:"button",onClick:()=>Q(!1),className:"rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300",children:"Done"}),T[72]=R):R=T[72],T[73]!==M?(E=(0,t.jsxs)("div",{className:"flex items-center justify-between gap-3 pt-2",children:[M,R]}),T[73]=M,T[74]=E):E=T[74],T[75]!==g||T[76]!==p||T[77]!==h||T[78]!==y||T[79]!==E?(j=(0,t.jsxs)("div",{className:g,children:[p,h,y,E]}),T[75]=g,T[76]=p,T[77]=h,T[78]=y,T[79]=E,T[80]=j):j=T[80],T[81]!==m||T[82]!==f||T[83]!==v||T[84]!==S||T[85]!==j?(A=(0,t.jsx)(m,{open:f,onClose:v,title:S,children:j}),T[81]=m,T[82]=f,T[83]=v,T[84]=S,T[85]=j,T[86]=A):A=T[86],T[87]!==x||T[88]!==b||T[89]!==C||T[90]!==P||T[91]!==A?(D=(0,t.jsxs)("div",{className:x,children:[b,C,P,A]}),T[87]=x,T[88]=b,T[89]=C,T[90]=P,T[91]=A,T[92]=D):D=T[92],D}function l(e){return{id:e.id,display:(0,r.getJobCategoryDisplay)(e.id,{unknownFallback:e.label})}}e.s(["default",()=>o])},28336,e=>{"use strict";var t=e.i(22047),i=e.i(21525),n=e.i(89138),a=e.i(25284),r=e.i(9165),s=e.i(29364),o=e.i(34022),l=e.i(38286),c=e.i(57752);function u(){let e,u,g,p,h,y,f,v,S,x,b,C,P,M,R,E,j,A,D,T,O,w,I,k,N,_,q,L,F,B,G,V,H,U,z,W,$,Q,X,J,Y,K,Z,ee,et,ei,en,ea,er,es,eo,el,ec,eu,ed,em,eg,ep,eh,ey,ef,ev,eS,ex,eb,eC,eP,eM,eR,eE,ej,eA,eD,eT,eO,ew,eI,ek,eN,e_,eq,eL,eF,eB,eG,eV,eH,eU,ez,eW,e$,eQ,eX,eJ,eY,eK,eZ,e0,e2,e1,e3,e4,e8,e5,e7,e6,e9,te,tt,ti,tn,ta,tr,ts,to,tl,tc,tu,td,tm,tg,tp,th,ty,tf,tv,tS,tx,tb,tC,tP,tM,tR,tE,tj,tA,tD,tT,tO,tw,tI,tk,tN,t_,tq,tL,tF,tB,tG,tV,tH,tU,tz,tW,t$,tQ,tX,tJ,tY,tK,tZ,t0,t2,t1,t3,t4,t8,t5,t7,t6,t9,ie=(0,i.c)(438),it=(0,n.useRouter)();ie[0]===Symbol.for("react.memo_cache_sentinel")?(e={title:"",description:"",overviewText:"",companyName:"",categoryId:"",workLocation:"Remote",engagementType:"PROJECT_BASED",deliverableType:"VIDEO_PRODUCTION",deliverableScopes:"",skills:"",industry:"",teamSize:"",budgetMin:"",budgetMax:"",currency:"USD",pricingModel:"FIXED_PRICE",slaDeliveryDays:"",includedRevisionRounds:"",qualityStandards:"",requiredFormats:"",minYearsExperience:"",requiredSkills:"",requiredTools:"",requiredQualifications:"",preferredExperience:"",requiresPortfolio:!0,requiresReferences:!1,minReferenceCount:"",requiresNDA:!1,requiresBGCheck:!1,requiresInsurance:!1,complianceRequirements:"",dataClassifications:"",pilotProjectRequired:!1,pilotProjectScope:"",pilotEstimatedHours:"",preferredVendorOpportunity:!1,minimumMonthlyCommitment:"",contractTermMonths:"",rateStabilityGuarantee:!1,closingDate:"",evaluationProcess:"",applicationGuidelineUrls:"",isEnterpriseOnly:!0},ie[0]=e):e=ie[0];let[ii,ia]=(0,s.useState)(e);ie[1]===Symbol.for("react.memo_cache_sentinel")?(u=[],ie[1]=u):u=ie[1];let[ir,is]=(0,s.useState)(u);ie[2]===Symbol.for("react.memo_cache_sentinel")?(g=[],ie[2]=g):g=ie[2];let[io,il]=(0,s.useState)(g);ie[3]===Symbol.for("react.memo_cache_sentinel")?(p=[],ie[3]=p):p=ie[3];let[ic,iu]=(0,s.useState)(p);ie[4]===Symbol.for("react.memo_cache_sentinel")?(h=[],ie[4]=h):h=ie[4];let[id,im]=(0,s.useState)(h),ig=m,ip=d;ie[5]!==ii.applicationGuidelineUrls||ie[6]!==ii.budgetMax||ie[7]!==ii.budgetMin||ie[8]!==ii.categoryId||ie[9]!==ii.closingDate||ie[10]!==ii.companyName||ie[11]!==ii.complianceRequirements||ie[12]!==ii.contractTermMonths||ie[13]!==ii.currency||ie[14]!==ii.dataClassifications||ie[15]!==ii.deliverableScopes||ie[16]!==ii.deliverableType||ie[17]!==ii.description||ie[18]!==ii.engagementType||ie[19]!==ii.evaluationProcess||ie[20]!==ii.includedRevisionRounds||ie[21]!==ii.industry||ie[22]!==ii.isEnterpriseOnly||ie[23]!==ii.minReferenceCount||ie[24]!==ii.minYearsExperience||ie[25]!==ii.minimumMonthlyCommitment||ie[26]!==ii.overviewText||ie[27]!==ii.pilotEstimatedHours||ie[28]!==ii.pilotProjectRequired||ie[29]!==ii.pilotProjectScope||ie[30]!==ii.preferredExperience||ie[31]!==ii.preferredVendorOpportunity||ie[32]!==ii.pricingModel||ie[33]!==ii.qualityStandards||ie[34]!==ii.rateStabilityGuarantee||ie[35]!==ii.requiredFormats||ie[36]!==ii.requiredQualifications||ie[37]!==ii.requiredSkills||ie[38]!==ii.requiredTools||ie[39]!==ii.requiresBGCheck||ie[40]!==ii.requiresInsurance||ie[41]!==ii.requiresNDA||ie[42]!==ii.requiresPortfolio||ie[43]!==ii.requiresReferences||ie[44]!==ii.skills||ie[45]!==ii.slaDeliveryDays||ie[46]!==ii.teamSize||ie[47]!==ii.title||ie[48]!==ii.workLocation||ie[49]!==id||ie[50]!==ir||ie[51]!==io||ie[52]!==ic?(y=async()=>{let[e,t,i,n]=await Promise.all([(0,r.uploadJobSampleDocuments)(ir),(0,r.uploadJobSampleImages)(io),(0,r.uploadJobSampleVideos)(ic),(0,r.uploadJobSampleAudio)(id)]);return(0,r.createJob)({title:ii.title,description:ii.description,overviewText:ii.overviewText||void 0,companyName:ii.companyName||void 0,categoryId:ii.categoryId||void 0,workLocation:ii.workLocation||void 0,engagementType:ii.engagementType,deliverableType:ii.deliverableType,deliverableScopes:ig(ii.deliverableScopes),skills:ig(ii.skills),industry:ig(ii.industry),teamSize:ig(ii.teamSize),budgetMin:ip(ii.budgetMin),budgetMax:ip(ii.budgetMax),currency:ii.currency||void 0,pricingModel:ii.pricingModel,slaDeliveryDays:ip(ii.slaDeliveryDays),includedRevisionRounds:ip(ii.includedRevisionRounds),qualityStandards:ig(ii.qualityStandards),requiredFormats:ig(ii.requiredFormats),minYearsExperience:ip(ii.minYearsExperience),requiredSkills:ig(ii.requiredSkills),requiredTools:ig(ii.requiredTools),requiredQualifications:ig(ii.requiredQualifications),preferredExperience:ig(ii.preferredExperience),requiresPortfolio:ii.requiresPortfolio,requiresReferences:ii.requiresReferences,minReferenceCount:ip(ii.minReferenceCount),requiresNDA:ii.requiresNDA,requiresBGCheck:ii.requiresBGCheck,requiresInsurance:ii.requiresInsurance,complianceRequirements:ig(ii.complianceRequirements),dataClassifications:ig(ii.dataClassifications),pilotProjectRequired:ii.pilotProjectRequired,pilotProjectScope:ii.pilotProjectScope||void 0,pilotEstimatedHours:ip(ii.pilotEstimatedHours),preferredVendorOpportunity:ii.preferredVendorOpportunity,minimumMonthlyCommitment:ip(ii.minimumMonthlyCommitment),contractTermMonths:ip(ii.contractTermMonths),rateStabilityGuarantee:ii.rateStabilityGuarantee,closingDate:ii.closingDate?new Date(ii.closingDate).toISOString():void 0,evaluationProcess:ii.evaluationProcess||void 0,applicationGuidelineUrls:ig(ii.applicationGuidelineUrls),sampleDocumentUrls:e,sampleImageUrls:t,sampleVideoUrls:i,sampleAudioUrls:n,isEnterpriseOnly:ii.isEnterpriseOnly})},ie[5]=ii.applicationGuidelineUrls,ie[6]=ii.budgetMax,ie[7]=ii.budgetMin,ie[8]=ii.categoryId,ie[9]=ii.closingDate,ie[10]=ii.companyName,ie[11]=ii.complianceRequirements,ie[12]=ii.contractTermMonths,ie[13]=ii.currency,ie[14]=ii.dataClassifications,ie[15]=ii.deliverableScopes,ie[16]=ii.deliverableType,ie[17]=ii.description,ie[18]=ii.engagementType,ie[19]=ii.evaluationProcess,ie[20]=ii.includedRevisionRounds,ie[21]=ii.industry,ie[22]=ii.isEnterpriseOnly,ie[23]=ii.minReferenceCount,ie[24]=ii.minYearsExperience,ie[25]=ii.minimumMonthlyCommitment,ie[26]=ii.overviewText,ie[27]=ii.pilotEstimatedHours,ie[28]=ii.pilotProjectRequired,ie[29]=ii.pilotProjectScope,ie[30]=ii.preferredExperience,ie[31]=ii.preferredVendorOpportunity,ie[32]=ii.pricingModel,ie[33]=ii.qualityStandards,ie[34]=ii.rateStabilityGuarantee,ie[35]=ii.requiredFormats,ie[36]=ii.requiredQualifications,ie[37]=ii.requiredSkills,ie[38]=ii.requiredTools,ie[39]=ii.requiresBGCheck,ie[40]=ii.requiresInsurance,ie[41]=ii.requiresNDA,ie[42]=ii.requiresPortfolio,ie[43]=ii.requiresReferences,ie[44]=ii.skills,ie[45]=ii.slaDeliveryDays,ie[46]=ii.teamSize,ie[47]=ii.title,ie[48]=ii.workLocation,ie[49]=id,ie[50]=ir,ie[51]=io,ie[52]=ic,ie[53]=y):y=ie[53],ie[54]!==it?(f=e=>it.push(`/dashboard/jobs/${e.id}`),ie[54]=it,ie[55]=f):f=ie[55],ie[56]!==y||ie[57]!==f?(v={mutationFn:y,onSuccess:f},ie[56]=y,ie[57]=f,ie[58]=v):v=ie[58];let ih=(0,a.useMutation)(v);ie[59]!==ii.description||ie[60]!==ii.title?(S=!ii.title.trim()||!ii.description.trim(),ie[59]=ii.description,ie[60]=ii.title,ie[61]=S):S=ie[61];let iy=S;ie[62]===Symbol.for("react.memo_cache_sentinel")?(b=(0,t.jsx)("div",{className:"absolute inset-0 -z-10 opacity-80",style:{backgroundImage:"url('/images/backgrounds/geo-light-grid.svg')"}}),x=(0,t.jsx)("div",{className:"absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.22),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(167,139,250,0.22),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(16,185,129,0.18),transparent_35%)]"}),ie[62]=x,ie[63]=b):(x=ie[62],b=ie[63]),ie[64]===Symbol.for("react.memo_cache_sentinel")?(C=(0,t.jsx)("div",{className:"relative h-14 w-14 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner",children:(0,t.jsx)(o.default,{src:"/images/badges/info.png",alt:"info badge",fill:!0,className:"object-contain"})}),ie[64]=C):C=ie[64],ie[65]===Symbol.for("react.memo_cache_sentinel")?(P=(0,t.jsx)("header",{className:"mb-6 rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur",children:(0,t.jsxs)("div",{className:"flex items-start gap-4",children:[C,(0,t.jsxs)("div",{className:"space-y-2",children:[(0,t.jsxs)("div",{className:"flex flex-wrap items-center gap-3",children:[(0,t.jsx)("h1",{className:"text-2xl font-bold text-slate-900",children:"Post a Job"}),(0,t.jsx)(l.Badge,{variant:"info",className:"bg-sky-50/80 text-sky-700",children:"Enterprise-grade"}),(0,t.jsx)(l.Badge,{variant:"success",className:"bg-emerald-50/80 text-emerald-700",children:"Real API"})]}),(0,t.jsx)("p",{className:"text-slate-700",children:"Capture detailed requirements to attract qualified freelancers and vendor teams."})]})]})}),ie[65]=P):P=ie[65],ie[66]===Symbol.for("react.memo_cache_sentinel")?(M=(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Basics"}),ie[66]=M):M=ie[66],ie[67]!==ii?(R=e=>ia({...ii,title:e.target.value}),ie[67]=ii,ie[68]=R):R=ie[68],ie[69]!==ii.title||ie[70]!==R?(E=(0,t.jsx)(l.Input,{value:ii.title,onChange:R,placeholder:"Role title or project headline"}),ie[69]=ii.title,ie[70]=R,ie[71]=E):E=ie[71],ie[72]!==ii?(j=e=>ia({...ii,description:e.target.value}),ie[72]=ii,ie[73]=j):j=ie[73],ie[74]!==ii.description||ie[75]!==j?(A=(0,t.jsx)(l.Textarea,{value:ii.description,onChange:j,rows:6,placeholder:"Describe the work, scope, success criteria, and constraints."}),ie[74]=ii.description,ie[75]=j,ie[76]=A):A=ie[76],ie[77]!==ii?(D=e=>ia({...ii,overviewText:e.target.value}),ie[77]=ii,ie[78]=D):D=ie[78],ie[79]!==ii.overviewText||ie[80]!==D?(T=(0,t.jsx)(l.Textarea,{value:ii.overviewText,onChange:D,rows:3,placeholder:"Short overview for quick scanning (optional)"}),ie[79]=ii.overviewText,ie[80]=D,ie[81]=T):T=ie[81],ie[82]!==ii?(O=e=>ia({...ii,companyName:e.target.value}),ie[82]=ii,ie[83]=O):O=ie[83],ie[84]!==ii.companyName||ie[85]!==O?(w=(0,t.jsx)(l.Input,{value:ii.companyName,onChange:O,placeholder:"Company name"}),ie[84]=ii.companyName,ie[85]=O,ie[86]=w):w=ie[86],ie[87]!==ii?(I=e=>ia({...ii,categoryId:e}),ie[87]=ii,ie[88]=I):I=ie[88],ie[89]!==ii.categoryId||ie[90]!==I?(k=(0,t.jsx)(c.default,{value:ii.categoryId,onChange:I,placeholder:"Select a category",helperText:"Pick the closest specialization — used for marketplace discovery."}),ie[89]=ii.categoryId,ie[90]=I,ie[91]=k):k=ie[91],ie[92]!==w||ie[93]!==k?(N=(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-2",children:[w,k]}),ie[92]=w,ie[93]=k,ie[94]=N):N=ie[94],ie[95]!==E||ie[96]!==A||ie[97]!==T||ie[98]!==N?(_=(0,t.jsxs)("div",{className:"grid gap-4",children:[M,E,A,T,N]}),ie[95]=E,ie[96]=A,ie[97]=T,ie[98]=N,ie[99]=_):_=ie[99],ie[100]===Symbol.for("react.memo_cache_sentinel")?(q=(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Engagement"}),ie[100]=q):q=ie[100],ie[101]!==ii?(L=e=>ia({...ii,engagementType:e.target.value}),ie[101]=ii,ie[102]=L):L=ie[102],ie[103]===Symbol.for("react.memo_cache_sentinel")?(F=(0,t.jsx)("option",{value:"PROJECT_BASED",children:"Project-based"}),B=(0,t.jsx)("option",{value:"CONTRACT",children:"Contract"}),G=(0,t.jsx)("option",{value:"LONG_TERM_PARTNERSHIP",children:"Long-term partnership"}),V=(0,t.jsx)("option",{value:"RETAINER",children:"Retainer"}),ie[103]=F,ie[104]=B,ie[105]=G,ie[106]=V):(F=ie[103],B=ie[104],G=ie[105],V=ie[106]),ie[107]!==ii.engagementType||ie[108]!==L?(H=(0,t.jsxs)(l.Select,{value:ii.engagementType,onChange:L,children:[F,B,G,V]}),ie[107]=ii.engagementType,ie[108]=L,ie[109]=H):H=ie[109],ie[110]!==ii?(U=e=>ia({...ii,deliverableType:e.target.value}),ie[110]=ii,ie[111]=U):U=ie[111],ie[112]===Symbol.for("react.memo_cache_sentinel")?(z=(0,t.jsx)("option",{value:"IMAGE_DESIGN",children:"Image design"}),W=(0,t.jsx)("option",{value:"VIDEO_PRODUCTION",children:"Video production"}),$=(0,t.jsx)("option",{value:"AUDIO_PRODUCTION",children:"Audio production"}),Q=(0,t.jsx)("option",{value:"DOCUMENT_DEVELOPMENT",children:"Document development"}),X=(0,t.jsx)("option",{value:"MIXED",children:"Mixed media"}),ie[112]=z,ie[113]=W,ie[114]=$,ie[115]=Q,ie[116]=X):(z=ie[112],W=ie[113],$=ie[114],Q=ie[115],X=ie[116]),ie[117]!==ii.deliverableType||ie[118]!==U?(J=(0,t.jsxs)(l.Select,{value:ii.deliverableType,onChange:U,children:[z,W,$,Q,X]}),ie[117]=ii.deliverableType,ie[118]=U,ie[119]=J):J=ie[119],ie[120]!==H||ie[121]!==J?(Y=(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-2",children:[H,J]}),ie[120]=H,ie[121]=J,ie[122]=Y):Y=ie[122],ie[123]!==ii?(K=e=>ia({...ii,deliverableScopes:e.target.value}),ie[123]=ii,ie[124]=K):K=ie[124],ie[125]!==ii.deliverableScopes||ie[126]!==K?(Z=(0,t.jsx)(l.Input,{value:ii.deliverableScopes,onChange:K,placeholder:"Deliverable scopes (comma separated)"}),ie[125]=ii.deliverableScopes,ie[126]=K,ie[127]=Z):Z=ie[127],ie[128]!==ii?(ee=e=>ia({...ii,workLocation:e.target.value}),ie[128]=ii,ie[129]=ee):ee=ie[129],ie[130]===Symbol.for("react.memo_cache_sentinel")?(et=(0,t.jsx)("option",{value:"Remote",children:"Remote"}),ei=(0,t.jsx)("option",{value:"Hybrid",children:"Hybrid"}),en=(0,t.jsx)("option",{value:"On-site",children:"On-site"}),ea=(0,t.jsx)("option",{value:"Global",children:"Global"}),ie[130]=et,ie[131]=ei,ie[132]=en,ie[133]=ea):(et=ie[130],ei=ie[131],en=ie[132],ea=ie[133]),ie[134]!==ii.workLocation||ie[135]!==ee?(er=(0,t.jsxs)(l.Select,{value:ii.workLocation,onChange:ee,children:[et,ei,en,ea]}),ie[134]=ii.workLocation,ie[135]=ee,ie[136]=er):er=ie[136],ie[137]!==ii?(es=e=>ia({...ii,teamSize:e.target.value}),ie[137]=ii,ie[138]=es):es=ie[138],ie[139]!==ii.teamSize||ie[140]!==es?(eo=(0,t.jsx)(l.Input,{value:ii.teamSize,onChange:es,placeholder:"Team size fit (comma separated)"}),ie[139]=ii.teamSize,ie[140]=es,ie[141]=eo):eo=ie[141],ie[142]!==er||ie[143]!==eo?(el=(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-2",children:[er,eo]}),ie[142]=er,ie[143]=eo,ie[144]=el):el=ie[144],ie[145]!==Y||ie[146]!==Z||ie[147]!==el?(ec=(0,t.jsxs)("div",{className:"grid gap-4",children:[q,Y,Z,el]}),ie[145]=Y,ie[146]=Z,ie[147]=el,ie[148]=ec):ec=ie[148],ie[149]===Symbol.for("react.memo_cache_sentinel")?(eu=(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Budget & SLA"}),ie[149]=eu):eu=ie[149],ie[150]!==ii?(ed=e=>ia({...ii,budgetMin:e.target.value}),ie[150]=ii,ie[151]=ed):ed=ie[151],ie[152]!==ii.budgetMin||ie[153]!==ed?(em=(0,t.jsx)(l.Input,{type:"number",value:ii.budgetMin,onChange:ed,placeholder:"Budget min"}),ie[152]=ii.budgetMin,ie[153]=ed,ie[154]=em):em=ie[154],ie[155]!==ii?(eg=e=>ia({...ii,budgetMax:e.target.value}),ie[155]=ii,ie[156]=eg):eg=ie[156],ie[157]!==ii.budgetMax||ie[158]!==eg?(ep=(0,t.jsx)(l.Input,{type:"number",value:ii.budgetMax,onChange:eg,placeholder:"Budget max"}),ie[157]=ii.budgetMax,ie[158]=eg,ie[159]=ep):ep=ie[159],ie[160]!==ii?(eh=e=>ia({...ii,currency:e.target.value}),ie[160]=ii,ie[161]=eh):eh=ie[161],ie[162]!==ii.currency||ie[163]!==eh?(ey=(0,t.jsx)(l.Input,{value:ii.currency,onChange:eh,placeholder:"Currency (e.g., USD)"}),ie[162]=ii.currency,ie[163]=eh,ie[164]=ey):ey=ie[164],ie[165]!==em||ie[166]!==ep||ie[167]!==ey?(ef=(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-3",children:[em,ep,ey]}),ie[165]=em,ie[166]=ep,ie[167]=ey,ie[168]=ef):ef=ie[168],ie[169]!==ii?(ev=e=>ia({...ii,pricingModel:e.target.value}),ie[169]=ii,ie[170]=ev):ev=ie[170],ie[171]===Symbol.for("react.memo_cache_sentinel")?(eS=(0,t.jsx)("option",{value:"FIXED_PRICE",children:"Fixed price"}),ex=(0,t.jsx)("option",{value:"HOURLY",children:"Hourly"}),eb=(0,t.jsx)("option",{value:"RETAINER",children:"Retainer"}),eC=(0,t.jsx)("option",{value:"VOLUME_BASED",children:"Volume based"}),ie[171]=eS,ie[172]=ex,ie[173]=eb,ie[174]=eC):(eS=ie[171],ex=ie[172],eb=ie[173],eC=ie[174]),ie[175]!==ii.pricingModel||ie[176]!==ev?(eP=(0,t.jsxs)(l.Select,{value:ii.pricingModel,onChange:ev,children:[eS,ex,eb,eC]}),ie[175]=ii.pricingModel,ie[176]=ev,ie[177]=eP):eP=ie[177],ie[178]!==ii?(eM=e=>ia({...ii,slaDeliveryDays:e.target.value}),ie[178]=ii,ie[179]=eM):eM=ie[179],ie[180]!==ii.slaDeliveryDays||ie[181]!==eM?(eR=(0,t.jsx)(l.Input,{type:"number",value:ii.slaDeliveryDays,onChange:eM,placeholder:"SLA delivery days"}),ie[180]=ii.slaDeliveryDays,ie[181]=eM,ie[182]=eR):eR=ie[182],ie[183]!==ii?(eE=e=>ia({...ii,includedRevisionRounds:e.target.value}),ie[183]=ii,ie[184]=eE):eE=ie[184],ie[185]!==ii.includedRevisionRounds||ie[186]!==eE?(ej=(0,t.jsx)(l.Input,{type:"number",value:ii.includedRevisionRounds,onChange:eE,placeholder:"Included revisions"}),ie[185]=ii.includedRevisionRounds,ie[186]=eE,ie[187]=ej):ej=ie[187],ie[188]!==eP||ie[189]!==eR||ie[190]!==ej?(eA=(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-3",children:[eP,eR,ej]}),ie[188]=eP,ie[189]=eR,ie[190]=ej,ie[191]=eA):eA=ie[191],ie[192]!==ef||ie[193]!==eA?(eD=(0,t.jsxs)("div",{className:"grid gap-4",children:[eu,ef,eA]}),ie[192]=ef,ie[193]=eA,ie[194]=eD):eD=ie[194],ie[195]===Symbol.for("react.memo_cache_sentinel")?(eT=(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Skills & Requirements"}),ie[195]=eT):eT=ie[195],ie[196]!==ii?(eO=e=>ia({...ii,skills:e.target.value}),ie[196]=ii,ie[197]=eO):eO=ie[197],ie[198]!==ii.skills||ie[199]!==eO?(ew=(0,t.jsx)(l.Input,{value:ii.skills,onChange:eO,placeholder:"Key skills (comma separated)"}),ie[198]=ii.skills,ie[199]=eO,ie[200]=ew):ew=ie[200],ie[201]!==ii?(eI=e=>ia({...ii,requiredSkills:e.target.value}),ie[201]=ii,ie[202]=eI):eI=ie[202],ie[203]!==ii.requiredSkills||ie[204]!==eI?(ek=(0,t.jsx)(l.Input,{value:ii.requiredSkills,onChange:eI,placeholder:"Required skills (comma separated)"}),ie[203]=ii.requiredSkills,ie[204]=eI,ie[205]=ek):ek=ie[205],ie[206]!==ii?(eN=e=>ia({...ii,requiredTools:e.target.value}),ie[206]=ii,ie[207]=eN):eN=ie[207],ie[208]!==ii.requiredTools||ie[209]!==eN?(e_=(0,t.jsx)(l.Input,{value:ii.requiredTools,onChange:eN,placeholder:"Required tools (comma separated)"}),ie[208]=ii.requiredTools,ie[209]=eN,ie[210]=e_):e_=ie[210],ie[211]!==ii?(eq=e=>ia({...ii,requiredQualifications:e.target.value}),ie[211]=ii,ie[212]=eq):eq=ie[212],ie[213]!==ii.requiredQualifications||ie[214]!==eq?(eL=(0,t.jsx)(l.Input,{value:ii.requiredQualifications,onChange:eq,placeholder:"Required qualifications (comma separated)"}),ie[213]=ii.requiredQualifications,ie[214]=eq,ie[215]=eL):eL=ie[215],ie[216]!==ii?(eF=e=>ia({...ii,preferredExperience:e.target.value}),ie[216]=ii,ie[217]=eF):eF=ie[217],ie[218]!==ii.preferredExperience||ie[219]!==eF?(eB=(0,t.jsx)(l.Input,{value:ii.preferredExperience,onChange:eF,placeholder:"Preferred experience (comma separated)"}),ie[218]=ii.preferredExperience,ie[219]=eF,ie[220]=eB):eB=ie[220],ie[221]!==ii?(eG=e=>ia({...ii,minYearsExperience:e.target.value}),ie[221]=ii,ie[222]=eG):eG=ie[222],ie[223]!==ii.minYearsExperience||ie[224]!==eG?(eV=(0,t.jsx)(l.Input,{type:"number",value:ii.minYearsExperience,onChange:eG,placeholder:"Min years experience"}),ie[223]=ii.minYearsExperience,ie[224]=eG,ie[225]=eV):eV=ie[225],ie[226]!==ii?(eH=e=>ia({...ii,minReferenceCount:e.target.value}),ie[226]=ii,ie[227]=eH):eH=ie[227],ie[228]!==ii.minReferenceCount||ie[229]!==eH?(eU=(0,t.jsx)(l.Input,{type:"number",value:ii.minReferenceCount,onChange:eH,placeholder:"Reference count"}),ie[228]=ii.minReferenceCount,ie[229]=eH,ie[230]=eU):eU=ie[230],ie[231]!==ii?(ez=e=>ia({...ii,industry:e.target.value}),ie[231]=ii,ie[232]=ez):ez=ie[232],ie[233]!==ii.industry||ie[234]!==ez?(eW=(0,t.jsx)(l.Input,{value:ii.industry,onChange:ez,placeholder:"Industries (comma separated)"}),ie[233]=ii.industry,ie[234]=ez,ie[235]=eW):eW=ie[235],ie[236]!==eV||ie[237]!==eU||ie[238]!==eW?(e$=(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-3",children:[eV,eU,eW]}),ie[236]=eV,ie[237]=eU,ie[238]=eW,ie[239]=e$):e$=ie[239],ie[240]!==ii?(eQ=e=>ia({...ii,qualityStandards:e.target.value}),ie[240]=ii,ie[241]=eQ):eQ=ie[241],ie[242]!==ii.qualityStandards||ie[243]!==eQ?(eX=(0,t.jsx)(l.Input,{value:ii.qualityStandards,onChange:eQ,placeholder:"Quality standards (comma separated)"}),ie[242]=ii.qualityStandards,ie[243]=eQ,ie[244]=eX):eX=ie[244],ie[245]!==ii?(eJ=e=>ia({...ii,requiredFormats:e.target.value}),ie[245]=ii,ie[246]=eJ):eJ=ie[246],ie[247]!==ii.requiredFormats||ie[248]!==eJ?(eY=(0,t.jsx)(l.Input,{value:ii.requiredFormats,onChange:eJ,placeholder:"Required formats (comma separated)"}),ie[247]=ii.requiredFormats,ie[248]=eJ,ie[249]=eY):eY=ie[249],ie[250]!==ii?(eK=e=>ia({...ii,complianceRequirements:e.target.value}),ie[250]=ii,ie[251]=eK):eK=ie[251],ie[252]!==ii.complianceRequirements||ie[253]!==eK?(eZ=(0,t.jsx)(l.Input,{value:ii.complianceRequirements,onChange:eK,placeholder:"Compliance requirements (comma separated)"}),ie[252]=ii.complianceRequirements,ie[253]=eK,ie[254]=eZ):eZ=ie[254],ie[255]!==eX||ie[256]!==eY||ie[257]!==eZ?(e0=(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-3",children:[eX,eY,eZ]}),ie[255]=eX,ie[256]=eY,ie[257]=eZ,ie[258]=e0):e0=ie[258],ie[259]!==ii?(e2=e=>ia({...ii,dataClassifications:e.target.value}),ie[259]=ii,ie[260]=e2):e2=ie[260],ie[261]!==ii.dataClassifications||ie[262]!==e2?(e1=(0,t.jsx)(l.Input,{value:ii.dataClassifications,onChange:e2,placeholder:"Data classifications (comma separated)"}),ie[261]=ii.dataClassifications,ie[262]=e2,ie[263]=e1):e1=ie[263],ie[264]!==ew||ie[265]!==ek||ie[266]!==e_||ie[267]!==eL||ie[268]!==eB||ie[269]!==e$||ie[270]!==e0||ie[271]!==e1?(e3=(0,t.jsxs)("div",{className:"grid gap-4",children:[eT,ew,ek,e_,eL,eB,e$,e0,e1]}),ie[264]=ew,ie[265]=ek,ie[266]=e_,ie[267]=eL,ie[268]=eB,ie[269]=e$,ie[270]=e0,ie[271]=e1,ie[272]=e3):e3=ie[272],ie[273]===Symbol.for("react.memo_cache_sentinel")?(e4=(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Enterprise Controls"}),ie[273]=e4):e4=ie[273],ie[274]!==ii?(e8=e=>ia({...ii,requiresPortfolio:e.target.checked}),ie[274]=ii,ie[275]=e8):e8=ie[275],ie[276]!==ii.requiresPortfolio||ie[277]!==e8?(e5=(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm text-slate-700",children:[(0,t.jsx)("input",{type:"checkbox",checked:ii.requiresPortfolio,onChange:e8}),"Requires portfolio"]}),ie[276]=ii.requiresPortfolio,ie[277]=e8,ie[278]=e5):e5=ie[278],ie[279]!==ii?(e7=e=>ia({...ii,requiresReferences:e.target.checked}),ie[279]=ii,ie[280]=e7):e7=ie[280],ie[281]!==ii.requiresReferences||ie[282]!==e7?(e6=(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm text-slate-700",children:[(0,t.jsx)("input",{type:"checkbox",checked:ii.requiresReferences,onChange:e7}),"Requires references"]}),ie[281]=ii.requiresReferences,ie[282]=e7,ie[283]=e6):e6=ie[283],ie[284]!==ii?(e9=e=>ia({...ii,requiresNDA:e.target.checked}),ie[284]=ii,ie[285]=e9):e9=ie[285],ie[286]!==ii.requiresNDA||ie[287]!==e9?(te=(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm text-slate-700",children:[(0,t.jsx)("input",{type:"checkbox",checked:ii.requiresNDA,onChange:e9}),"NDA required"]}),ie[286]=ii.requiresNDA,ie[287]=e9,ie[288]=te):te=ie[288],ie[289]!==ii?(tt=e=>ia({...ii,requiresBGCheck:e.target.checked}),ie[289]=ii,ie[290]=tt):tt=ie[290],ie[291]!==ii.requiresBGCheck||ie[292]!==tt?(ti=(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm text-slate-700",children:[(0,t.jsx)("input",{type:"checkbox",checked:ii.requiresBGCheck,onChange:tt}),"Background check"]}),ie[291]=ii.requiresBGCheck,ie[292]=tt,ie[293]=ti):ti=ie[293],ie[294]!==ii?(tn=e=>ia({...ii,requiresInsurance:e.target.checked}),ie[294]=ii,ie[295]=tn):tn=ie[295],ie[296]!==ii.requiresInsurance||ie[297]!==tn?(ta=(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm text-slate-700",children:[(0,t.jsx)("input",{type:"checkbox",checked:ii.requiresInsurance,onChange:tn}),"Insurance required"]}),ie[296]=ii.requiresInsurance,ie[297]=tn,ie[298]=ta):ta=ie[298],ie[299]!==ii?(tr=e=>ia({...ii,isEnterpriseOnly:e.target.checked}),ie[299]=ii,ie[300]=tr):tr=ie[300],ie[301]!==ii.isEnterpriseOnly||ie[302]!==tr?(ts=(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm text-slate-700",children:[(0,t.jsx)("input",{type:"checkbox",checked:ii.isEnterpriseOnly,onChange:tr}),"Enterprise-only listing"]}),ie[301]=ii.isEnterpriseOnly,ie[302]=tr,ie[303]=ts):ts=ie[303],ie[304]!==e5||ie[305]!==e6||ie[306]!==te||ie[307]!==ti||ie[308]!==ta||ie[309]!==ts?(to=(0,t.jsxs)("div",{className:"grid gap-4",children:[e4,(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-3",children:[e5,e6,te,ti,ta,ts]})]}),ie[304]=e5,ie[305]=e6,ie[306]=te,ie[307]=ti,ie[308]=ta,ie[309]=ts,ie[310]=to):to=ie[310],ie[311]===Symbol.for("react.memo_cache_sentinel")?(tl=(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Pilot & Vendor Fit"}),ie[311]=tl):tl=ie[311],ie[312]!==ii?(tc=e=>ia({...ii,pilotProjectRequired:e.target.checked}),ie[312]=ii,ie[313]=tc):tc=ie[313],ie[314]!==ii.pilotProjectRequired||ie[315]!==tc?(tu=(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm text-slate-700",children:[(0,t.jsx)("input",{type:"checkbox",checked:ii.pilotProjectRequired,onChange:tc}),"Pilot required"]}),ie[314]=ii.pilotProjectRequired,ie[315]=tc,ie[316]=tu):tu=ie[316],ie[317]!==ii?(td=e=>ia({...ii,pilotProjectScope:e.target.value}),ie[317]=ii,ie[318]=td):td=ie[318],ie[319]!==ii.pilotProjectScope||ie[320]!==td?(tm=(0,t.jsx)(l.Input,{value:ii.pilotProjectScope,onChange:td,placeholder:"Pilot scope"}),ie[319]=ii.pilotProjectScope,ie[320]=td,ie[321]=tm):tm=ie[321],ie[322]!==ii?(tg=e=>ia({...ii,pilotEstimatedHours:e.target.value}),ie[322]=ii,ie[323]=tg):tg=ie[323],ie[324]!==ii.pilotEstimatedHours||ie[325]!==tg?(tp=(0,t.jsx)(l.Input,{type:"number",value:ii.pilotEstimatedHours,onChange:tg,placeholder:"Pilot hours"}),ie[324]=ii.pilotEstimatedHours,ie[325]=tg,ie[326]=tp):tp=ie[326],ie[327]!==tu||ie[328]!==tm||ie[329]!==tp?(th=(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-3",children:[tu,tm,tp]}),ie[327]=tu,ie[328]=tm,ie[329]=tp,ie[330]=th):th=ie[330],ie[331]!==ii?(ty=e=>ia({...ii,preferredVendorOpportunity:e.target.checked}),ie[331]=ii,ie[332]=ty):ty=ie[332],ie[333]!==ii.preferredVendorOpportunity||ie[334]!==ty?(tf=(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm text-slate-700",children:[(0,t.jsx)("input",{type:"checkbox",checked:ii.preferredVendorOpportunity,onChange:ty}),"Preferred vendor opportunity"]}),ie[333]=ii.preferredVendorOpportunity,ie[334]=ty,ie[335]=tf):tf=ie[335],ie[336]!==ii?(tv=e=>ia({...ii,minimumMonthlyCommitment:e.target.value}),ie[336]=ii,ie[337]=tv):tv=ie[337],ie[338]!==ii.minimumMonthlyCommitment||ie[339]!==tv?(tS=(0,t.jsx)(l.Input,{type:"number",value:ii.minimumMonthlyCommitment,onChange:tv,placeholder:"Minimum monthly commitment"}),ie[338]=ii.minimumMonthlyCommitment,ie[339]=tv,ie[340]=tS):tS=ie[340],ie[341]!==ii?(tx=e=>ia({...ii,contractTermMonths:e.target.value}),ie[341]=ii,ie[342]=tx):tx=ie[342],ie[343]!==ii.contractTermMonths||ie[344]!==tx?(tb=(0,t.jsx)(l.Input,{type:"number",value:ii.contractTermMonths,onChange:tx,placeholder:"Contract term (months)"}),ie[343]=ii.contractTermMonths,ie[344]=tx,ie[345]=tb):tb=ie[345],ie[346]!==tf||ie[347]!==tS||ie[348]!==tb?(tC=(0,t.jsxs)("div",{className:"grid gap-3 md:grid-cols-3",children:[tf,tS,tb]}),ie[346]=tf,ie[347]=tS,ie[348]=tb,ie[349]=tC):tC=ie[349],ie[350]!==ii?(tP=e=>ia({...ii,rateStabilityGuarantee:e.target.checked}),ie[350]=ii,ie[351]=tP):tP=ie[351],ie[352]!==ii.rateStabilityGuarantee||ie[353]!==tP?(tM=(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm text-slate-700",children:[(0,t.jsx)("input",{type:"checkbox",checked:ii.rateStabilityGuarantee,onChange:tP}),"Rate stability guarantee"]}),ie[352]=ii.rateStabilityGuarantee,ie[353]=tP,ie[354]=tM):tM=ie[354],ie[355]!==th||ie[356]!==tC||ie[357]!==tM?(tR=(0,t.jsxs)("div",{className:"grid gap-4",children:[tl,th,tC,tM]}),ie[355]=th,ie[356]=tC,ie[357]=tM,ie[358]=tR):tR=ie[358],ie[359]===Symbol.for("react.memo_cache_sentinel")?(tE=(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Application & Timeline"}),ie[359]=tE):tE=ie[359],ie[360]!==ii?(tj=e=>ia({...ii,evaluationProcess:e.target.value}),ie[360]=ii,ie[361]=tj):tj=ie[361],ie[362]!==ii.evaluationProcess||ie[363]!==tj?(tA=(0,t.jsx)(l.Textarea,{value:ii.evaluationProcess,onChange:tj,rows:3,placeholder:"Evaluation process and decision workflow"}),ie[362]=ii.evaluationProcess,ie[363]=tj,ie[364]=tA):tA=ie[364],ie[365]!==ii?(tD=e=>ia({...ii,applicationGuidelineUrls:e.target.value}),ie[365]=ii,ie[366]=tD):tD=ie[366],ie[367]!==ii.applicationGuidelineUrls||ie[368]!==tD?(tT=(0,t.jsx)(l.Input,{value:ii.applicationGuidelineUrls,onChange:tD,placeholder:"Application guideline URLs (comma separated)"}),ie[367]=ii.applicationGuidelineUrls,ie[368]=tD,ie[369]=tT):tT=ie[369],ie[370]!==ii?(tO=e=>ia({...ii,closingDate:e.target.value}),ie[370]=ii,ie[371]=tO):tO=ie[371],ie[372]!==ii.closingDate||ie[373]!==tO?(tw=(0,t.jsx)(l.Input,{type:"date",value:ii.closingDate,onChange:tO}),ie[372]=ii.closingDate,ie[373]=tO,ie[374]=tw):tw=ie[374],ie[375]!==tA||ie[376]!==tT||ie[377]!==tw?(tI=(0,t.jsxs)("div",{className:"grid gap-4",children:[tE,tA,tT,tw]}),ie[375]=tA,ie[376]=tT,ie[377]=tw,ie[378]=tI):tI=ie[378],ie[379]===Symbol.for("react.memo_cache_sentinel")?(tk=(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Samples & References"}),tN=(0,t.jsx)("p",{className:"text-sm text-slate-600",children:"Select files to upload as samples. These will be attached to the job after upload."}),ie[379]=tk,ie[380]=tN):(tk=ie[379],tN=ie[380]),ie[381]===Symbol.for("react.memo_cache_sentinel")?(t_=(0,t.jsx)("label",{className:"text-sm font-medium text-slate-700",children:"Documents"}),tq=(0,t.jsx)("p",{className:"text-xs text-slate-500",children:"PDF, DOCX, PPTX, XLSX. Select one or more documents."}),ie[381]=t_,ie[382]=tq):(t_=ie[381],tq=ie[382]),ie[383]===Symbol.for("react.memo_cache_sentinel")?(tL=(0,t.jsx)("input",{type:"file",multiple:!0,accept:".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv",onChange:e=>is(Array.from(e.target.files??[])),className:"w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm"}),ie[383]=tL):tL=ie[383],ie[384]!==ir.length?(tF=ir.length>0&&(0,t.jsxs)("p",{className:"text-xs text-slate-600",children:[ir.length," document(s) selected"]}),ie[384]=ir.length,ie[385]=tF):tF=ie[385],ie[386]!==tF?(tB=(0,t.jsxs)("div",{className:"grid gap-2",children:[t_,tq,tL,tF]}),ie[386]=tF,ie[387]=tB):tB=ie[387],ie[388]===Symbol.for("react.memo_cache_sentinel")?(tG=(0,t.jsx)("label",{className:"text-sm font-medium text-slate-700",children:"Images"}),tV=(0,t.jsx)("p",{className:"text-xs text-slate-500",children:"PNG, JPG, JPEG, WEBP. Select one or more images."}),ie[388]=tG,ie[389]=tV):(tG=ie[388],tV=ie[389]),ie[390]===Symbol.for("react.memo_cache_sentinel")?(tH=(0,t.jsx)("input",{type:"file",multiple:!0,accept:"image/png,image/jpeg,image/webp",onChange:e=>il(Array.from(e.target.files??[])),className:"w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm"}),ie[390]=tH):tH=ie[390],ie[391]!==io.length?(tU=io.length>0&&(0,t.jsxs)("p",{className:"text-xs text-slate-600",children:[io.length," image(s) selected"]}),ie[391]=io.length,ie[392]=tU):tU=ie[392],ie[393]!==tU?(tz=(0,t.jsxs)("div",{className:"grid gap-2",children:[tG,tV,tH,tU]}),ie[393]=tU,ie[394]=tz):tz=ie[394],ie[395]===Symbol.for("react.memo_cache_sentinel")?(tW=(0,t.jsx)("label",{className:"text-sm font-medium text-slate-700",children:"Videos"}),t$=(0,t.jsx)("p",{className:"text-xs text-slate-500",children:"MP4, MOV. Select one or more videos."}),ie[395]=tW,ie[396]=t$):(tW=ie[395],t$=ie[396]),ie[397]===Symbol.for("react.memo_cache_sentinel")?(tQ=(0,t.jsx)("input",{type:"file",multiple:!0,accept:"video/mp4,video/quicktime",onChange:e=>iu(Array.from(e.target.files??[])),className:"w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm"}),ie[397]=tQ):tQ=ie[397],ie[398]!==ic.length?(tX=ic.length>0&&(0,t.jsxs)("p",{className:"text-xs text-slate-600",children:[ic.length," video(s) selected"]}),ie[398]=ic.length,ie[399]=tX):tX=ie[399],ie[400]!==tX?(tJ=(0,t.jsxs)("div",{className:"grid gap-2",children:[tW,t$,tQ,tX]}),ie[400]=tX,ie[401]=tJ):tJ=ie[401],ie[402]===Symbol.for("react.memo_cache_sentinel")?(tY=(0,t.jsx)("label",{className:"text-sm font-medium text-slate-700",children:"Audio"}),tK=(0,t.jsx)("p",{className:"text-xs text-slate-500",children:"MP3, WAV. Select one or more audio files."}),ie[402]=tY,ie[403]=tK):(tY=ie[402],tK=ie[403]),ie[404]===Symbol.for("react.memo_cache_sentinel")?(tZ=(0,t.jsx)("input",{type:"file",multiple:!0,accept:"audio/mpeg,audio/wav",onChange:e=>im(Array.from(e.target.files??[])),className:"w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-2.5 text-sm"}),ie[404]=tZ):tZ=ie[404],ie[405]!==id.length?(t0=id.length>0&&(0,t.jsxs)("p",{className:"text-xs text-slate-600",children:[id.length," audio file(s) selected"]}),ie[405]=id.length,ie[406]=t0):t0=ie[406],ie[407]!==t0?(t2=(0,t.jsxs)("div",{className:"grid gap-2",children:[tY,tK,tZ,t0]}),ie[407]=t0,ie[408]=t2):t2=ie[408],ie[409]!==tB||ie[410]!==tz||ie[411]!==tJ||ie[412]!==t2?(t1=(0,t.jsxs)("div",{className:"grid gap-4",children:[tk,tN,tB,tz,tJ,t2]}),ie[409]=tB,ie[410]=tz,ie[411]=tJ,ie[412]=t2,ie[413]=t1):t1=ie[413],ie[414]!==ih?(t3=()=>ih.mutate(),ie[414]=ih,ie[415]=t3):t3=ie[415];let iv=ih.isPending||iy;return ie[416]!==t3||ie[417]!==iv?(t4=(0,t.jsx)(l.Button,{onClick:t3,disabled:iv,children:"Create enterprise draft"}),ie[416]=t3,ie[417]=iv,ie[418]=t4):t4=ie[418],ie[419]!==ih.isPending?(t8=ih.isPending&&(0,t.jsx)("span",{className:"text-sm text-slate-600",children:"Creating…"}),ie[419]=ih.isPending,ie[420]=t8):t8=ie[420],ie[421]!==ih.isError?(t5=ih.isError&&(0,t.jsx)("span",{className:"text-sm text-rose-600",children:"Failed to create."}),ie[421]=ih.isError,ie[422]=t5):t5=ie[422],ie[423]!==t4||ie[424]!==t8||ie[425]!==t5?(t7=(0,t.jsxs)("div",{className:"flex flex-wrap items-center gap-3",children:[t4,t8,t5]}),ie[423]=t4,ie[424]=t8,ie[425]=t5,ie[426]=t7):t7=ie[426],ie[427]===Symbol.for("react.memo_cache_sentinel")?(t6=(0,t.jsx)("p",{className:"text-xs text-slate-500",children:"Drafts are created via the real backend API. Publish from the job detail view when ready."}),ie[427]=t6):t6=ie[427],ie[428]!==e3||ie[429]!==to||ie[430]!==tR||ie[431]!==tI||ie[432]!==t1||ie[433]!==t7||ie[434]!==_||ie[435]!==ec||ie[436]!==eD?(t9=(0,t.jsxs)("main",{className:"relative mx-auto max-w-4xl p-6 pb-12",children:[b,x,P,(0,t.jsx)("section",{className:"rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur",children:(0,t.jsxs)("div",{className:"space-y-8",children:[_,ec,eD,e3,to,tR,tI,t1,t7,t6]})})]}),ie[428]=e3,ie[429]=to,ie[430]=tR,ie[431]=tI,ie[432]=t1,ie[433]=t7,ie[434]=_,ie[435]=ec,ie[436]=eD,ie[437]=t9):t9=ie[437],t9}function d(e){return""===e.trim()?void 0:Number(e)}function m(e){return e.split(",").map(g).filter(Boolean)}function g(e){return e.trim()}e.s(["default",()=>u])}]);