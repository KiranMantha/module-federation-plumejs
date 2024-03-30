import{importShared as u}from"./__federation_fn_import-Ch4q89Gh.js";var n=Object.defineProperty,m=Object.getOwnPropertyDescriptor,_=(e,r,o)=>r in e?n(e,r,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[r]=o,f=(e,r,o,l)=>{for(var t=l>1?void 0:l?m(r,o):r,s=e.length-1,p;s>=0;s--)(p=e[s])&&(t=(l?p(r,o,t):p(t))||t);return l&&t&&n(r,o,t),t},c=(e,r,o)=>(_(e,typeof r!="symbol"?r+"":r,o),o);const{Component:d,html:a}=await u("@plumejs/core");let i=class{todos=[];render(){return a`
      <ul>
        ${this.todos.map(e=>a`<li>${e}</li>`)}
      </ul>
    `}};c(i,"observedProperties",["todos"]);i=f([d({selector:"app-todo-list"})],i);export{i as TodoList};
