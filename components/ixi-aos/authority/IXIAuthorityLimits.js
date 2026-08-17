const num=value=>{const n=Number(value);return Number.isFinite(n)?n:null;};
export function evaluateIXIAuthorityLimits({limits={},amount=null}={}){const maxAmount=num(limits?.maxAmount),requested=num(amount);if(maxAmount!==null&&requested!==null&&requested>maxAmount)return{allowed:false,reason:"amount-limit-exceeded",maxAmount,requestedAmount:requested};return{allowed:true,reason:"within-limits",maxAmount,requestedAmount:requested};}
export default{evaluateIXIAuthorityLimits};
