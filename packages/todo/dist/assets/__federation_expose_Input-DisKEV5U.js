import{importShared as m}from"./__federation_fn_import-Ch4q89Gh.js";var u=Object.defineProperty,i=Object.getOwnPropertyDescriptor,d=(t,r,n,o)=>{for(var e=o>1?void 0:o?i(r,n):r,s=t.length-1,a;s>=0;s--)(a=t[s])&&(e=(o?a(r,n,e):a(e))||e);return o&&e&&u(r,n,e),e};const{Component:l,Renderer:f,html:v}=await m("@plumejs/core");let p=class{constructor(t){this.renderer=t}value="";handleSubmit(t){t.preventDefault();const r=new FormData(t.target);this.renderer.emitEvent("submit",{todo:r.get("todo")}),t.target.reset()}render(){return v`
      <form
        onsubmit=${t=>{this.handleSubmit(t)}}
      >
        <div className="flex-row">
          <input type="text" name="todo" />
          <button type="submit">Add</button>
        </div>
      </form>
    `}};p=d([l({selector:"app-todo-input",deps:[f]})],p);export{p as TodoInput};
