import{_ as h}from"./preload-helper-Dch09mLN.js";const i=new Set(["Module","__esModule","default","_export_sfc"]);let c={"./List":()=>(l([],!1,"./List"),f("./__federation_expose_List-Ba3m7IVK.js").then(e=>Object.keys(e).every(t=>i.has(t))?()=>e.default:()=>e)),"./Input":()=>(l([],!1,"./Input"),f("./__federation_expose_Input-DisKEV5U.js").then(e=>Object.keys(e).every(t=>i.has(t))?()=>e.default:()=>e))};const d={},l=(e,t,_)=>{const o=import.meta.url;if(typeof o>"u"){console.warn('The remote style takes effect only when the build.target option in the vite.config.ts file is higher than that of "es2020".');return}const a=o.substring(0,o.lastIndexOf("remoteEntry.js"));e.forEach(r=>{const n=a+r;if(!(n in d))if(d[n]=!0,t){const s="css__todo-components__"+_;window[s]==null&&(window[s]=[]),window[s].push(n)}else{const s=document.head.appendChild(document.createElement("link"));s.href=n,s.rel="stylesheet"}})};async function f(e){return h(()=>import(e),[],import.meta.url)}const p=e=>{if(!c[e])throw new Error("Can not find remote module "+e);return c[e]()},m=e=>{globalThis.__federation_shared__=globalThis.__federation_shared__||{},Object.entries(e).forEach(([t,_])=>{const o=Object.keys(_)[0],a=Object.values(_)[0],r=a.scope||"default";globalThis.__federation_shared__[r]=globalThis.__federation_shared__[r]||{};const n=globalThis.__federation_shared__[r];(n[t]=n[t]||{})[o]=a})};export{l as dynamicLoadingCss,p as get,m as init};