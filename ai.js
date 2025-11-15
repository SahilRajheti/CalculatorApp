// AI helper & natural language parser
const AIParser = (function(){

  // parse simple queries: "what is 25% of 300", "convert 5 kg to lb", "factorial of 5", "what is 5 plus 7"
  function handleNaturalQuery(text){
    text = text.toLowerCase().trim();

    // direct math expressions (contains digits and operators) -> evaluate
    if(/^[0-9\.\s\+\-\*\/\^\%\(\)]+$/.test(text.replaceAll(' ',''))){
      try{ return eval(text.replaceAll('^','**')); } catch(e){ return null; }
    }

    // percent of: "what is 25% of 300"
    let m = text.match(/([\d\.]+)\s*%\s* of\s*([\d\.]+)/);
    if(m){ const a = parseFloat(m[1]), b = parseFloat(m[2]); return (a/100)*b; }

    // "what is 25 percent of 300"
    m = text.match(/([\d\.]+)\s*(percent|%)\s*of\s*([\d\.]+)/);
    if(m){ return (parseFloat(m[1])/100)*parseFloat(m[3]); }

    // convert units e.g. "convert 5 kg to lb" or "5 kg to lb"
    m = text.match(/(\d+(\.\d+)?)\s*(kg|kilogram|lb|pound|cm|mm|m|inch|in|c|f|°c|°f)\s*(to|into)\s*(kg|kilogram|lb|pound|cm|mm|m|inch|in|c|f|°c|°f)/);
    if(m){
      const val = parseFloat(m[1]);
      const from = shortUnit(m[3]);
      const to = shortUnit(m[5]);
      if(from && to){
        // use the same simple converters as script.js
        const res = convertUnitSimple(val,from,to);
        return res;
      }
    }

    // basic english math: "what is 5 plus 7"
    m = text.match(/what is\s+([\d\.]+)\s+(plus|minus|times|multiplied by|divided by|over|mod|%|power of|to the power of)\s+([\d\.]+)/);
    if(m){
      const a = parseFloat(m[1]), op = m[2], b = parseFloat(m[3]);
      if(/plus/.test(op)) return a+b;
      if(/minus/.test(op)) return a-b;
      if(/times|multiplied/.test(op)) return a*b;
      if(/divided|over/.test(op)) return a/b;
      if(/power/.test(op)) return Math.pow(a,b);
    }

    // factorial: "factorial of 5" or "5!"
    m = text.match(/factorial of\s+(\d+)/);
    if(m){ const n = parseInt(m[1]); return factorial(n); }
    m = text.match(/(\d+)!/);
    if(m){ return factorial(parseInt(m[1])); }

    // fallback: try evaluate expression inside text
    m = text.match(/([-0-9\.\+\-\*\/\^\(\) ]+)/);
    if(m){
      try{ return eval(m[1].replaceAll('^','**')); } catch(e){}
    }

    return null;
  }

  // small helpers
  function shortUnit(s){
    s = s.replace('°','').toLowerCase();
    if(/kg|kilogram/.test(s)) return 'kg';
    if(/lb|pound/.test(s)) return 'lb';
    if(/cm/.test(s)) return 'cm';
    if(/m\b/.test(s)) return 'm';
    if(/in|inch/.test(s)) return 'in';
    if(/c\b/.test(s)) return 'c';
    if(/f\b/.test(s)) return 'f';
    return null;
  }
  function convertUnitSimple(val, from, to){
    const map = {
      kg: v=>v, lb: v=>v*0.45359237,
      m: v=>v, cm: v=>v/100, in: v=>v*0.0254,
    };
    if(from === to) return val;
    if(['c','f'].includes(from) || ['c','f'].includes(to)){
      // temperature
      if(from==='c' && to==='f') return (val*9/5)+32;
      if(from==='f' && to==='c') return (val-32)*5/9;
      return null;
    }
    if(map[from] && map[to]){
      const base = map[from](val);
      // convert base (meters or kilograms) to target
      // invert map[to] for base -> target
      const invTo = {
        kg: v=>v, lb: v=>v/0.45359237,
        m: v=>v, cm: v=>v*100, in: v=>v/0.0254
      };
      return invTo[to](base);
    }
    return null;
  }

  function factorial(n){ if(n<0) return NaN; let r=1; for(let i=2;i<=n;i++) r*=i; return r; }

  /* Optional OpenAI call:
     To use this, create a small file (not committed) with your key,
     or paste your key inside the function below. This is optional.
     WARNING: storing keys in client-side JS is unsafe for production.
  */
  async function queryOpenAI(prompt){
    // The user must set window.OPENAI_API_KEY before calling this (not provided by default)
    if(!window.OPENAI_API_KEY) throw new Error('OpenAI key not set. Set window.OPENAI_API_KEY before calling.');
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
      model: 'gpt-4o-mini', messages:[{role:'user', content: prompt}], temperature:0.2, max_tokens:300
    };
    const res = await fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + window.OPENAI_API_KEY },
      body: JSON.stringify(body)
    });
    const j = await res.json();
    if(j.error) throw new Error(JSON.stringify(j.error));
    const txt = j.choices?.[0]?.message?.content;
    return txt ?? 'No response';
  }

  return { handleNaturalQuery, queryOpenAI };
})();
