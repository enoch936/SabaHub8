(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,48283,(e,t,i)=>{"use strict";function n({widthInt:e,heightInt:t,blurWidth:i,blurHeight:n,blurDataURL:r,objectFit:a}){let s=i?40*i:e,o=n?40*n:t,l=s&&o?`viewBox='0 0 ${s} ${o}'`:"";return`%3Csvg xmlns='http://www.w3.org/2000/svg' ${l}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${l?"none":"contain"===a?"xMidYMid":"cover"===a?"xMidYMid slice":"none"}' style='filter: url(%23b);' href='${r}'/%3E%3C/svg%3E`}Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"getImageBlurSvg",{enumerable:!0,get:function(){return n}})},75428,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0});var n={VALID_LOADERS:function(){return a},imageConfigDefault:function(){return s}};for(var r in n)Object.defineProperty(i,r,{enumerable:!0,get:n[r]});let a=["default","imgix","cloudinary","akamai","custom"],s={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],path:"/_next/image",loader:"default",loaderFile:"",domains:[],disableStaticImages:!1,minimumCacheTTL:14400,formats:["image/webp"],maximumRedirects:3,dangerouslyAllowLocalIP:!1,dangerouslyAllowSVG:!1,contentSecurityPolicy:"script-src 'none'; frame-src 'none'; sandbox;",contentDispositionType:"attachment",localPatterns:void 0,remotePatterns:[],qualities:[75],unoptimized:!1}},76101,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"getImgProps",{enumerable:!0,get:function(){return l}}),e.r(12832);let n=e.r(48283),r=e.r(75428),a=["-moz-initial","fill","none","scale-down",void 0];function s(e){return void 0!==e.default}function o(e){return void 0===e?e:"number"==typeof e?Number.isFinite(e)?e:NaN:"string"==typeof e&&/^[0-9]+$/.test(e)?parseInt(e,10):NaN}function l({src:e,sizes:t,unoptimized:i=!1,priority:l=!1,preload:c=!1,loading:u,className:d,quality:g,width:p,height:m,fill:h=!1,style:y,overrideSrc:f,onLoad:S,onLoadingComplete:C,placeholder:v="empty",blurDataURL:b,fetchPriority:P,decoding:M="async",layout:R,objectFit:E,objectPosition:O,lazyBoundary:A,lazyRoot:T,...D},I){var w;let x,k,_,{imgConf:F,showAltText:j,blurComplete:L,defaultLoader:B}=I,N=F||r.imageConfigDefault;if("allSizes"in N)x=N;else{let e=[...N.deviceSizes,...N.imageSizes].sort((e,t)=>e-t),t=N.deviceSizes.sort((e,t)=>e-t),i=N.qualities?.sort((e,t)=>e-t);x={...N,allSizes:e,deviceSizes:t,qualities:i}}if(void 0===B)throw Object.defineProperty(Error("images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config"),"__NEXT_ERROR_CODE",{value:"E163",enumerable:!1,configurable:!0});let Q=D.loader||B;delete D.loader,delete D.srcSet;let G="__next_img_default"in Q;if(G){if("custom"===x.loader)throw Object.defineProperty(Error(`Image with src "${e}" is missing "loader" prop.
Read more: https://nextjs.org/docs/messages/next-image-missing-loader`),"__NEXT_ERROR_CODE",{value:"E252",enumerable:!1,configurable:!0})}else{let e=Q;Q=t=>{let{config:i,...n}=t;return e(n)}}if(R){"fill"===R&&(h=!0);let e={intrinsic:{maxWidth:"100%",height:"auto"},responsive:{width:"100%",height:"auto"}}[R];e&&(y={...y,...e});let i={responsive:"100vw",fill:"100vw"}[R];i&&!t&&(t=i)}let H="",V=o(p),W=o(m);if((w=e)&&"object"==typeof w&&(s(w)||void 0!==w.src)){let t=s(e)?e.default:e;if(!t.src)throw Object.defineProperty(Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(t)}`),"__NEXT_ERROR_CODE",{value:"E460",enumerable:!1,configurable:!0});if(!t.height||!t.width)throw Object.defineProperty(Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(t)}`),"__NEXT_ERROR_CODE",{value:"E48",enumerable:!1,configurable:!0});if(k=t.blurWidth,_=t.blurHeight,b=b||t.blurDataURL,H=t.src,!h)if(V||W){if(V&&!W){let e=V/t.width;W=Math.round(t.height*e)}else if(!V&&W){let e=W/t.height;V=Math.round(t.width*e)}}else V=t.width,W=t.height}let U=!l&&!c&&("lazy"===u||void 0===u);(!(e="string"==typeof e?e:H)||e.startsWith("data:")||e.startsWith("blob:"))&&(i=!0,U=!1),x.unoptimized&&(i=!0),G&&!x.dangerouslyAllowSVG&&e.split("?",1)[0].endsWith(".svg")&&(i=!0);let z=o(g),q=Object.assign(h?{position:"absolute",height:"100%",width:"100%",left:0,top:0,right:0,bottom:0,objectFit:E,objectPosition:O}:{},j?{}:{color:"transparent"},y),$=L||"empty"===v?null:"blur"===v?`url("data:image/svg+xml;charset=utf-8,${(0,n.getImageBlurSvg)({widthInt:V,heightInt:W,blurWidth:k,blurHeight:_,blurDataURL:b||"",objectFit:q.objectFit})}")`:`url("${v}")`,K=a.includes(q.objectFit)?"fill"===q.objectFit?"100% 100%":"cover":q.objectFit,X=$?{backgroundSize:K,backgroundPosition:q.objectPosition||"50% 50%",backgroundRepeat:"no-repeat",backgroundImage:$}:{},J=function({config:e,src:t,unoptimized:i,width:n,quality:r,sizes:a,loader:s}){if(i)return{src:t,srcSet:void 0,sizes:void 0};let{widths:o,kind:l}=function({deviceSizes:e,allSizes:t},i,n){if(n){let i=/(^|\s)(1?\d?\d)vw/g,r=[];for(let e;e=i.exec(n);)r.push(parseInt(e[2]));if(r.length){let i=.01*Math.min(...r);return{widths:t.filter(t=>t>=e[0]*i),kind:"w"}}return{widths:t,kind:"w"}}return"number"!=typeof i?{widths:e,kind:"w"}:{widths:[...new Set([i,2*i].map(e=>t.find(t=>t>=e)||t[t.length-1]))],kind:"x"}}(e,n,a),c=o.length-1;return{sizes:a||"w"!==l?a:"100vw",srcSet:o.map((i,n)=>`${s({config:e,src:t,quality:r,width:i})} ${"w"===l?i:n+1}${l}`).join(", "),src:s({config:e,src:t,quality:r,width:o[c]})}}({config:x,src:e,unoptimized:i,width:V,quality:z,sizes:t,loader:Q}),Y=U?"lazy":u;return{props:{...D,loading:Y,fetchPriority:P,width:V,height:W,decoding:M,className:d,style:{...q,...X},sizes:J.sizes,srcSet:J.srcSet,src:f||J.src},meta:{unoptimized:i,preload:c||l,placeholder:v,fill:h}}}},88665,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"default",{enumerable:!0,get:function(){return o}});let n=e.r(29364),r="undefined"==typeof window,a=r?()=>{}:n.useLayoutEffect,s=r?()=>{}:n.useEffect;function o(e){let{headManager:t,reduceComponentsToState:i}=e;function o(){if(t&&t.mountedInstances){let e=n.Children.toArray(Array.from(t.mountedInstances).filter(Boolean));t.updateHead(i(e))}}return r&&(t?.mountedInstances?.add(e.children),o()),a(()=>(t?.mountedInstances?.add(e.children),()=>{t?.mountedInstances?.delete(e.children)})),a(()=>(t&&(t._pendingUpdate=o),()=>{t&&(t._pendingUpdate=o)})),s(()=>(t&&t._pendingUpdate&&(t._pendingUpdate(),t._pendingUpdate=null),()=>{t&&t._pendingUpdate&&(t._pendingUpdate(),t._pendingUpdate=null)})),null}},36396,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0});var n={default:function(){return h},defaultHead:function(){return d}};for(var r in n)Object.defineProperty(i,r,{enumerable:!0,get:n[r]});let a=e.r(81258),s=e.r(44066),o=e.r(22047),l=s._(e.r(29364)),c=a._(e.r(88665)),u=e.r(59277);function d(){return[(0,o.jsx)("meta",{charSet:"utf-8"},"charset"),(0,o.jsx)("meta",{name:"viewport",content:"width=device-width"},"viewport")]}function g(e,t){return"string"==typeof t||"number"==typeof t?e:t.type===l.default.Fragment?e.concat(l.default.Children.toArray(t.props.children).reduce((e,t)=>"string"==typeof t||"number"==typeof t?e:e.concat(t),[])):e.concat(t)}e.r(12832);let p=["name","httpEquiv","charSet","itemProp"];function m(e){let t,i,n,r;return e.reduce(g,[]).reverse().concat(d().reverse()).filter((t=new Set,i=new Set,n=new Set,r={},e=>{let a=!0,s=!1;if(e.key&&"number"!=typeof e.key&&e.key.indexOf("$")>0){s=!0;let i=e.key.slice(e.key.indexOf("$")+1);t.has(i)?a=!1:t.add(i)}switch(e.type){case"title":case"base":i.has(e.type)?a=!1:i.add(e.type);break;case"meta":for(let t=0,i=p.length;t<i;t++){let i=p[t];if(e.props.hasOwnProperty(i))if("charSet"===i)n.has(i)?a=!1:n.add(i);else{let t=e.props[i],n=r[i]||new Set;("name"!==i||!s)&&n.has(t)?a=!1:(n.add(t),r[i]=n)}}}return a})).reverse().map((e,t)=>{let i=e.key||t;return l.default.cloneElement(e,{key:i})})}let h=function({children:e}){let t=(0,l.useContext)(u.HeadManagerContext);return(0,o.jsx)(c.default,{reduceComponentsToState:m,headManager:t,children:e})};("function"==typeof i.default||"object"==typeof i.default&&null!==i.default)&&void 0===i.default.__esModule&&(Object.defineProperty(i.default,"__esModule",{value:!0}),Object.assign(i.default,i),t.exports=i.default)},16858,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"ImageConfigContext",{enumerable:!0,get:function(){return a}});let n=e.r(81258)._(e.r(29364)),r=e.r(75428),a=n.default.createContext(r.imageConfigDefault)},31615,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"RouterContext",{enumerable:!0,get:function(){return n}});let n=e.r(81258)._(e.r(29364)).default.createContext(null)},14555,(e,t,i)=>{"use strict";function n(e,t){let i=e||75;return t?.qualities?.length?t.qualities.reduce((e,t)=>Math.abs(t-i)<Math.abs(e-i)?t:e,0):i}Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"findClosestQuality",{enumerable:!0,get:function(){return n}})},28216,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"default",{enumerable:!0,get:function(){return a}});let n=e.r(14555);function r({config:e,src:t,width:i,quality:r}){if(t.startsWith("/")&&t.includes("?")&&e.localPatterns?.length===1&&"**"===e.localPatterns[0].pathname&&""===e.localPatterns[0].search)throw Object.defineProperty(Error(`Image with src "${t}" is using a query string which is not configured in images.localPatterns.
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`),"__NEXT_ERROR_CODE",{value:"E871",enumerable:!1,configurable:!0});let a=(0,n.findClosestQuality)(r,e);return`${e.path}?url=${encodeURIComponent(t)}&w=${i}&q=${a}${t.startsWith("/_next/static/media/"),""}`}r.__next_img_default=!0;let a=r},58882,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"Image",{enumerable:!0,get:function(){return v}});let n=e.r(81258),r=e.r(44066),a=e.r(22047),s=r._(e.r(29364)),o=n._(e.r(94434)),l=n._(e.r(36396)),c=e.r(76101),u=e.r(75428),d=e.r(16858);e.r(12832);let g=e.r(31615),p=n._(e.r(28216)),m=e.r(65068),h={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],qualities:[75],path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1};function y(e,t,i,n,r,a,s){let o=e?.src;e&&e["data-loaded-src"]!==o&&(e["data-loaded-src"]=o,("decode"in e?e.decode():Promise.resolve()).catch(()=>{}).then(()=>{if(e.parentElement&&e.isConnected){if("empty"!==t&&r(!0),i?.current){let t=new Event("load");Object.defineProperty(t,"target",{writable:!1,value:e});let n=!1,r=!1;i.current({...t,nativeEvent:t,currentTarget:e,target:e,isDefaultPrevented:()=>n,isPropagationStopped:()=>r,persist:()=>{},preventDefault:()=>{n=!0,t.preventDefault()},stopPropagation:()=>{r=!0,t.stopPropagation()}})}n?.current&&n.current(e)}}))}function f(e){return s.use?{fetchPriority:e}:{fetchpriority:e}}"undefined"==typeof window&&(globalThis.__NEXT_IMAGE_IMPORTED=!0);let S=(0,s.forwardRef)(({src:e,srcSet:t,sizes:i,height:n,width:r,decoding:o,className:l,style:c,fetchPriority:u,placeholder:d,loading:g,unoptimized:p,fill:h,onLoadRef:S,onLoadingCompleteRef:C,setBlurComplete:v,setShowAltText:b,sizesInput:P,onLoad:M,onError:R,...E},O)=>{let A=(0,s.useCallback)(e=>{e&&(R&&(e.src=e.src),e.complete&&y(e,d,S,C,v,p,P))},[e,d,S,C,v,R,p,P]),T=(0,m.useMergedRef)(O,A);return(0,a.jsx)("img",{...E,...f(u),loading:g,width:r,height:n,decoding:o,"data-nimg":h?"fill":"1",className:l,style:c,sizes:i,srcSet:t,src:e,ref:T,onLoad:e=>{y(e.currentTarget,d,S,C,v,p,P)},onError:e=>{b(!0),"empty"!==d&&v(!0),R&&R(e)}})});function C({isAppRouter:e,imgAttributes:t}){let i={as:"image",imageSrcSet:t.srcSet,imageSizes:t.sizes,crossOrigin:t.crossOrigin,referrerPolicy:t.referrerPolicy,...f(t.fetchPriority)};return e&&o.default.preload?(o.default.preload(t.src,i),null):(0,a.jsx)(l.default,{children:(0,a.jsx)("link",{rel:"preload",href:t.srcSet?void 0:t.src,...i},"__nimg-"+t.src+t.srcSet+t.sizes)})}let v=(0,s.forwardRef)((e,t)=>{let i=(0,s.useContext)(g.RouterContext),n=(0,s.useContext)(d.ImageConfigContext),r=(0,s.useMemo)(()=>{let e=h||n||u.imageConfigDefault,t=[...e.deviceSizes,...e.imageSizes].sort((e,t)=>e-t),i=e.deviceSizes.sort((e,t)=>e-t),r=e.qualities?.sort((e,t)=>e-t);return{...e,allSizes:t,deviceSizes:i,qualities:r,localPatterns:"undefined"==typeof window?n?.localPatterns:e.localPatterns}},[n]),{onLoad:o,onLoadingComplete:l}=e,m=(0,s.useRef)(o);(0,s.useEffect)(()=>{m.current=o},[o]);let y=(0,s.useRef)(l);(0,s.useEffect)(()=>{y.current=l},[l]);let[f,v]=(0,s.useState)(!1),[b,P]=(0,s.useState)(!1),{props:M,meta:R}=(0,c.getImgProps)(e,{defaultLoader:p.default,imgConf:r,blurComplete:f,showAltText:b});return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(S,{...M,unoptimized:R.unoptimized,placeholder:R.placeholder,fill:R.fill,onLoadRef:m,onLoadingCompleteRef:y,setBlurComplete:v,setShowAltText:P,sizesInput:e.sizes,ref:t}),R.preload?(0,a.jsx)(C,{isAppRouter:!i,imgAttributes:M}):null]})});("function"==typeof i.default||"object"==typeof i.default&&null!==i.default)&&void 0===i.default.__esModule&&(Object.defineProperty(i.default,"__esModule",{value:!0}),Object.assign(i.default,i),t.exports=i.default)},92895,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0});var n={default:function(){return u},getImageProps:function(){return c}};for(var r in n)Object.defineProperty(i,r,{enumerable:!0,get:n[r]});let a=e.r(81258),s=e.r(76101),o=e.r(58882),l=a._(e.r(28216));function c(e){let{props:t}=(0,s.getImgProps)(e,{defaultLoader:l.default,imgConf:{deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],qualities:[75],path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1}});for(let[e,i]of Object.entries(t))void 0===i&&delete t[e];return{props:t}}let u=o.Image},34022,(e,t,i)=>{t.exports=e.r(92895)},17736,e=>{"use strict";let t;var i=e.i(41916),n=e.i(99276),r=e.i(75072),a=e.i(44536),s=e.i(62604),o=e.i(91003),l=e.i(24742),c=class extends a.Subscribable{constructor(e,t){super(),this.options=t,this.#e=e,this.#t=null,this.#i=(0,s.pendingThenable)(),this.bindMethods(),this.setOptions(t)}#e;#n=void 0;#r=void 0;#a=void 0;#s;#o;#i;#t;#l;#c;#u;#d;#g;#p;#m=new Set;bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){1===this.listeners.size&&(this.#n.addObserver(this),u(this.#n,this.options)?this.#h():this.updateResult(),this.#y())}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return d(this.#n,this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return d(this.#n,this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,this.#f(),this.#S(),this.#n.removeObserver(this)}setOptions(e){let t=this.options,i=this.#n;if(this.options=this.#e.defaultQueryOptions(e),void 0!==this.options.enabled&&"boolean"!=typeof this.options.enabled&&"function"!=typeof this.options.enabled&&"boolean"!=typeof(0,o.resolveEnabled)(this.options.enabled,this.#n))throw Error("Expected enabled to be a boolean or a callback that returns a boolean");this.#C(),this.#n.setOptions(this.options),t._defaulted&&!(0,o.shallowEqualObjects)(this.options,t)&&this.#e.getQueryCache().notify({type:"observerOptionsUpdated",query:this.#n,observer:this});let n=this.hasListeners();n&&g(this.#n,i,this.options,t)&&this.#h(),this.updateResult(),n&&(this.#n!==i||(0,o.resolveEnabled)(this.options.enabled,this.#n)!==(0,o.resolveEnabled)(t.enabled,this.#n)||(0,o.resolveStaleTime)(this.options.staleTime,this.#n)!==(0,o.resolveStaleTime)(t.staleTime,this.#n))&&this.#v();let r=this.#b();n&&(this.#n!==i||(0,o.resolveEnabled)(this.options.enabled,this.#n)!==(0,o.resolveEnabled)(t.enabled,this.#n)||r!==this.#p)&&this.#P(r)}getOptimisticResult(e){var t,i;let n=this.#e.getQueryCache().build(this.#e,e),r=this.createResult(n,e);return t=this,i=r,(0,o.shallowEqualObjects)(t.getCurrentResult(),i)||(this.#a=r,this.#o=this.options,this.#s=this.#n.state),r}getCurrentResult(){return this.#a}trackResult(e,t){return new Proxy(e,{get:(e,i)=>(this.trackProp(i),t?.(i),"promise"===i&&(this.trackProp("data"),this.options.experimental_prefetchInRender||"pending"!==this.#i.status||this.#i.reject(Error("experimental_prefetchInRender feature flag is not enabled"))),Reflect.get(e,i))})}trackProp(e){this.#m.add(e)}getCurrentQuery(){return this.#n}refetch({...e}={}){return this.fetch({...e})}fetchOptimistic(e){let t=this.#e.defaultQueryOptions(e),i=this.#e.getQueryCache().build(this.#e,t);return i.fetch().then(()=>this.createResult(i,t))}fetch(e){return this.#h({...e,cancelRefetch:e.cancelRefetch??!0}).then(()=>(this.updateResult(),this.#a))}#h(e){this.#C();let t=this.#n.fetch(this.options,e);return e?.throwOnError||(t=t.catch(o.noop)),t}#v(){this.#f();let e=(0,o.resolveStaleTime)(this.options.staleTime,this.#n);if(o.isServer||this.#a.isStale||!(0,o.isValidTimeout)(e))return;let t=(0,o.timeUntilStale)(this.#a.dataUpdatedAt,e);this.#d=l.timeoutManager.setTimeout(()=>{this.#a.isStale||this.updateResult()},t+1)}#b(){return("function"==typeof this.options.refetchInterval?this.options.refetchInterval(this.#n):this.options.refetchInterval)??!1}#P(e){this.#S(),this.#p=e,!o.isServer&&!1!==(0,o.resolveEnabled)(this.options.enabled,this.#n)&&(0,o.isValidTimeout)(this.#p)&&0!==this.#p&&(this.#g=l.timeoutManager.setInterval(()=>{(this.options.refetchIntervalInBackground||i.focusManager.isFocused())&&this.#h()},this.#p))}#y(){this.#v(),this.#P(this.#b())}#f(){this.#d&&(l.timeoutManager.clearTimeout(this.#d),this.#d=void 0)}#S(){this.#g&&(l.timeoutManager.clearInterval(this.#g),this.#g=void 0)}createResult(e,t){let i,n=this.#n,a=this.options,l=this.#a,c=this.#s,d=this.#o,m=e!==n?e.state:this.#r,{state:h}=e,y={...h},f=!1;if(t._optimisticResults){let i=this.hasListeners(),s=!i&&u(e,t),o=i&&g(e,n,t,a);(s||o)&&(y={...y,...(0,r.fetchState)(h.data,e.options)}),"isRestoring"===t._optimisticResults&&(y.fetchStatus="idle")}let{error:S,errorUpdatedAt:C,status:v}=y;i=y.data;let b=!1;if(void 0!==t.placeholderData&&void 0===i&&"pending"===v){let e;l?.isPlaceholderData&&t.placeholderData===d?.placeholderData?(e=l.data,b=!0):e="function"==typeof t.placeholderData?t.placeholderData(this.#u?.state.data,this.#u):t.placeholderData,void 0!==e&&(v="success",i=(0,o.replaceData)(l?.data,e,t),f=!0)}if(t.select&&void 0!==i&&!b)if(l&&i===c?.data&&t.select===this.#l)i=this.#c;else try{this.#l=t.select,i=t.select(i),i=(0,o.replaceData)(l?.data,i,t),this.#c=i,this.#t=null}catch(e){this.#t=e}this.#t&&(S=this.#t,i=this.#c,C=Date.now(),v="error");let P="fetching"===y.fetchStatus,M="pending"===v,R="error"===v,E=M&&P,O=void 0!==i,A={status:v,fetchStatus:y.fetchStatus,isPending:M,isSuccess:"success"===v,isError:R,isInitialLoading:E,isLoading:E,data:i,dataUpdatedAt:y.dataUpdatedAt,error:S,errorUpdatedAt:C,failureCount:y.fetchFailureCount,failureReason:y.fetchFailureReason,errorUpdateCount:y.errorUpdateCount,isFetched:y.dataUpdateCount>0||y.errorUpdateCount>0,isFetchedAfterMount:y.dataUpdateCount>m.dataUpdateCount||y.errorUpdateCount>m.errorUpdateCount,isFetching:P,isRefetching:P&&!M,isLoadingError:R&&!O,isPaused:"paused"===y.fetchStatus,isPlaceholderData:f,isRefetchError:R&&O,isStale:p(e,t),refetch:this.refetch,promise:this.#i,isEnabled:!1!==(0,o.resolveEnabled)(t.enabled,e)};if(this.options.experimental_prefetchInRender){let t=e=>{"error"===A.status?e.reject(A.error):void 0!==A.data&&e.resolve(A.data)},i=()=>{t(this.#i=A.promise=(0,s.pendingThenable)())},r=this.#i;switch(r.status){case"pending":e.queryHash===n.queryHash&&t(r);break;case"fulfilled":("error"===A.status||A.data!==r.value)&&i();break;case"rejected":("error"!==A.status||A.error!==r.reason)&&i()}}return A}updateResult(){let e=this.#a,t=this.createResult(this.#n,this.options);if(this.#s=this.#n.state,this.#o=this.options,void 0!==this.#s.data&&(this.#u=this.#n),(0,o.shallowEqualObjects)(t,e))return;this.#a=t;let i=()=>{if(!e)return!0;let{notifyOnChangeProps:t}=this.options,i="function"==typeof t?t():t;if("all"===i||!i&&!this.#m.size)return!0;let n=new Set(i??this.#m);return this.options.throwOnError&&n.add("error"),Object.keys(this.#a).some(t=>this.#a[t]!==e[t]&&n.has(t))};this.#M({listeners:i()})}#C(){let e=this.#e.getQueryCache().build(this.#e,this.options);if(e===this.#n)return;let t=this.#n;this.#n=e,this.#r=e.state,this.hasListeners()&&(t?.removeObserver(this),e.addObserver(this))}onQueryUpdate(){this.updateResult(),this.hasListeners()&&this.#y()}#M(e){n.notifyManager.batch(()=>{e.listeners&&this.listeners.forEach(e=>{e(this.#a)}),this.#e.getQueryCache().notify({query:this.#n,type:"observerResultsUpdated"})})}};function u(e,t){return!1!==(0,o.resolveEnabled)(t.enabled,e)&&void 0===e.state.data&&("error"!==e.state.status||!1!==t.retryOnMount)||void 0!==e.state.data&&d(e,t,t.refetchOnMount)}function d(e,t,i){if(!1!==(0,o.resolveEnabled)(t.enabled,e)&&"static"!==(0,o.resolveStaleTime)(t.staleTime,e)){let n="function"==typeof i?i(e):i;return"always"===n||!1!==n&&p(e,t)}return!1}function g(e,t,i,n){return(e!==t||!1===(0,o.resolveEnabled)(n.enabled,e))&&(!i.suspense||"error"!==e.state.status)&&p(e,i)}function p(e,t){return!1!==(0,o.resolveEnabled)(t.enabled,e)&&e.isStaleByTime((0,o.resolveStaleTime)(t.staleTime,e))}e.i(84646);var m=e.i(29364),h=e.i(4004);e.i(22047);var y=m.createContext((t=!1,{clearReset:()=>{t=!1},reset:()=>{t=!0},isReset:()=>t})),f=m.createContext(!1);f.Provider;var S=(e,t,i)=>t.fetchOptimistic(e).catch(()=>{i.clearReset()});function C(e,t){return function(e,t,i){let r=m.useContext(f),a=m.useContext(y),s=(0,h.useQueryClient)(i),l=s.defaultQueryOptions(e);if(s.getDefaultOptions().queries?._experimental_beforeQuery?.(l),l._optimisticResults=r?"isRestoring":"optimistic",l.suspense){let e=e=>"static"===e?e:Math.max(e??1e3,1e3),t=l.staleTime;l.staleTime="function"==typeof t?(...i)=>e(t(...i)):e(t),"number"==typeof l.gcTime&&(l.gcTime=Math.max(l.gcTime,1e3))}(l.suspense||l.throwOnError||l.experimental_prefetchInRender)&&!a.isReset()&&(l.retryOnMount=!1),m.useEffect(()=>{a.clearReset()},[a]);let c=!s.getQueryCache().get(l.queryHash),[u]=m.useState(()=>new t(s,l)),d=u.getOptimisticResult(l),g=!r&&!1!==e.subscribed;if(m.useSyncExternalStore(m.useCallback(e=>{let t=g?u.subscribe(n.notifyManager.batchCalls(e)):o.noop;return u.updateResult(),t},[u,g]),()=>u.getCurrentResult(),()=>u.getCurrentResult()),m.useEffect(()=>{u.setOptions(l)},[l,u]),l?.suspense&&d.isPending)throw S(l,u,a);if((({result:e,errorResetBoundary:t,throwOnError:i,query:n,suspense:r})=>e.isError&&!t.isReset()&&!e.isFetching&&n&&(r&&void 0===e.data||(0,o.shouldThrowError)(i,[e.error,n])))({result:d,errorResetBoundary:a,throwOnError:l.throwOnError,query:s.getQueryCache().get(l.queryHash),suspense:l.suspense}))throw d.error;if(s.getDefaultOptions().queries?._experimental_afterQuery?.(l,d),l.experimental_prefetchInRender&&!o.isServer&&d.isLoading&&d.isFetching&&!r){let e=c?S(l,u,a):s.getQueryCache().get(l.queryHash)?.promise;e?.catch(o.noop).finally(()=>{u.updateResult()})}return l.notifyOnChangeProps?d:u.trackResult(d)}(e,c,t)}e.s(["useQuery",()=>C],17736)},25284,e=>{"use strict";var t=e.i(29364),i=e.i(97580),n=e.i(99276),r=e.i(44536),a=e.i(91003),s=class extends r.Subscribable{#e;#a=void 0;#R;#E;constructor(e,t){super(),this.#e=e,this.setOptions(t),this.bindMethods(),this.#O()}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(e){let t=this.options;this.options=this.#e.defaultMutationOptions(e),(0,a.shallowEqualObjects)(this.options,t)||this.#e.getMutationCache().notify({type:"observerOptionsUpdated",mutation:this.#R,observer:this}),t?.mutationKey&&this.options.mutationKey&&(0,a.hashKey)(t.mutationKey)!==(0,a.hashKey)(this.options.mutationKey)?this.reset():this.#R?.state.status==="pending"&&this.#R.setOptions(this.options)}onUnsubscribe(){this.hasListeners()||this.#R?.removeObserver(this)}onMutationUpdate(e){this.#O(),this.#M(e)}getCurrentResult(){return this.#a}reset(){this.#R?.removeObserver(this),this.#R=void 0,this.#O(),this.#M()}mutate(e,t){return this.#E=t,this.#R?.removeObserver(this),this.#R=this.#e.getMutationCache().build(this.#e,this.options),this.#R.addObserver(this),this.#R.execute(e)}#O(){let e=this.#R?.state??(0,i.getDefaultState)();this.#a={...e,isPending:"pending"===e.status,isSuccess:"success"===e.status,isError:"error"===e.status,isIdle:"idle"===e.status,mutate:this.mutate,reset:this.reset}}#M(e){n.notifyManager.batch(()=>{if(this.#E&&this.hasListeners()){let t=this.#a.variables,i=this.#a.context,n={client:this.#e,meta:this.options.meta,mutationKey:this.options.mutationKey};e?.type==="success"?(this.#E.onSuccess?.(e.data,t,i,n),this.#E.onSettled?.(e.data,null,t,i,n)):e?.type==="error"&&(this.#E.onError?.(e.error,t,i,n),this.#E.onSettled?.(void 0,e.error,t,i,n))}this.listeners.forEach(e=>{e(this.#a)})})}},o=e.i(4004);function l(e,i){let r=(0,o.useQueryClient)(i),[l]=t.useState(()=>new s(r,e));t.useEffect(()=>{l.setOptions(e)},[l,e]);let c=t.useSyncExternalStore(t.useCallback(e=>l.subscribe(n.notifyManager.batchCalls(e)),[l]),()=>l.getCurrentResult(),()=>l.getCurrentResult()),u=t.useCallback((e,t)=>{l.mutate(e,t).catch(a.noop)},[l]);if(c.error&&(0,a.shouldThrowError)(l.options.throwOnError,[c.error]))throw c.error;return{...c,mutate:u,mutateAsync:c.mutate}}e.s(["useMutation",()=>l],25284)},43771,e=>{"use strict";let t=`Software & IT
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
       └─ Space Safety Standards`;function i(e){let t=e.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/&/g," ").replace(/\+/g," plus ").replace(/\//g," ").replace(/[^a-z0-9]+/g,"-").replace(/-{2,}/g,"-").replace(/^-+|-+$/g,"");return t.length>0?t:"unknown"}function n(e,t,i){let n=i.get(e)??new Map;i.set(e,n);let r=(n.get(t)??0)+1;return n.set(t,r),1===r?t:`${t}-${r}`}let r=function(e=t){let r=[],a=new Map,s=[],o=[],l=new Map,c=null,u=null;for(let t of e.split(/\r?\n/)){let e=t.replace(/\s+$/,"");if(!e.trim())continue;let d=e.match(/[├└]─\s*(.+)$/);if(!d){let t=e.trim(),o=n("__root__",i(t),l),d={id:o,label:t,depth:0,children:[]};r.push(d),s.push(d),a.set(o,d),c=d,u=null;continue}let g=d[1].trim(),p=2>=Math.max(e.indexOf("├─"),e.indexOf("└─"))?1:2,m=1===p?c:u;if(!m)continue;let h=i(g),y=n(m.id,h,l),f=`${m.id}.${y}`,S={id:f,label:g,depth:p,parentId:m.id,children:[]};m.children.push(S),s.push(S),a.set(f,S),1===p&&(u=S),2===p&&o.push(S)}return{roots:r,byId:a,all:s,leaves:o}}();function a(e){let t=r.byId.get(e);if(!t)return null;let i=[t.id],n=t.parentId;for(;n;)i.push(n),n=r.byId.get(n)?.parentId;return i.reverse()}function s(e,t){let i;if(!e)return t?.unknownFallback??"";let n=(i=a(e))?i.map(e=>r.byId.get(e)?.label??e):null;return n?n.join(t?.separator??" › "):t?.unknownFallback??e}function o(e,t){return!t||"all"===t||!!e&&(e===t||e.startsWith(`${t}.`))}e.s(["JOB_TAXONOMY",0,r,"getJobCategoryDisplay",()=>s,"getJobCategoryPathIds",()=>a,"jobCategoryMatches",()=>o],43771)},9616,e=>{"use strict";var t=e.i(22047),i=e.i(21525),n=e.i(89138),r=e.i(25284),a=e.i(17736),s=e.i(4004),o=e.i(9165),l=e.i(29364),c=e.i(34022),u=e.i(38286),d=e.i(43771);function g(){let e,g,m,h,y,f,S,C,v,b,P,M,R,E,O,A,T,D,I,w,x,k,_,F,j,L,B,N,Q,G,H,V,W,U,z,q,$,K=(0,i.c)(88),X=(0,n.useParams)(),J=X?.id,Y=(0,s.useQueryClient)();K[0]!==J?(e=["job",J],g=()=>(0,o.getJob)(J),K[0]=J,K[1]=e,K[2]=g):(e=K[1],g=K[2]);let Z=!!J;K[3]!==e||K[4]!==g||K[5]!==Z?(m={queryKey:e,queryFn:g,enabled:Z},K[3]=e,K[4]=g,K[5]=Z,K[6]=m):m=K[6];let{data:ee,isLoading:et}=(0,a.useQuery)(m);K[7]!==J?(h=["proposals",J],y=()=>(0,o.listJobProposals)(J),K[7]=J,K[8]=h,K[9]=y):(h=K[8],y=K[9]);let ei=!!J;K[10]!==h||K[11]!==y||K[12]!==ei?(f={queryKey:h,queryFn:y,enabled:ei},K[10]=h,K[11]=y,K[12]=ei,K[13]=f):f=K[13];let{data:en}=(0,a.useQuery)(f),[er,ea]=(0,l.useState)(""),[es,eo]=(0,l.useState)(0),[el,ec]=(0,l.useState)(7);K[14]!==es||K[15]!==er||K[16]!==J||K[17]!==el?(S=()=>(0,o.submitProposal)(J,{coverLetter:er,bidAmount:es,timelineDays:el}),K[14]=es,K[15]=er,K[16]=J,K[17]=el,K[18]=S):S=K[18],K[19]!==J||K[20]!==Y?(C=()=>{ea(""),eo(0),ec(7),Y.invalidateQueries({queryKey:["proposals",J]})},K[19]=J,K[20]=Y,K[21]=C):C=K[21],K[22]!==S||K[23]!==C?(v={mutationFn:S,onSuccess:C},K[22]=S,K[23]=C,K[24]=v):v=K[24];let eu=(0,r.useMutation)(v);if(et){let e;return K[25]===Symbol.for("react.memo_cache_sentinel")?(e=(0,t.jsx)("p",{className:"p-6",children:"Loading..."}),K[25]=e):e=K[25],e}if(!ee){let e;return K[26]===Symbol.for("react.memo_cache_sentinel")?(e=(0,t.jsx)("p",{className:"p-6",children:"Not found"}),K[26]=e):e=K[26],e}let ed="OPEN"===(ee.status??"OPEN").toUpperCase()?"success":"IN_PROGRESS"===(ee.status??"").toUpperCase()?"info":"COMPLETED"===(ee.status??"").toUpperCase()?"default":"warning";K[27]===Symbol.for("react.memo_cache_sentinel")?(b=(0,t.jsx)("div",{className:"absolute inset-0 -z-10 opacity-80",style:{backgroundImage:"url('/images/backgrounds/geo-light-grid.svg')"}}),P=(0,t.jsx)("div",{className:"absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(125,211,252,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(167,139,250,0.25),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(110,231,183,0.18),transparent_35%)]"}),K[27]=b,K[28]=P):(b=K[27],P=K[28]),K[29]===Symbol.for("react.memo_cache_sentinel")?(M=(0,t.jsx)("div",{className:"relative h-16 w-16 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner",children:(0,t.jsx)(c.default,{src:"/images/badges/verified.png",alt:"Beta verified badge",fill:!0,className:"object-contain"})}),K[29]=M):M=K[29],K[30]!==ee.title?(R=(0,t.jsx)("h1",{className:"text-2xl font-bold text-slate-900",children:ee.title}),K[30]=ee.title,K[31]=R):R=K[31];let eg=ee.status??"OPEN";return K[32]!==ed||K[33]!==eg?(E=(0,t.jsx)(u.Badge,{variant:ed,children:eg}),K[32]=ed,K[33]=eg,K[34]=E):E=K[34],K[35]!==ee.categoryId?(O=ee.categoryId?(0,t.jsx)(u.Badge,{variant:"info",className:"max-w-full bg-sky-50/80 text-sky-700",title:(0,d.getJobCategoryDisplay)(ee.categoryId,{unknownFallback:ee.categoryId}),children:(0,d.getJobCategoryDisplay)(ee.categoryId,{unknownFallback:ee.categoryId})}):null,K[35]=ee.categoryId,K[36]=O):O=K[36],K[37]!==R||K[38]!==E||K[39]!==O?(A=(0,t.jsxs)("div",{className:"flex flex-wrap items-center gap-3",children:[R,E,O]}),K[37]=R,K[38]=E,K[39]=O,K[40]=A):A=K[40],K[41]!==ee.description?(T=(0,t.jsx)("p",{className:"text-slate-700 whitespace-pre-wrap",children:ee.description}),K[41]=ee.description,K[42]=T):T=K[42],K[43]!==A||K[44]!==T?(D=(0,t.jsx)("header",{className:"mb-6 rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-sky-500/10 backdrop-blur",children:(0,t.jsxs)("div",{className:"flex flex-wrap items-start gap-4",children:[M,(0,t.jsxs)("div",{className:"flex-1 space-y-2",children:[A,T]})]})}),K[43]=A,K[44]=T,K[45]=D):D=K[45],K[46]===Symbol.for("react.memo_cache_sentinel")?(I=(0,t.jsx)("div",{className:"flex items-center justify-between",children:(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Submit Proposal (Freelancer)"})}),K[46]=I):I=K[46],K[47]===Symbol.for("react.memo_cache_sentinel")?(w=e=>ea(e.target.value),K[47]=w):w=K[47],K[48]!==er?(x=(0,t.jsx)(u.Textarea,{value:er,onChange:w,className:"min-h-[140px]",placeholder:"Share relevant work, timeline confidence, and assumptions."}),K[48]=er,K[49]=x):x=K[49],K[50]===Symbol.for("react.memo_cache_sentinel")?(k=e=>eo(Number(e.target.value)),K[50]=k):k=K[50],K[51]!==es?(_=(0,t.jsx)(u.Input,{type:"number",value:es,onChange:k,placeholder:"Bid amount"}),K[51]=es,K[52]=_):_=K[52],K[53]===Symbol.for("react.memo_cache_sentinel")?(F=e=>ec(Number(e.target.value)),K[53]=F):F=K[53],K[54]!==el?(j=(0,t.jsx)(u.Input,{type:"number",value:el,onChange:F,placeholder:"Days"}),K[54]=el,K[55]=j):j=K[55],K[56]!==eu?(L=()=>eu.mutate(),K[56]=eu,K[57]=L):L=K[57],K[58]!==eu.isPending||K[59]!==L?(B=(0,t.jsx)(u.Button,{onClick:L,disabled:eu.isPending,children:"Submit"}),K[58]=eu.isPending,K[59]=L,K[60]=B):B=K[60],K[61]!==_||K[62]!==j||K[63]!==B?(N=(0,t.jsxs)("div",{className:"grid gap-3 sm:grid-cols-3",children:[_,j,B]}),K[61]=_,K[62]=j,K[63]=B,K[64]=N):N=K[64],K[65]!==eu.isError?(Q=eu.isError&&(0,t.jsx)("p",{className:"text-sm text-rose-600",children:"Failed — check connectivity."}),K[65]=eu.isError,K[66]=Q):Q=K[66],K[67]!==eu.isSuccess?(G=eu.isSuccess&&(0,t.jsx)("p",{className:"text-sm text-emerald-600",children:"Proposal submitted."}),K[67]=eu.isSuccess,K[68]=G):G=K[68],K[69]!==x||K[70]!==N||K[71]!==Q||K[72]!==G?(H=(0,t.jsxs)("section",{className:"rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-sky-500/10 backdrop-blur",children:[I,(0,t.jsxs)("div",{className:"mt-4 space-y-4",children:[x,N,Q,G]})]}),K[69]=x,K[70]=N,K[71]=Q,K[72]=G,K[73]=H):H=K[73],K[74]===Symbol.for("react.memo_cache_sentinel")?(V=(0,t.jsx)("div",{className:"flex items-center justify-between",children:(0,t.jsx)("h2",{className:"text-lg font-semibold text-slate-900",children:"Proposals (Employer)"})}),K[74]=V):V=K[74],K[75]!==en?(W=en?.map(p),K[75]=en,K[76]=W):W=K[76],K[77]!==en?(U=(!en||0===en.length)&&(0,t.jsx)("p",{className:"text-slate-600",children:"No proposals yet."}),K[77]=en,K[78]=U):U=K[78],K[79]!==W||K[80]!==U?(z=(0,t.jsxs)("section",{className:"rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-sky-500/10 backdrop-blur",children:[V,(0,t.jsxs)("ul",{className:"mt-4 space-y-3",children:[W,U]})]}),K[79]=W,K[80]=U,K[81]=z):z=K[81],K[82]!==H||K[83]!==z?(q=(0,t.jsxs)("div",{className:"grid gap-6 lg:grid-cols-[1.1fr_0.9fr]",children:[H,z]}),K[82]=H,K[83]=z,K[84]=q):q=K[84],K[85]!==D||K[86]!==q?($=(0,t.jsxs)("main",{className:"relative mx-auto max-w-5xl p-6 pb-12",children:[b,P,D,q]}),K[85]=D,K[86]=q,K[87]=$):$=K[87],$}function p(e){return(0,t.jsx)("li",{className:"rounded-xl border border-white/30 bg-white/70 p-3 shadow-inner",children:(0,t.jsxs)("div",{className:"flex items-center justify-between gap-2",children:[(0,t.jsxs)("div",{className:"space-y-1",children:[(0,t.jsxs)("p",{className:"font-medium text-slate-900",children:["Bid ",e.bidAmount," — ",e.timelineDays," days"]}),(0,t.jsx)("p",{className:"text-sm text-slate-600",children:e.coverLetter})]}),(0,t.jsx)(u.Badge,{variant:"outline",className:"bg-slate-100 text-slate-700",children:e.status??"SUBMITTED"})]})},e.id)}e.s(["default",()=>g])}]);