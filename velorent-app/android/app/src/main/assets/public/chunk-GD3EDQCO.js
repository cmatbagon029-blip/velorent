import{a as w}from"./chunk-LCH4KXAK.js";import"./chunk-NUHOWZQU.js";import{$ as m,A as g,Eb as b,H as u,O as f,Sb as p,k as l,t as a,ua as h,y as c,z as d}from"./chunk-2AVOPVJ6.js";import"./chunk-6TEYLYMN.js";import"./chunk-QUJFQN2Y.js";import"./chunk-MQ34CZDB.js";import"./chunk-3HFMG4JC.js";import"./chunk-GNKKXBWB.js";import"./chunk-ALHFSM7F.js";import"./chunk-6EIW3MWH.js";import"./chunk-V2LICYYN.js";import"./chunk-J3KPDA35.js";import"./chunk-HQYYVS42.js";import"./chunk-E6DTWWEQ.js";import"./chunk-SYUL6SJY.js";import"./chunk-RFVCZTOC.js";import"./chunk-DI7UCLSP.js";import"./chunk-3IVKBF6N.js";import"./chunk-FXFZIWDD.js";import"./chunk-BGL2RXYC.js";import"./chunk-42C7ZIID.js";import"./chunk-C5RQ2IC2.js";import"./chunk-4FNGVWOR.js";import"./chunk-F7H4DQG2.js";import"./chunk-LBMIQEU6.js";import"./chunk-WI5MSH4N.js";import"./chunk-EGZPES6R.js";import"./chunk-CKP3SGE2.js";import"./chunk-BGDP6BPN.js";import{a as s,g as i}from"./chunk-2K7NMRC4.js";var S=(()=>{let n=class n{constructor(o,e){this.route=o,this.oauthCallbackService=e}ngOnInit(){this.route.queryParams.subscribe(o=>{let e=o.code,t=o.error,v=o.state;console.log("Facebook callback params:",o),t?(console.error("Facebook OAuth error:",t),this.sendMessageToParent("FACEBOOK_AUTH_ERROR",{error:t})):e&&v==="facebook_auth"?(console.log("Facebook OAuth code received:",e),this.exchangeCodeForUserInfo(e)):(console.log("No code or invalid state received"),this.sendMessageToParent("FACEBOOK_AUTH_ERROR",{error:"No authorization code received"}))})}exchangeCodeForUserInfo(o){return i(this,null,function*(){try{console.log("Exchanging Facebook OAuth code for user info:",o);let e=yield this.getUserInfoFromCode(o);console.log("User info retrieved:",e),yield this.oauthCallbackService.handleOAuthCallback(e),console.log("OAuth callback handled successfully with backend"),this.sendMessageToParent("FACEBOOK_AUTH_SUCCESS",{user:e});let t=this.getReturnUrl();console.log("Redirecting to:",t),window.location.href=t}catch(e){console.error("Error in exchangeCodeForUserInfo:",e);let t=e instanceof Error?e.message:"Unknown error occurred";this.sendMessageToParent("FACEBOOK_AUTH_ERROR",{error:t}),window.location.href="/login?error="+encodeURIComponent(t)}})}getReturnUrl(){let o=localStorage.getItem("returnUrl")||"/dashboard";return localStorage.removeItem("returnUrl"),o}showSuccessMessage(){document.body.innerHTML=`
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #0f0f23, #1a1a2e, #16213e, #0f3460);
        color: #ffd700;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div style="
          background: rgba(24, 24, 24, 0.95);
          padding: 2rem;
          border-radius: 20px;
          border: 2px solid #ffd700;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
        ">
          <div style="font-size: 3rem; margin-bottom: 1rem;">\u2705</div>
          <h2 style="color: #ffd700; margin-bottom: 1rem;">Login Successful!</h2>
          <p style="color: #e0e0e0; margin-bottom: 1.5rem;">This window will close automatically in <span id="countdown">2</span> seconds...</p>
          <p style="color: #b0b0b0; font-size: 0.9rem;">You will be redirected to the main page.</p>
        </div>
      </div>
    `;let o=2,e=document.getElementById("countdown"),t=setInterval(()=>{o--,e&&(e.textContent=o.toString()),o<=0&&clearInterval(t)},1e3)}getUserInfoFromCode(o){return i(this,null,function*(){return{id:"facebook_user_"+Date.now(),email:"user@facebook.com",name:"Facebook User",picture:"https://via.placeholder.com/150",provider:"facebook",created_at:new Date().toISOString()}})}sendMessageToParent(o,e){console.log("Sending message to parent:",{type:o,data:e}),window.facebookAuthResolve&&window.facebookAuthReject?o==="FACEBOOK_AUTH_SUCCESS"?(console.log("Resolving Facebook auth with user data"),window.facebookAuthResolve(e.user)):o==="FACEBOOK_AUTH_ERROR"&&(console.log("Rejecting Facebook auth with error"),window.facebookAuthReject(new Error(e.error))):window.opener?(window.opener.postMessage(s({type:o},e),window.location.origin),console.log("Message sent to parent window")):console.error("No parent window found and no stored auth functions")}};n.\u0275fac=function(e){return new(e||n)(a(h),a(w))},n.\u0275cmp=l({type:n,selectors:[["app-facebook-callback"]],standalone:!0,features:[f],decls:5,vars:0,consts:[[1,"callback-container"],[1,"callback-content"],["name","crescent"]],template:function(e,t){e&1&&(c(0,"div",0)(1,"div",1),g(2,"ion-spinner",2),c(3,"p"),u(4,"Processing Facebook authentication..."),d()()())},dependencies:[m,p,b],styles:[".callback-container[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;height:100vh;background:linear-gradient(135deg,#0f0f23,#1a1a2e,#16213e,#0f3460)}.callback-content[_ngcontent-%COMP%]{text-align:center;color:gold}ion-spinner[_ngcontent-%COMP%]{margin-bottom:1rem}"]});let r=n;return r})();export{S as FacebookCallbackComponent};
