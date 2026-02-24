(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,76555,(e,t,n)=>{var i={675:function(e,t){"use strict";t.byteLength=function(e){var t=l(e),n=t[0],i=t[1];return(n+i)*3/4-i},t.toByteArray=function(e){var t,n,a=l(e),o=a[0],s=a[1],c=new r((o+s)*3/4-s),u=0,g=s>0?o-4:o;for(n=0;n<g;n+=4)t=i[e.charCodeAt(n)]<<18|i[e.charCodeAt(n+1)]<<12|i[e.charCodeAt(n+2)]<<6|i[e.charCodeAt(n+3)],c[u++]=t>>16&255,c[u++]=t>>8&255,c[u++]=255&t;return 2===s&&(t=i[e.charCodeAt(n)]<<2|i[e.charCodeAt(n+1)]>>4,c[u++]=255&t),1===s&&(t=i[e.charCodeAt(n)]<<10|i[e.charCodeAt(n+1)]<<4|i[e.charCodeAt(n+2)]>>2,c[u++]=t>>8&255,c[u++]=255&t),c},t.fromByteArray=function(e){for(var t,i=e.length,r=i%3,a=[],o=0,s=i-r;o<s;o+=16383)a.push(function(e,t,i){for(var r,a=[],o=t;o<i;o+=3)r=(e[o]<<16&0xff0000)+(e[o+1]<<8&65280)+(255&e[o+2]),a.push(n[r>>18&63]+n[r>>12&63]+n[r>>6&63]+n[63&r]);return a.join("")}(e,o,o+16383>s?s:o+16383));return 1===r?a.push(n[(t=e[i-1])>>2]+n[t<<4&63]+"=="):2===r&&a.push(n[(t=(e[i-2]<<8)+e[i-1])>>10]+n[t>>4&63]+n[t<<2&63]+"="),a.join("")};for(var n=[],i=[],r="undefined"!=typeof Uint8Array?Uint8Array:Array,a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",o=0,s=a.length;o<s;++o)n[o]=a[o],i[a.charCodeAt(o)]=o;function l(e){var t=e.length;if(t%4>0)throw Error("Invalid string. Length must be a multiple of 4");var n=e.indexOf("=");-1===n&&(n=t);var i=n===t?0:4-n%4;return[n,i]}i[45]=62,i[95]=63},72:function(e,t,n){"use strict";var i=n(675),r=n(783),a="function"==typeof Symbol&&"function"==typeof Symbol.for?Symbol.for("nodejs.util.inspect.custom"):null;function o(e){if(e>0x7fffffff)throw RangeError('The value "'+e+'" is invalid for option "size"');var t=new Uint8Array(e);return Object.setPrototypeOf(t,s.prototype),t}function s(e,t,n){if("number"==typeof e){if("string"==typeof t)throw TypeError('The "string" argument must be of type string. Received type number');return u(e)}return l(e,t,n)}function l(e,t,n){if("string"==typeof e){var i=e,r=t;if(("string"!=typeof r||""===r)&&(r="utf8"),!s.isEncoding(r))throw TypeError("Unknown encoding: "+r);var a=0|d(i,r),l=o(a),c=l.write(i,r);return c!==a&&(l=l.slice(0,c)),l}if(ArrayBuffer.isView(e))return g(e);if(null==e)throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof e);if(R(e,ArrayBuffer)||e&&R(e.buffer,ArrayBuffer)||"undefined"!=typeof SharedArrayBuffer&&(R(e,SharedArrayBuffer)||e&&R(e.buffer,SharedArrayBuffer)))return function(e,t,n){var i;if(t<0||e.byteLength<t)throw RangeError('"offset" is outside of buffer bounds');if(e.byteLength<t+(n||0))throw RangeError('"length" is outside of buffer bounds');return Object.setPrototypeOf(i=void 0===t&&void 0===n?new Uint8Array(e):void 0===n?new Uint8Array(e,t):new Uint8Array(e,t,n),s.prototype),i}(e,t,n);if("number"==typeof e)throw TypeError('The "value" argument must not be of type number. Received type number');var u=e.valueOf&&e.valueOf();if(null!=u&&u!==e)return s.from(u,t,n);var h=function(e){if(s.isBuffer(e)){var t=0|p(e.length),n=o(t);return 0===n.length||e.copy(n,0,0,t),n}return void 0!==e.length?"number"!=typeof e.length||function(e){return e!=e}(e.length)?o(0):g(e):"Buffer"===e.type&&Array.isArray(e.data)?g(e.data):void 0}(e);if(h)return h;if("undefined"!=typeof Symbol&&null!=Symbol.toPrimitive&&"function"==typeof e[Symbol.toPrimitive])return s.from(e[Symbol.toPrimitive]("string"),t,n);throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof e)}function c(e){if("number"!=typeof e)throw TypeError('"size" argument must be of type number');if(e<0)throw RangeError('The value "'+e+'" is invalid for option "size"')}function u(e){return c(e),o(e<0?0:0|p(e))}function g(e){for(var t=e.length<0?0:0|p(e.length),n=o(t),i=0;i<t;i+=1)n[i]=255&e[i];return n}t.Buffer=s,t.SlowBuffer=function(e){return+e!=e&&(e=0),s.alloc(+e)},t.INSPECT_MAX_BYTES=50,t.kMaxLength=0x7fffffff,s.TYPED_ARRAY_SUPPORT=function(){try{var e=new Uint8Array(1),t={foo:function(){return 42}};return Object.setPrototypeOf(t,Uint8Array.prototype),Object.setPrototypeOf(e,t),42===e.foo()}catch(e){return!1}}(),s.TYPED_ARRAY_SUPPORT||"undefined"==typeof console||"function"!=typeof console.error||console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."),Object.defineProperty(s.prototype,"parent",{enumerable:!0,get:function(){if(s.isBuffer(this))return this.buffer}}),Object.defineProperty(s.prototype,"offset",{enumerable:!0,get:function(){if(s.isBuffer(this))return this.byteOffset}}),s.poolSize=8192,s.from=function(e,t,n){return l(e,t,n)},Object.setPrototypeOf(s.prototype,Uint8Array.prototype),Object.setPrototypeOf(s,Uint8Array),s.alloc=function(e,t,n){return(c(e),e<=0)?o(e):void 0!==t?"string"==typeof n?o(e).fill(t,n):o(e).fill(t):o(e)},s.allocUnsafe=function(e){return u(e)},s.allocUnsafeSlow=function(e){return u(e)};function p(e){if(e>=0x7fffffff)throw RangeError("Attempt to allocate Buffer larger than maximum size: 0x7fffffff bytes");return 0|e}function d(e,t){if(s.isBuffer(e))return e.length;if(ArrayBuffer.isView(e)||R(e,ArrayBuffer))return e.byteLength;if("string"!=typeof e)throw TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type '+typeof e);var n=e.length,i=arguments.length>2&&!0===arguments[2];if(!i&&0===n)return 0;for(var r=!1;;)switch(t){case"ascii":case"latin1":case"binary":return n;case"utf8":case"utf-8":return E(e).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*n;case"hex":return n>>>1;case"base64":return w(e).length;default:if(r)return i?-1:E(e).length;t=(""+t).toLowerCase(),r=!0}}function h(e,t,n){var r,a,o,s=!1;if((void 0===t||t<0)&&(t=0),t>this.length||((void 0===n||n>this.length)&&(n=this.length),n<=0||(n>>>=0)<=(t>>>=0)))return"";for(e||(e="utf8");;)switch(e){case"hex":return function(e,t,n){var i=e.length;(!t||t<0)&&(t=0),(!n||n<0||n>i)&&(n=i);for(var r="",a=t;a<n;++a)r+=D[e[a]];return r}(this,t,n);case"utf8":case"utf-8":return x(this,t,n);case"ascii":return function(e,t,n){var i="";n=Math.min(e.length,n);for(var r=t;r<n;++r)i+=String.fromCharCode(127&e[r]);return i}(this,t,n);case"latin1":case"binary":return function(e,t,n){var i="";n=Math.min(e.length,n);for(var r=t;r<n;++r)i+=String.fromCharCode(e[r]);return i}(this,t,n);case"base64":return r=this,a=t,o=n,0===a&&o===r.length?i.fromByteArray(r):i.fromByteArray(r.slice(a,o));case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return function(e,t,n){for(var i=e.slice(t,n),r="",a=0;a<i.length;a+=2)r+=String.fromCharCode(i[a]+256*i[a+1]);return r}(this,t,n);default:if(s)throw TypeError("Unknown encoding: "+e);e=(e+"").toLowerCase(),s=!0}}function m(e,t,n){var i=e[t];e[t]=e[n],e[n]=i}function f(e,t,n,i,r){var a;if(0===e.length)return -1;if("string"==typeof n?(i=n,n=0):n>0x7fffffff?n=0x7fffffff:n<-0x80000000&&(n=-0x80000000),(a=n*=1)!=a&&(n=r?0:e.length-1),n<0&&(n=e.length+n),n>=e.length)if(r)return -1;else n=e.length-1;else if(n<0)if(!r)return -1;else n=0;if("string"==typeof t&&(t=s.from(t,i)),s.isBuffer(t))return 0===t.length?-1:y(e,t,n,i,r);if("number"==typeof t){if(t&=255,"function"==typeof Uint8Array.prototype.indexOf)if(r)return Uint8Array.prototype.indexOf.call(e,t,n);else return Uint8Array.prototype.lastIndexOf.call(e,t,n);return y(e,[t],n,i,r)}throw TypeError("val must be string, number or Buffer")}function y(e,t,n,i,r){var a,o=1,s=e.length,l=t.length;if(void 0!==i&&("ucs2"===(i=String(i).toLowerCase())||"ucs-2"===i||"utf16le"===i||"utf-16le"===i)){if(e.length<2||t.length<2)return -1;o=2,s/=2,l/=2,n/=2}function c(e,t){return 1===o?e[t]:e.readUInt16BE(t*o)}if(r){var u=-1;for(a=n;a<s;a++)if(c(e,a)===c(t,-1===u?0:a-u)){if(-1===u&&(u=a),a-u+1===l)return u*o}else -1!==u&&(a-=a-u),u=-1}else for(n+l>s&&(n=s-l),a=n;a>=0;a--){for(var g=!0,p=0;p<l;p++)if(c(e,a+p)!==c(t,p)){g=!1;break}if(g)return a}return -1}s.isBuffer=function(e){return null!=e&&!0===e._isBuffer&&e!==s.prototype},s.compare=function(e,t){if(R(e,Uint8Array)&&(e=s.from(e,e.offset,e.byteLength)),R(t,Uint8Array)&&(t=s.from(t,t.offset,t.byteLength)),!s.isBuffer(e)||!s.isBuffer(t))throw TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');if(e===t)return 0;for(var n=e.length,i=t.length,r=0,a=Math.min(n,i);r<a;++r)if(e[r]!==t[r]){n=e[r],i=t[r];break}return n<i?-1:+(i<n)},s.isEncoding=function(e){switch(String(e).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},s.concat=function(e,t){if(!Array.isArray(e))throw TypeError('"list" argument must be an Array of Buffers');if(0===e.length)return s.alloc(0);if(void 0===t)for(n=0,t=0;n<e.length;++n)t+=e[n].length;var n,i=s.allocUnsafe(t),r=0;for(n=0;n<e.length;++n){var a=e[n];if(R(a,Uint8Array)&&(a=s.from(a)),!s.isBuffer(a))throw TypeError('"list" argument must be an Array of Buffers');a.copy(i,r),r+=a.length}return i},s.byteLength=d,s.prototype._isBuffer=!0,s.prototype.swap16=function(){var e=this.length;if(e%2!=0)throw RangeError("Buffer size must be a multiple of 16-bits");for(var t=0;t<e;t+=2)m(this,t,t+1);return this},s.prototype.swap32=function(){var e=this.length;if(e%4!=0)throw RangeError("Buffer size must be a multiple of 32-bits");for(var t=0;t<e;t+=4)m(this,t,t+3),m(this,t+1,t+2);return this},s.prototype.swap64=function(){var e=this.length;if(e%8!=0)throw RangeError("Buffer size must be a multiple of 64-bits");for(var t=0;t<e;t+=8)m(this,t,t+7),m(this,t+1,t+6),m(this,t+2,t+5),m(this,t+3,t+4);return this},s.prototype.toString=function(){var e=this.length;return 0===e?"":0==arguments.length?x(this,0,e):h.apply(this,arguments)},s.prototype.toLocaleString=s.prototype.toString,s.prototype.equals=function(e){if(!s.isBuffer(e))throw TypeError("Argument must be a Buffer");return this===e||0===s.compare(this,e)},s.prototype.inspect=function(){var e="",n=t.INSPECT_MAX_BYTES;return e=this.toString("hex",0,n).replace(/(.{2})/g,"$1 ").trim(),this.length>n&&(e+=" ... "),"<Buffer "+e+">"},a&&(s.prototype[a]=s.prototype.inspect),s.prototype.compare=function(e,t,n,i,r){if(R(e,Uint8Array)&&(e=s.from(e,e.offset,e.byteLength)),!s.isBuffer(e))throw TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type '+typeof e);if(void 0===t&&(t=0),void 0===n&&(n=e?e.length:0),void 0===i&&(i=0),void 0===r&&(r=this.length),t<0||n>e.length||i<0||r>this.length)throw RangeError("out of range index");if(i>=r&&t>=n)return 0;if(i>=r)return -1;if(t>=n)return 1;if(t>>>=0,n>>>=0,i>>>=0,r>>>=0,this===e)return 0;for(var a=r-i,o=n-t,l=Math.min(a,o),c=this.slice(i,r),u=e.slice(t,n),g=0;g<l;++g)if(c[g]!==u[g]){a=c[g],o=u[g];break}return a<o?-1:+(o<a)},s.prototype.includes=function(e,t,n){return -1!==this.indexOf(e,t,n)},s.prototype.indexOf=function(e,t,n){return f(this,e,t,n,!0)},s.prototype.lastIndexOf=function(e,t,n){return f(this,e,t,n,!1)};function x(e,t,n){n=Math.min(e.length,n);for(var i=[],r=t;r<n;){var a,o,s,l,c=e[r],u=null,g=c>239?4:c>223?3:c>191?2:1;if(r+g<=n)switch(g){case 1:c<128&&(u=c);break;case 2:(192&(a=e[r+1]))==128&&(l=(31&c)<<6|63&a)>127&&(u=l);break;case 3:a=e[r+1],o=e[r+2],(192&a)==128&&(192&o)==128&&(l=(15&c)<<12|(63&a)<<6|63&o)>2047&&(l<55296||l>57343)&&(u=l);break;case 4:a=e[r+1],o=e[r+2],s=e[r+3],(192&a)==128&&(192&o)==128&&(192&s)==128&&(l=(15&c)<<18|(63&a)<<12|(63&o)<<6|63&s)>65535&&l<1114112&&(u=l)}null===u?(u=65533,g=1):u>65535&&(u-=65536,i.push(u>>>10&1023|55296),u=56320|1023&u),i.push(u),r+=g}var p=i,d=p.length;if(d<=4096)return String.fromCharCode.apply(String,p);for(var h="",m=0;m<d;)h+=String.fromCharCode.apply(String,p.slice(m,m+=4096));return h}function v(e,t,n){if(e%1!=0||e<0)throw RangeError("offset is not uint");if(e+t>n)throw RangeError("Trying to access beyond buffer length")}function b(e,t,n,i,r,a){if(!s.isBuffer(e))throw TypeError('"buffer" argument must be a Buffer instance');if(t>r||t<a)throw RangeError('"value" argument is out of bounds');if(n+i>e.length)throw RangeError("Index out of range")}function S(e,t,n,i,r,a){if(n+i>e.length||n<0)throw RangeError("Index out of range")}function C(e,t,n,i,a){return t*=1,n>>>=0,a||S(e,t,n,4,34028234663852886e22,-34028234663852886e22),r.write(e,t,n,i,23,4),n+4}function M(e,t,n,i,a){return t*=1,n>>>=0,a||S(e,t,n,8,17976931348623157e292,-17976931348623157e292),r.write(e,t,n,i,52,8),n+8}s.prototype.write=function(e,t,n,i){if(void 0===t)i="utf8",n=this.length,t=0;else if(void 0===n&&"string"==typeof t)i=t,n=this.length,t=0;else if(isFinite(t))t>>>=0,isFinite(n)?(n>>>=0,void 0===i&&(i="utf8")):(i=n,n=void 0);else throw Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");var r,a,o,s,l,c,u,g,p=this.length-t;if((void 0===n||n>p)&&(n=p),e.length>0&&(n<0||t<0)||t>this.length)throw RangeError("Attempt to write outside buffer bounds");i||(i="utf8");for(var d=!1;;)switch(i){case"hex":return function(e,t,n,i){n=Number(n)||0;var r=e.length-n;i?(i=Number(i))>r&&(i=r):i=r;var a=t.length;i>a/2&&(i=a/2);for(var o=0;o<i;++o){var s,l=parseInt(t.substr(2*o,2),16);if((s=l)!=s)break;e[n+o]=l}return o}(this,e,t,n);case"utf8":case"utf-8":return r=t,a=n,T(E(e,this.length-r),this,r,a);case"ascii":return o=t,s=n,T(A(e),this,o,s);case"latin1":case"binary":return function(e,t,n,i){return T(A(t),e,n,i)}(this,e,t,n);case"base64":return l=t,c=n,T(w(e),this,l,c);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return u=t,g=n,T(function(e,t){for(var n,i,r=[],a=0;a<e.length&&!((t-=2)<0);++a)i=(n=e.charCodeAt(a))>>8,r.push(n%256),r.push(i);return r}(e,this.length-u),this,u,g);default:if(d)throw TypeError("Unknown encoding: "+i);i=(""+i).toLowerCase(),d=!0}},s.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}},s.prototype.slice=function(e,t){var n=this.length;e=~~e,t=void 0===t?n:~~t,e<0?(e+=n)<0&&(e=0):e>n&&(e=n),t<0?(t+=n)<0&&(t=0):t>n&&(t=n),t<e&&(t=e);var i=this.subarray(e,t);return Object.setPrototypeOf(i,s.prototype),i},s.prototype.readUIntLE=function(e,t,n){e>>>=0,t>>>=0,n||v(e,t,this.length);for(var i=this[e],r=1,a=0;++a<t&&(r*=256);)i+=this[e+a]*r;return i},s.prototype.readUIntBE=function(e,t,n){e>>>=0,t>>>=0,n||v(e,t,this.length);for(var i=this[e+--t],r=1;t>0&&(r*=256);)i+=this[e+--t]*r;return i},s.prototype.readUInt8=function(e,t){return e>>>=0,t||v(e,1,this.length),this[e]},s.prototype.readUInt16LE=function(e,t){return e>>>=0,t||v(e,2,this.length),this[e]|this[e+1]<<8},s.prototype.readUInt16BE=function(e,t){return e>>>=0,t||v(e,2,this.length),this[e]<<8|this[e+1]},s.prototype.readUInt32LE=function(e,t){return e>>>=0,t||v(e,4,this.length),(this[e]|this[e+1]<<8|this[e+2]<<16)+0x1000000*this[e+3]},s.prototype.readUInt32BE=function(e,t){return e>>>=0,t||v(e,4,this.length),0x1000000*this[e]+(this[e+1]<<16|this[e+2]<<8|this[e+3])},s.prototype.readIntLE=function(e,t,n){e>>>=0,t>>>=0,n||v(e,t,this.length);for(var i=this[e],r=1,a=0;++a<t&&(r*=256);)i+=this[e+a]*r;return i>=(r*=128)&&(i-=Math.pow(2,8*t)),i},s.prototype.readIntBE=function(e,t,n){e>>>=0,t>>>=0,n||v(e,t,this.length);for(var i=t,r=1,a=this[e+--i];i>0&&(r*=256);)a+=this[e+--i]*r;return a>=(r*=128)&&(a-=Math.pow(2,8*t)),a},s.prototype.readInt8=function(e,t){return(e>>>=0,t||v(e,1,this.length),128&this[e])?-((255-this[e]+1)*1):this[e]},s.prototype.readInt16LE=function(e,t){e>>>=0,t||v(e,2,this.length);var n=this[e]|this[e+1]<<8;return 32768&n?0xffff0000|n:n},s.prototype.readInt16BE=function(e,t){e>>>=0,t||v(e,2,this.length);var n=this[e+1]|this[e]<<8;return 32768&n?0xffff0000|n:n},s.prototype.readInt32LE=function(e,t){return e>>>=0,t||v(e,4,this.length),this[e]|this[e+1]<<8|this[e+2]<<16|this[e+3]<<24},s.prototype.readInt32BE=function(e,t){return e>>>=0,t||v(e,4,this.length),this[e]<<24|this[e+1]<<16|this[e+2]<<8|this[e+3]},s.prototype.readFloatLE=function(e,t){return e>>>=0,t||v(e,4,this.length),r.read(this,e,!0,23,4)},s.prototype.readFloatBE=function(e,t){return e>>>=0,t||v(e,4,this.length),r.read(this,e,!1,23,4)},s.prototype.readDoubleLE=function(e,t){return e>>>=0,t||v(e,8,this.length),r.read(this,e,!0,52,8)},s.prototype.readDoubleBE=function(e,t){return e>>>=0,t||v(e,8,this.length),r.read(this,e,!1,52,8)},s.prototype.writeUIntLE=function(e,t,n,i){if(e*=1,t>>>=0,n>>>=0,!i){var r=Math.pow(2,8*n)-1;b(this,e,t,n,r,0)}var a=1,o=0;for(this[t]=255&e;++o<n&&(a*=256);)this[t+o]=e/a&255;return t+n},s.prototype.writeUIntBE=function(e,t,n,i){if(e*=1,t>>>=0,n>>>=0,!i){var r=Math.pow(2,8*n)-1;b(this,e,t,n,r,0)}var a=n-1,o=1;for(this[t+a]=255&e;--a>=0&&(o*=256);)this[t+a]=e/o&255;return t+n},s.prototype.writeUInt8=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,1,255,0),this[t]=255&e,t+1},s.prototype.writeUInt16LE=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,2,65535,0),this[t]=255&e,this[t+1]=e>>>8,t+2},s.prototype.writeUInt16BE=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,2,65535,0),this[t]=e>>>8,this[t+1]=255&e,t+2},s.prototype.writeUInt32LE=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,4,0xffffffff,0),this[t+3]=e>>>24,this[t+2]=e>>>16,this[t+1]=e>>>8,this[t]=255&e,t+4},s.prototype.writeUInt32BE=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,4,0xffffffff,0),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e,t+4},s.prototype.writeIntLE=function(e,t,n,i){if(e*=1,t>>>=0,!i){var r=Math.pow(2,8*n-1);b(this,e,t,n,r-1,-r)}var a=0,o=1,s=0;for(this[t]=255&e;++a<n&&(o*=256);)e<0&&0===s&&0!==this[t+a-1]&&(s=1),this[t+a]=(e/o|0)-s&255;return t+n},s.prototype.writeIntBE=function(e,t,n,i){if(e*=1,t>>>=0,!i){var r=Math.pow(2,8*n-1);b(this,e,t,n,r-1,-r)}var a=n-1,o=1,s=0;for(this[t+a]=255&e;--a>=0&&(o*=256);)e<0&&0===s&&0!==this[t+a+1]&&(s=1),this[t+a]=(e/o|0)-s&255;return t+n},s.prototype.writeInt8=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,1,127,-128),e<0&&(e=255+e+1),this[t]=255&e,t+1},s.prototype.writeInt16LE=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,2,32767,-32768),this[t]=255&e,this[t+1]=e>>>8,t+2},s.prototype.writeInt16BE=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,2,32767,-32768),this[t]=e>>>8,this[t+1]=255&e,t+2},s.prototype.writeInt32LE=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,4,0x7fffffff,-0x80000000),this[t]=255&e,this[t+1]=e>>>8,this[t+2]=e>>>16,this[t+3]=e>>>24,t+4},s.prototype.writeInt32BE=function(e,t,n){return e*=1,t>>>=0,n||b(this,e,t,4,0x7fffffff,-0x80000000),e<0&&(e=0xffffffff+e+1),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e,t+4},s.prototype.writeFloatLE=function(e,t,n){return C(this,e,t,!0,n)},s.prototype.writeFloatBE=function(e,t,n){return C(this,e,t,!1,n)},s.prototype.writeDoubleLE=function(e,t,n){return M(this,e,t,!0,n)},s.prototype.writeDoubleBE=function(e,t,n){return M(this,e,t,!1,n)},s.prototype.copy=function(e,t,n,i){if(!s.isBuffer(e))throw TypeError("argument should be a Buffer");if(n||(n=0),i||0===i||(i=this.length),t>=e.length&&(t=e.length),t||(t=0),i>0&&i<n&&(i=n),i===n||0===e.length||0===this.length)return 0;if(t<0)throw RangeError("targetStart out of bounds");if(n<0||n>=this.length)throw RangeError("Index out of range");if(i<0)throw RangeError("sourceEnd out of bounds");i>this.length&&(i=this.length),e.length-t<i-n&&(i=e.length-t+n);var r=i-n;if(this===e&&"function"==typeof Uint8Array.prototype.copyWithin)this.copyWithin(t,n,i);else if(this===e&&n<t&&t<i)for(var a=r-1;a>=0;--a)e[a+t]=this[a+n];else Uint8Array.prototype.set.call(e,this.subarray(n,i),t);return r},s.prototype.fill=function(e,t,n,i){if("string"==typeof e){if("string"==typeof t?(i=t,t=0,n=this.length):"string"==typeof n&&(i=n,n=this.length),void 0!==i&&"string"!=typeof i)throw TypeError("encoding must be a string");if("string"==typeof i&&!s.isEncoding(i))throw TypeError("Unknown encoding: "+i);if(1===e.length){var r,a=e.charCodeAt(0);("utf8"===i&&a<128||"latin1"===i)&&(e=a)}}else"number"==typeof e?e&=255:"boolean"==typeof e&&(e=Number(e));if(t<0||this.length<t||this.length<n)throw RangeError("Out of range index");if(n<=t)return this;if(t>>>=0,n=void 0===n?this.length:n>>>0,e||(e=0),"number"==typeof e)for(r=t;r<n;++r)this[r]=e;else{var o=s.isBuffer(e)?e:s.from(e,i),l=o.length;if(0===l)throw TypeError('The value "'+e+'" is invalid for argument "value"');for(r=0;r<n-t;++r)this[r+t]=o[r%l]}return this};var P=/[^+/0-9A-Za-z-_]/g;function E(e,t){t=t||1/0;for(var n,i=e.length,r=null,a=[],o=0;o<i;++o){if((n=e.charCodeAt(o))>55295&&n<57344){if(!r){if(n>56319||o+1===i){(t-=3)>-1&&a.push(239,191,189);continue}r=n;continue}if(n<56320){(t-=3)>-1&&a.push(239,191,189),r=n;continue}n=(r-55296<<10|n-56320)+65536}else r&&(t-=3)>-1&&a.push(239,191,189);if(r=null,n<128){if((t-=1)<0)break;a.push(n)}else if(n<2048){if((t-=2)<0)break;a.push(n>>6|192,63&n|128)}else if(n<65536){if((t-=3)<0)break;a.push(n>>12|224,n>>6&63|128,63&n|128)}else if(n<1114112){if((t-=4)<0)break;a.push(n>>18|240,n>>12&63|128,n>>6&63|128,63&n|128)}else throw Error("Invalid code point")}return a}function A(e){for(var t=[],n=0;n<e.length;++n)t.push(255&e.charCodeAt(n));return t}function w(e){return i.toByteArray(function(e){if((e=(e=e.split("=")[0]).trim().replace(P,"")).length<2)return"";for(;e.length%4!=0;)e+="=";return e}(e))}function T(e,t,n,i){for(var r=0;r<i&&!(r+n>=t.length)&&!(r>=e.length);++r)t[r+n]=e[r];return r}function R(e,t){return e instanceof t||null!=e&&null!=e.constructor&&null!=e.constructor.name&&e.constructor.name===t.name}var D=function(){for(var e="0123456789abcdef",t=Array(256),n=0;n<16;++n)for(var i=16*n,r=0;r<16;++r)t[i+r]=e[n]+e[r];return t}()},783:function(e,t){t.read=function(e,t,n,i,r){var a,o,s=8*r-i-1,l=(1<<s)-1,c=l>>1,u=-7,g=n?r-1:0,p=n?-1:1,d=e[t+g];for(g+=p,a=d&(1<<-u)-1,d>>=-u,u+=s;u>0;a=256*a+e[t+g],g+=p,u-=8);for(o=a&(1<<-u)-1,a>>=-u,u+=i;u>0;o=256*o+e[t+g],g+=p,u-=8);if(0===a)a=1-c;else{if(a===l)return o?NaN:1/0*(d?-1:1);o+=Math.pow(2,i),a-=c}return(d?-1:1)*o*Math.pow(2,a-i)},t.write=function(e,t,n,i,r,a){var o,s,l,c=8*a-r-1,u=(1<<c)-1,g=u>>1,p=5960464477539062e-23*(23===r),d=i?0:a-1,h=i?1:-1,m=+(t<0||0===t&&1/t<0);for(isNaN(t=Math.abs(t))||t===1/0?(s=+!!isNaN(t),o=u):(o=Math.floor(Math.log(t)/Math.LN2),t*(l=Math.pow(2,-o))<1&&(o--,l*=2),o+g>=1?t+=p/l:t+=p*Math.pow(2,1-g),t*l>=2&&(o++,l/=2),o+g>=u?(s=0,o=u):o+g>=1?(s=(t*l-1)*Math.pow(2,r),o+=g):(s=t*Math.pow(2,g-1)*Math.pow(2,r),o=0));r>=8;e[n+d]=255&s,d+=h,s/=256,r-=8);for(o=o<<r|s,c+=r;c>0;e[n+d]=255&o,d+=h,o/=256,c-=8);e[n+d-h]|=128*m}}},r={};function a(e){var t=r[e];if(void 0!==t)return t.exports;var n=r[e]={exports:{}},o=!0;try{i[e](n,n.exports,a),o=!1}finally{o&&delete r[e]}return n.exports}a.ab="/ROOT/node_modules/.pnpm/next@16.0.5_@babel+core@7.28.5_babel-plugin-react-compiler@1.0.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/buffer/",t.exports=a(72)},43771,e=>{"use strict";let t=`Software & IT
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
       └─ Space Safety Standards`;function n(e){let t=e.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/&/g," ").replace(/\+/g," plus ").replace(/\//g," ").replace(/[^a-z0-9]+/g,"-").replace(/-{2,}/g,"-").replace(/^-+|-+$/g,"");return t.length>0?t:"unknown"}function i(e,t,n){let i=n.get(e)??new Map;n.set(e,i);let r=(i.get(t)??0)+1;return i.set(t,r),1===r?t:`${t}-${r}`}let r=function(e=t){let r=[],a=new Map,o=[],s=[],l=new Map,c=null,u=null;for(let t of e.split(/\r?\n/)){let e=t.replace(/\s+$/,"");if(!e.trim())continue;let g=e.match(/[├└]─\s*(.+)$/);if(!g){let t=e.trim(),s=i("__root__",n(t),l),g={id:s,label:t,depth:0,children:[]};r.push(g),o.push(g),a.set(s,g),c=g,u=null;continue}let p=g[1].trim(),d=2>=Math.max(e.indexOf("├─"),e.indexOf("└─"))?1:2,h=1===d?c:u;if(!h)continue;let m=n(p),f=i(h.id,m,l),y=`${h.id}.${f}`,x={id:y,label:p,depth:d,parentId:h.id,children:[]};h.children.push(x),o.push(x),a.set(y,x),1===d&&(u=x),2===d&&s.push(x)}return{roots:r,byId:a,all:o,leaves:s}}();function a(e){let t=r.byId.get(e);if(!t)return null;let n=[t.id],i=t.parentId;for(;i;)n.push(i),i=r.byId.get(i)?.parentId;return n.reverse()}function o(e,t){let n;if(!e)return t?.unknownFallback??"";let i=(n=a(e))?n.map(e=>r.byId.get(e)?.label??e):null;return i?i.join(t?.separator??" › "):t?.unknownFallback??e}function s(e,t){return!t||"all"===t||!!e&&(e===t||e.startsWith(`${t}.`))}e.s(["JOB_TAXONOMY",0,r,"getJobCategoryDisplay",()=>o,"getJobCategoryPathIds",()=>a,"jobCategoryMatches",()=>s],43771)},52904,e=>{"use strict";var t=e.i(22047),n=e.i(29364),i=e.i(89138),r=e.i(31368),a=e.i(43771);function o(){let e=(0,i.useRouter)(),o=(0,i.useSearchParams)(),s="http://localhost:8080",[l,c]=(0,n.useState)([]),[u,g]=(0,n.useState)(!0),[p,d]=(0,n.useState)(null),[h,m]=(0,n.useState)(0),[f,y]=(0,n.useState)({deliverableType:o.get("type")||"",categoryId:o.get("categoryId")||"",engagementType:"",pricingModel:"",industry:"",skills:"",budgetMin:"",budgetMax:"",minYearsExperience:"",enterpriseOnly:!1}),x=l.filter(e=>{if(f.deliverableType&&e.deliverableType!==f.deliverableType||f.categoryId&&!(0,a.jobCategoryMatches)(e.categoryId,f.categoryId)||f.engagementType&&e.engagementType!==f.engagementType||f.budgetMin&&e.budgetMin<Number(f.budgetMin)||f.budgetMax&&e.budgetMax>Number(f.budgetMax)||f.minYearsExperience&&e.minYearsExperience<Number(f.minYearsExperience))return!1;if(f.skills){let t=f.skills.toLowerCase().split(",").map(e=>e.trim()).filter(Boolean);if(t.length&&!t.some(t=>e.requiredSkills.join(" ").toLowerCase().includes(t)))return!1}return!0}),v=x.reduce((e,t)=>e+(t.budgetMax||0),0),b=x.length?Math.round(v/x.length):0,S=x.filter(e=>"LONG_TERM_PARTNERSHIP"===e.engagementType).length,C=x.reduce((e,t)=>(e[t.engagementType]=(e[t.engagementType]||0)+1,e),{}),M=Object.values(C).reduce((e,t)=>e+t,0)||1;(0,n.useEffect)(()=>{P()},[h,f]);let P=async()=>{g(!0),d(null);let e={page:h,size:20};f.deliverableType&&(e.deliverableType=f.deliverableType),f.engagementType&&(e.engagementType=f.engagementType),f.pricingModel&&(e.pricingModel=f.pricingModel),f.industry&&(e.industry=f.industry),f.skills&&(e.skills=f.skills),f.budgetMin&&(e.budgetMin=f.budgetMin),f.budgetMax&&(e.budgetMax=f.budgetMax),f.minYearsExperience&&(e.minYearsExperience=f.minYearsExperience),f.enterpriseOnly&&(e.enterpriseOnly=f.enterpriseOnly);try{let t=await r.default.get("/api/v2/jobs/search",{params:e});c(t.data.content||t.data)}catch(t){try{let t=await r.default.get(`${s.replace(/\/$/,"")}/api/v2/jobs/search`,{params:e});c(t.data.content||t.data);return}catch(e){console.error("Direct backend fetch failed:",e)}console.error("Error fetching jobs:",t),d("Jobs service is unavailable right now. Check backend connectivity or API gateway.")}finally{g(!1)}},E=e=>{let{name:t,value:n}=e.target;y(e=>({...e,[t]:n})),m(0)};return(0,t.jsxs)("div",{className:"min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white",children:[(0,t.jsx)("header",{className:"border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950",children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-6 py-10",children:[(0,t.jsxs)("div",{className:"flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300",children:"Enterprise marketplace"}),(0,t.jsx)("h1",{className:"mt-3 text-4xl font-semibold",children:"Strategic opportunities for enterprise delivery"}),(0,t.jsx)("p",{className:"mt-3 max-w-2xl text-sm text-slate-300",children:"Curated, compliance-ready engagements with funded budgets, governance checkpoints, and cross-functional teams."})]}),(0,t.jsx)("button",{onClick:()=>e.push("/dashboard/jobs/new"),className:"inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400",children:"+ Post enterprise role"})]}),(0,t.jsx)("div",{className:"mt-8 grid gap-4 md:grid-cols-4",children:[{label:"Active briefs",value:x.length,hint:"Live enterprise briefs in queue"},{label:"Avg. budget",value:b?`$${b.toLocaleString()}`:"—",hint:"Average max budget"},{label:"Enterprise lanes",value:S,hint:"Long-term lanes in motion"},{label:"Cycle time (days)",value:x[0]?.slaDeliveryDays||30,hint:"Median SLA cycle"}].map(e=>(0,t.jsxs)("div",{className:"relative rounded-2xl border border-white/10 bg-white/5 p-4 kpi-card",children:[(0,t.jsx)("span",{className:"kpi-tooltip",children:e.hint}),(0,t.jsx)("p",{className:"text-xs text-slate-400",children:e.label}),(0,t.jsx)("p",{className:"mt-2 text-2xl font-semibold",children:e.value})]},e.label))})]})}),(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-6 py-10",children:[p&&(0,t.jsx)("div",{className:"mb-6 overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-teal-50 to-white px-5 py-4 text-sm text-emerald-900 shadow-[0_12px_30px_rgba(16,185,129,0.12)]",children:(0,t.jsxs)("div",{className:"flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700",children:"Connectivity"}),(0,t.jsx)("p",{className:"mt-1 text-sm text-emerald-900",children:p}),!s&&(0,t.jsx)("p",{className:"mt-2 text-xs font-semibold text-emerald-800",children:"Add `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080` in `frontend/.env.local` and restart the dev server."})]}),(0,t.jsx)("button",{onClick:P,className:"mt-3 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:mt-0",children:"Retry"})]})}),(0,t.jsxs)("div",{className:"grid gap-8 lg:grid-cols-[1.2fr_2fr]",children:[(0,t.jsxs)("section",{className:"rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.5)]",children:[(0,t.jsx)("h2",{className:"text-lg font-semibold",children:"Enterprise controls"}),(0,t.jsx)("p",{className:"mt-2 text-xs text-slate-400",children:"Filter by compliance tier, delivery lane, and governance needs."}),(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2",children:"Deliverable Type"}),(0,t.jsxs)("select",{name:"deliverableType",value:f.deliverableType,onChange:E,className:"w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40",children:[(0,t.jsx)("option",{value:"",children:"All Types"}),(0,t.jsx)("option",{value:"IMAGE_DESIGN",children:"Image & Design"}),(0,t.jsx)("option",{value:"VIDEO_PRODUCTION",children:"Video Production"}),(0,t.jsx)("option",{value:"AUDIO_PRODUCTION",children:"Audio Production"}),(0,t.jsx)("option",{value:"DOCUMENT_DEVELOPMENT",children:"Documents"}),(0,t.jsx)("option",{value:"MIXED",children:"Mixed Media"})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2",children:"Category"}),(0,t.jsxs)("select",{name:"categoryId",value:f.categoryId,onChange:E,className:"w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40",children:[(0,t.jsx)("option",{value:"",children:"All Categories"}),a.JOB_TAXONOMY.roots.map(e=>(0,t.jsx)("option",{value:e.id,children:e.label},e.id))]}),(0,t.jsx)("p",{className:"text-xs text-slate-500 mt-1",children:"Filters main categories (includes all subcategories)."})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2",children:"Engagement Type"}),(0,t.jsxs)("select",{name:"engagementType",value:f.engagementType,onChange:E,className:"w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40",children:[(0,t.jsx)("option",{value:"",children:"All Types"}),(0,t.jsx)("option",{value:"PROJECT_BASED",children:"Project-Based"}),(0,t.jsx)("option",{value:"CONTRACT",children:"Contract"}),(0,t.jsx)("option",{value:"LONG_TERM_PARTNERSHIP",children:"Long-Term"}),(0,t.jsx)("option",{value:"RETAINER",children:"Retainer"})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2",children:"Budget Range"}),(0,t.jsxs)("div",{className:"flex gap-2",children:[(0,t.jsx)("input",{type:"number",name:"budgetMin",placeholder:"Min",value:f.budgetMin,onChange:E,className:"flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"}),(0,t.jsx)("input",{type:"number",name:"budgetMax",placeholder:"Max",value:f.budgetMax,onChange:E,className:"flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2",children:"Min. Experience (years)"}),(0,t.jsx)("input",{type:"number",name:"minYearsExperience",value:f.minYearsExperience,onChange:E,className:"w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2",children:"Pricing Model"}),(0,t.jsxs)("select",{name:"pricingModel",value:f.pricingModel,onChange:E,className:"w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40",children:[(0,t.jsx)("option",{value:"",children:"All Models"}),(0,t.jsx)("option",{value:"FIXED_PRICE",children:"Fixed Price"}),(0,t.jsx)("option",{value:"HOURLY",children:"Hourly Rate"}),(0,t.jsx)("option",{value:"RETAINER",children:"Retainer"}),(0,t.jsx)("option",{value:"VOLUME_BASED",children:"Volume-Based"})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2",children:"Industry"}),(0,t.jsx)("input",{type:"text",name:"industry",placeholder:"e.g. saas,finance",value:f.industry,onChange:E,className:"w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"}),(0,t.jsx)("p",{className:"text-xs text-slate-500 mt-1",children:"Comma-separated"})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2",children:"Skills"}),(0,t.jsx)("input",{type:"text",name:"skills",placeholder:"e.g. photoshop,figma",value:f.skills,onChange:E,className:"w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"}),(0,t.jsx)("p",{className:"text-xs text-slate-500 mt-1",children:"Comma-separated"})]}),(0,t.jsx)("div",{children:(0,t.jsxs)("label",{className:"flex items-center gap-2 cursor-pointer",children:[(0,t.jsx)("input",{type:"checkbox",name:"enterpriseOnly",checked:f.enterpriseOnly,onChange:e=>y(t=>({...t,enterpriseOnly:e.target.checked})),className:"w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"}),(0,t.jsx)("span",{className:"text-sm font-medium text-slate-200",children:"Enterprise Only"})]})}),(0,t.jsx)("button",{onClick:()=>y({deliverableType:"",categoryId:"",engagementType:"",pricingModel:"",industry:"",skills:"",budgetMin:"",budgetMax:"",minYearsExperience:"",enterpriseOnly:!1}),className:"w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20",children:"Clear Filters"})]})]}),(0,t.jsxs)("section",{className:"space-y-6",children:[(0,t.jsxs)("div",{className:"grid gap-4 lg:grid-cols-[2fr_1fr]",children:[(0,t.jsxs)("div",{className:"rounded-3xl border border-white/10 bg-white/5 p-6",children:[(0,t.jsx)("h3",{className:"text-lg font-semibold",children:"Portfolio analyzer"}),(0,t.jsx)("p",{className:"mt-2 text-xs text-slate-400",children:"Engagement distribution and delivery readiness."}),(0,t.jsxs)("div",{className:"mt-6 grid gap-6 sm:grid-cols-2",children:[(0,t.jsxs)("div",{className:"rounded-2xl border border-white/10 bg-slate-950/60 p-4",children:[(0,t.jsx)("p",{className:"text-xs uppercase tracking-[0.2em] text-slate-400",children:"Engagement mix"}),(0,t.jsxs)("div",{className:"mt-4 flex items-center gap-4",children:[(0,t.jsxs)("svg",{viewBox:"0 0 120 120",className:"h-24 w-24",children:[(0,t.jsx)("circle",{cx:"60",cy:"60",r:"48",stroke:"rgba(255,255,255,0.08)",strokeWidth:"12",fill:"none"}),(0,t.jsx)("circle",{cx:"60",cy:"60",r:"48",stroke:"#34d399",strokeWidth:"12",fill:"none",strokeDasharray:`${S/M*301} 301`,strokeLinecap:"round",transform:"rotate(-90 60 60)"})]}),(0,t.jsxs)("div",{className:"space-y-1 text-xs text-slate-300",children:[(0,t.jsxs)("p",{children:["Long-term: ",S]}),(0,t.jsxs)("p",{children:["Project: ",C.PROJECT_BASED||0]}),(0,t.jsxs)("p",{children:["Contract: ",C.CONTRACT||0]})]})]})]}),(0,t.jsxs)("div",{className:"rounded-2xl border border-white/10 bg-slate-950/60 p-4",children:[(0,t.jsx)("p",{className:"text-xs uppercase tracking-[0.2em] text-slate-400",children:"Budget velocity"}),(0,t.jsx)("div",{className:"mt-4 space-y-3",children:[70,45,85,60].map((e,n)=>(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"flex items-center justify-between text-xs text-slate-400",children:[(0,t.jsxs)("span",{children:["Wave ",n+1]}),(0,t.jsxs)("span",{children:[e,"%"]})]}),(0,t.jsx)("div",{className:"h-2 rounded-full bg-white/10",children:(0,t.jsx)("div",{className:"h-2 rounded-full bg-emerald-400",style:{width:`${e}%`}})})]},n))})]})]})]}),(0,t.jsxs)("div",{className:"rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-500/20 to-slate-950/70 p-6",children:[(0,t.jsx)("h3",{className:"text-lg font-semibold",children:"Enterprise insights"}),(0,t.jsxs)("ul",{className:"mt-4 space-y-3 text-sm text-slate-200",children:[(0,t.jsx)("li",{children:"Compliance-ready briefs with signed SLAs."}),(0,t.jsx)("li",{children:"Vendor coverage across 12 delivery lanes."}),(0,t.jsx)("li",{children:"Budget governance with automated approvals."}),(0,t.jsx)("li",{children:"Realtime health scoring and risk flags."})]})]})]}),(0,t.jsxs)("div",{className:"rounded-3xl border border-white/10 bg-white/5 p-6",children:[(0,t.jsxs)("div",{className:"flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-xl font-semibold",children:"Live marketplace briefs"}),(0,t.jsx)("p",{className:"text-xs text-slate-400",children:"Pulled from the backend in real time."})]}),(0,t.jsxs)("span",{className:"text-xs text-emerald-300",children:[x.length," roles ready"]})]}),u?(0,t.jsx)("div",{className:"mt-6 text-sm text-slate-400",children:"Loading jobs..."}):0===x.length?(0,t.jsx)("div",{className:"mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-300",children:"No live jobs match your filters."}):null,(0,t.jsx)("div",{className:"mt-6 grid gap-4",children:x.map(n=>{let i=n.categoryId?(0,a.getJobCategoryDisplay)(n.categoryId,{unknownFallback:n.categoryId,separator:" › "}):null;return(0,t.jsx)("div",{onClick:()=>e.push(`/jobs/${n.id}`),className:"group cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-emerald-400/40 hover:bg-slate-900/80",children:(0,t.jsxs)("div",{className:"flex flex-wrap items-center justify-between gap-4",children:[(0,t.jsxs)("div",{className:"flex-1",children:[(0,t.jsx)("p",{className:"text-xs uppercase tracking-[0.2em] text-slate-400",children:n.deliverableType.replace(/_/g," ")}),(0,t.jsx)("h4",{className:"mt-2 text-lg font-semibold",children:n.title}),(0,t.jsx)("p",{className:"mt-2 text-sm text-slate-300 line-clamp-2",children:n.description}),(0,t.jsxs)("div",{className:"mt-3 flex flex-wrap gap-2",children:[i?(0,t.jsx)("span",{title:i,className:"inline-block max-w-[240px] truncate rounded-full bg-sky-500/10 px-3 py-1 text-xs text-sky-200",children:i}):null,(0,t.jsx)("span",{className:"rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300",children:n.engagementType.replace(/_/g," ")}),(0,t.jsxs)("span",{className:"rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-200",children:["$",n.budgetMin?.toLocaleString()," - $",n.budgetMax?.toLocaleString()," ",n.currency]}),(0,t.jsxs)("span",{className:"rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-200",children:[n.slaDeliveryDays," day SLA"]})]}),n.requiredSkills?.length?(0,t.jsx)("div",{className:"mt-3 flex flex-wrap gap-2",children:n.requiredSkills.slice(0,4).map(e=>(0,t.jsx)("span",{className:"rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300",children:e},e))}):null]}),(0,t.jsxs)("div",{className:"flex flex-col items-end gap-3",children:[(0,t.jsx)("span",{className:"rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200",children:n.status||"OPEN"}),(0,t.jsxs)("span",{className:"text-xs text-slate-400",children:["Posted ",new Date(n.createdAt).toLocaleDateString()]})]})]})},n.id)})})]}),x.length>0&&(0,t.jsxs)("div",{className:"flex justify-center gap-4",children:[(0,t.jsx)("button",{onClick:()=>m(Math.max(0,h-1)),disabled:0===h,className:"rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200 disabled:opacity-40",children:"Previous"}),(0,t.jsxs)("span",{className:"px-4 py-2 text-xs text-slate-400",children:["Page ",h+1]}),(0,t.jsx)("button",{onClick:()=>m(h+1),className:"rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200",children:"Next"})]})]})]})]})]})}e.s(["default",()=>o])}]);