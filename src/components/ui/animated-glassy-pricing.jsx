import React, { useRef, useEffect, useState } from 'react';
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";

// ─── Internal: check icon ────────────────────────────────────────────────────
const CheckIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// ─── Internal: WebGL animated background ────────────────────────────────────
const ShaderCanvas = () => {
  const canvasRef = useRef(null);
  const glProgramRef = useRef(null);
  const glBgColorLocationRef = useRef(null);
  const glRef = useRef(null);
  const [backgroundColor, setBackgroundColor] = useState([0, 0, 0]);

  // Always dark background for GoGlobal
  useEffect(() => {
    setBackgroundColor([0, 0, 0]);
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    const program = glProgramRef.current;
    const location = glBgColorLocationRef.current;
    if (gl && program && location) {
      gl.useProgram(program);
      gl.uniform3fv(location, new Float32Array(backgroundColor));
    }
  }, [backgroundColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;

    const vertexShaderSource = `attribute vec2 aPosition; void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;
    // Tuned colours: rose accent (#FF2D55) tones instead of default rainbow
    const fragmentShaderSource = `
      precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec3 uBackgroundColor;
      mat2 rotate2d(float angle){ float c=cos(angle),s=sin(angle); return mat2(c,-s,s,c); }
      float variation(vec2 v1,vec2 v2,float strength,float speed){ return sin(dot(normalize(v1),normalize(v2))*strength+iTime*speed)/100.0; }
      vec3 paintCircle(vec2 uv,vec2 center,float rad,float width){
        vec2 diff = center-uv;
        float len = length(diff);
        len += variation(diff,vec2(0.,1.),5.,2.);
        len -= variation(diff,vec2(1.,0.),5.,2.);
        float circle = smoothstep(rad-width,rad,len)-smoothstep(rad,rad+width,len);
        return vec3(circle);
      }
      void main(){
        vec2 uv = gl_FragCoord.xy/iResolution.xy;
        uv.x *= 1.5; uv.x -= 0.25;
        float mask = 0.0;
        float radius = .35;
        vec2 center = vec2(.5);
        mask += paintCircle(uv,center,radius,.035).r;
        mask += paintCircle(uv,center,radius-.018,.01).r;
        mask += paintCircle(uv,center,radius+.018,.005).r;
        vec2 v=rotate2d(iTime)*uv;
        // Rose-gold tones: warm reds/golds instead of rainbow
        vec3 foregroundColor=vec3(0.7+v.x*0.3, 0.15+v.y*0.1, 0.2-v.y*v.x*0.1);
        vec3 color=mix(uBackgroundColor,foregroundColor,mask*0.6);
        color=mix(color,vec3(0.85,0.16,0.33),paintCircle(uv,center,radius,.003).r);
        gl_FragColor=vec4(color,1.);
      }`;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);
    gl.useProgram(program);
    glProgramRef.current = program;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const iResLoc = gl.getUniformLocation(program, 'iResolution');
    glBgColorLocationRef.current = gl.getUniformLocation(program, 'uBackgroundColor');
    gl.uniform3fv(glBgColorLocationRef.current, new Float32Array([0, 0, 0]));

    let animationFrameId;
    const render = (time) => {
      gl.uniform1f(iTimeLoc, time * 0.001);
      gl.uniform2f(iResLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full block z-0" style={{ background: '#000000' }} />;
};

// ─── Exported: PricingCard ───────────────────────────────────────────────────
export const PricingCard = ({
  planName,
  description,
  price,
  priceSuffix = '/mo',
  features,
  limitations = [],
  buttonText,
  onButtonClick,
  isPopular = false,
  badge,
}) => {
  const cardBase = `
    relative
    backdrop-blur-[14px]
    bg-gradient-to-br from-white/5 to-white/[0.02]
    border border-white/10
    rounded-3xl shadow-2xl
    flex-1 max-w-xs px-7 py-8 flex flex-col
    transition-all duration-300
    ${isPopular
      ? 'scale-105 ring-1 ring-[#FF2D55]/40 from-white/10 to-white/5 border-[#FF2D55]/30 shadow-[0_0_40px_rgba(255,45,85,0.12)]'
      : 'hover:border-white/20'
    }
  `;

  const ctaClass = isPopular
    ? `mt-auto w-full py-3 rounded-full font-semibold text-sm transition-all duration-200
       bg-[#FF2D55] hover:bg-[#ff4d6d] text-white`
    : `mt-auto w-full py-3 rounded-full font-semibold text-sm transition-all duration-200
       bg-white/8 hover:bg-white/14 text-white border border-white/20`;

  return (
    <div className={cardBase.trim()}>
      {(isPopular || badge) && (
        <div className="absolute -top-4 right-5 px-3 py-1 text-[11px] font-semibold rounded-full bg-[#FF2D55] text-white tracking-wide uppercase">
          {badge || 'Most Popular'}
        </div>
      )}

      {/* Plan name */}
      <div className="mb-3">
        <h2 className="text-4xl font-light tracking-tight text-white" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
          {planName}
        </h2>
        <p className="text-sm text-white/60 mt-1.5 leading-relaxed" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {description}
        </p>
      </div>

      {/* Price */}
      <div className="my-6 flex items-baseline gap-1.5">
        <span className="text-5xl font-extralight text-white" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
          {price === '0' ? 'Free' : `$${price}`}
        </span>
        {price !== '0' && (
          <span className="text-sm text-white/50" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {priceSuffix}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-full mb-5 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      {/* Features */}
      <ul className="flex flex-col gap-2.5 text-sm text-white/85 mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <CheckIcon className="text-[#FF2D55] w-4 h-4 mt-0.5 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      {/* Limitations */}
      {limitations.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm text-white/35 mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {limitations.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center text-white/25">—</span>
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="flex-1" />

      <RippleButton
        className={ctaClass.trim()}
        rippleColor="rgba(255,255,255,0.25)"
        onClick={onButtonClick}
      >
        {buttonText}
      </RippleButton>
    </div>
  );
};

// ─── Exported: ModernPricingPage ─────────────────────────────────────────────
export const ModernPricingPage = ({
  title,
  subtitle,
  plans,
  showAnimatedBackground = true,
}) => {
  return (
    <div className="bg-black text-white min-h-screen w-full overflow-x-hidden">
      {showAnimatedBackground && <ShaderCanvas />}
      <main className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 py-16">

        {/* Header */}
        <div className="w-full max-w-3xl mx-auto text-center mb-16">
          <h1
            className="text-5xl md:text-6xl font-light leading-tight tracking-tight text-white"
            style={{ fontFamily: 'Syne, system-ui, sans-serif' }}
          >
            {title}
          </h1>
          <p
            className="mt-4 text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            {subtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-5 justify-center items-center md:items-stretch w-full max-w-4xl">
          {plans.map((plan) => (
            <PricingCard key={plan.planName} {...plan} />
          ))}
        </div>

        {/* Fine print */}
        <p
          className="mt-12 text-xs text-white/30 text-center"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Cancel anytime. No hidden fees. Stripe-secured payments.
        </p>
      </main>
    </div>
  );
};
