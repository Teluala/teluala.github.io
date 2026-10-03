import{a as A,b as _,c as j,d as J,e as Q,f as ee,g as te,i as re,k as oe,l as I,m as G,n as ae,o as ie,p as se,q as ne,r as ue}from"./chunk-CB4B6EZA.js";/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */var F=class extends ae{constructor(e){super("raster",e,{name:"raster",sortKey:50})}};function N(t){if(!t)throw new TypeError("raster layer options are required");return new F(t)}function ce(t,e={}){return oe(t,{minZoom:e.minZoom??2,maxZoom:e.maxZoom??18,tileSize:e.tileSize,maxTiles:e.maxTiles??160})}var L=t=>t.reason??new DOMException("Aborted","AbortError");/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */function b(t){return`${t.z}/${t.x}/${t.y}`}function le(t){let e=2**t.z,o=u=>Math.atan(Math.sinh(Math.PI*(1-2*u/e)))*180/Math.PI;return{west:t.x/e*360-180,east:(t.x+1)/e*360-180,north:o(t.y),south:o(t.y+1)}}function W(t,e){let o=2**(t.z-e);return{z:e,x:Math.floor(t.x/o),y:Math.floor(t.y/o)}}function D(t){return t?.status==="ready"&&t.response!==void 0}function we(t){return[0,1,2,3].map(e=>({z:t.z+1,x:t.x*2+(e&1),y:t.y*2+(e>>1)}))}function he(t,e){let o=2**(t.z-e.z),u=t.x-e.x*o,c=t.y-e.y*o;return{west:u/o,north:c/o,east:(u+1)/o,south:(c+1)/o}}function O(t){return t instanceof DOMException?t.name==="AbortError":!!(t&&typeof t=="object"&&"name"in t&&t.name==="AbortError")}var fe={tiles:[],coverage:[],wanted:new Map,signature:""};function be(t,e,o){let u=new Map,c=new Map,n=i=>{let r=c.get(i.z);r||c.set(i.z,r=new Map),r.set(b(i),i)};for(let i of t){if(n(i),i.z<=o)continue;let r=W(i,o);u.set(b(r),r);for(let s=o;s<i.z;s++)n(W(i,s))}let a=new Map;for(let i of[...c.keys()].sort((r,s)=>r-s))for(let[r,s]of c.get(i))a.set(r,s);return{tiles:[...t],coverage:[...u.values()],wanted:a,signature:e}}function ve(t,e){return e.aborted?Promise.reject(L(e)):new Promise((o,u)=>{let c=setTimeout(()=>{e.removeEventListener("abort",n),o()},Math.max(0,t)),n=()=>{clearTimeout(c),u(L(e))};e.addEventListener("abort",n,{once:!0})})}function V(t){if(!t?.source||typeof t.source.getTile!="function")throw new TypeError("raster source.getTile is required");if(t.groundSurface&&(typeof t.groundSurface.heightAt!="function"||typeof t.groundSurface.fetchHeights!="function"||typeof t.groundSurface.attribution!="function"))throw new TypeError("groundSurface.heightAt, groundSurface.fetchHeights, and groundSurface.attribution are required");let e={minZoom:t.minZoom,maxZoom:t.maxZoom,tileSize:t.tileSize,maxTiles:t.maxTiles},o=t.maxTiles??160,u=t.maxCacheTiles??320,c=t.fallbackMinZoom??t.minZoom??2,n=t.retries??2;if(!Number.isInteger(u)||u<o)throw new RangeError("maxCacheTiles must be an integer not smaller than maxTiles");if(!Number.isInteger(c)||c<0||c>30)throw new RangeError("fallbackMinZoom must be an integer within 0..30");if(!Number.isInteger(n)||n<0)throw new RangeError("retries must be a non-negative integer");if(t.retryDelay!==void 0&&typeof t.retryDelay!="function")throw new TypeError("retryDelay must be a function");if(t.shouldRetry!==void 0&&typeof t.shouldRetry!="function")throw new TypeError("shouldRetry must be a function");let a=new I({limit:u}),i=null,r=!1,s=0,m=0,h=0,v=0,w=0,E=0,x=fe,z=!0,R=0,B=f=>{f.status==="loading"&&!f.abort.signal.aborted&&w++,f.abort.abort(),f.response?.image.close()},P=f=>{let p=b(f),y={tile:f,abort:new AbortController,status:"loading"};a.set(p,y),s++;let S=async()=>{let d=0;for(;;){d++,m++;try{return await t.source.getTile(f.z,f.x,f.y,{signal:y.abort.signal})}catch(T){if(y.abort.signal.aborted||O(T))throw T;let C=t.shouldRetry?.(T)??se(T);if(d>n||!C)throw T;h++;let l=t.retryDelay?.(d,T)??ne(d,T);await ve(l,y.abort.signal)}}},k=t.groundSurface?t.groundSurface.fetchHeights(f.z,f.x,f.y).catch(d=>{!r&&a.peek(p)===y&&!O(d)&&t.onError?.(d instanceof Error?d:new Error(String(d)))}):Promise.resolve(void 0);Promise.all([S(),k]).then(([d,T])=>{if(r||a.peek(p)!==y){d?.image.close();return}y.response=d,y.height=T,y.status=d?"ready":"missing",z=!0,i?.invalidate()}).catch(d=>{if(!(r||a.peek(p)!==y)){if(O(d)){w++,a.delete(p);return}y.status="error",z=!0,v++,t.onError?.(d instanceof Error?d:new Error(String(d))),i?.invalidate()}})};return{init(f){if(r)throw new Error("raster controller is destroyed");if(i)throw new Error("raster controller is already initialized");i=f},update(f){if(r)throw new Error("raster controller is destroyed");if(!i)throw new Error("raster controller is not initialized");let p=t.selectTiles?.(f)??ce(f,e),y=p.map(b).join(",");if(y!==x.signature){x=be(p,y,c),z=!0;for(let[l,g]of a)!x.wanted.has(l)&&g.status==="loading"&&(B(g),a.delete(l));for(let[l,g]of x.wanted)a.get(l)||P(g);for(let[,l]of a.prune(g=>x.wanted.has(g)))B(l),E++}if(!z)return{};let S=[];R=0;let k=new Set(x.coverage.map(b)),d=(l,g,M)=>{a.get(b(l.tile)),S.push({key:b(g),sourceKey:b(l.tile),tile:g,sourceTile:l.tile,image:l.response.image,height:l.height,bounds:le(g),uv:he(g,l.tile)}),l.tile.z!==M.z&&R++},T=(l,g)=>{let M=a.peek(b(l));if(D(M)){d(M,l,g);return}let H=we(l);if(H.some(U=>D(a.peek(b(U))))){for(let U of H)T(U,g);return}for(let U=l.z-1;U>=c;U--){let Y=W(l,U);if(U===c&&k.has(b(Y))){R++;return}let $=a.peek(b(Y));if(D($)){d($,l,g);return}}};for(let l of x.tiles)T(l,l);let C=new Set(x.tiles.map(b));for(let l of x.coverage){let g=b(l);if(C.has(g))continue;let M=a.peek(g);M?.status!=="ready"||!M.response||(a.get(g),S.push({key:`coverage:${g}`,sourceKey:g,tile:l,sourceTile:l,image:M.response.image,height:M.height,bounds:le(l),uv:he(l,l)}))}return z=!1,{entries:S}},attribution(){return[...new Set([...t.attribution??[],...t.groundSurface?.attribution()??[]])]},snapshot(){let f=[...a.values()];return{requested:s,attempts:m,retried:h,selected:x.tiles.length,fallbacks:R,loading:f.filter(p=>p.status==="loading").length,ready:f.filter(p=>p.status==="ready").length,missing:f.filter(p=>p.status==="missing").length,failed:v,aborted:w,evicted:E}},destroy(){if(!r){r=!0;for(let f of a.values())B(f);a.clear(),x=fe,t.source.destroy?.(),i=null}}}}/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */function X(t){if(!t||typeof t.url!="string"||!["{z}","{x}","{y}"].every(u=>t.url.includes(u)))throw new TypeError("XYZ URL must contain {z}, {x}, and {y}");let e=t.fetch??globalThis.fetch?.bind(globalThis);if(!e)throw new Error("fetch is not available");let o=t.decodeImage??(typeof createImageBitmap=="function"?createImageBitmap.bind(globalThis):void 0);if(!o)throw new Error("createImageBitmap is not available");return{async getTile(u,c,n,{signal:a}){if(re(u,c,n),a.aborted)throw L(a);let i=t.url.replace("{z}",String(u)).replace("{x}",String(c)).replace("{y}",String(n)),r=await e(i,{signal:a});if(r.status===404||r.status===204)return;if(!r.ok)throw new ie(r.status,i,r.headers.get("retry-after")??void 0);return{image:await o(await r.blob()),cacheControl:r.headers.get("cache-control")??void 0,expires:r.headers.get("expires")??void 0}}}}var Z=1/J,xe=9,ge=80,Te=`
struct Params { vp: mat4x4<f32>, resolution: f32, heightScale: f32, gradE: f32, gradN: f32 };
@group(0) @binding(0) var tileTexture: texture_2d<f32>;
@group(0) @binding(1) var tileSampler: sampler;
@group(0) @binding(2) var heightTexture: texture_2d<f32>;
@group(0) @binding(3) var<uniform> params: Params;

fn heightLoad(x: i32, y: i32, resolution: i32) -> f32 {
  return textureLoad(
    heightTexture,
    vec2<i32>(clamp(x, 0, resolution - 1), clamp(y, 0, resolution - 1)),
    0,
  ).r;
}

fn heightBilinear(uv: vec2<f32>) -> f32 {
  let resolution = i32(params.resolution);
  let position = uv * (params.resolution - 1.0);
  let x0 = i32(floor(position.x));
  let y0 = i32(floor(position.y));
  let fraction = position - vec2<f32>(f32(x0), f32(y0));
  let top = mix(
    heightLoad(x0, y0, resolution),
    heightLoad(x0 + 1, y0, resolution),
    fraction.x,
  );
  let bottom = mix(
    heightLoad(x0, y0 + 1, resolution),
    heightLoad(x0 + 1, y0 + 1, resolution),
    fraction.x,
  );
  return mix(top, bottom, fraction.y);
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) up: vec3<f32>,
};

@vertex fn vs(
  @location(0) offset: vec3<f32>,
  @location(1) up: vec3<f32>,
  @location(2) imageUv: vec2<f32>,
  @location(3) drop: f32,
) -> VertexOutput {
  var output: VertexOutput;
  let height = heightBilinear(imageUv);
  let local = offset + up * (height * params.heightScale) - up * drop;
  output.position = params.vp * vec4<f32>(local, 1.0);
  output.uv = imageUv;
  output.up = up;
  return output;
}

@fragment fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
  let color = textureSample(tileTexture, tileSampler, input.uv);
  // Central difference at a continuous position. Sampling the rounded integer
  // grid halves the gradient along a tile edge, where heightLoad clamps one
  // side onto the sample itself, and that step reads as a grid of seams.
  // The span shrinks to one texel at an edge, so rescale to the two-texel
  // span gradE and gradN are expressed in. Without a height tile the
  // resolution is 1 and both gradients are 0, which keeps the span finite
  // and leaves the flat-lit result unchanged.
  let step = 1.0 / max(params.resolution - 1.0, 1.0);
  let lo = max(input.uv - vec2<f32>(step), vec2<f32>(0.0));
  let hi = min(input.uv + vec2<f32>(step), vec2<f32>(1.0));
  let slopeE = (
    heightBilinear(vec2<f32>(hi.x, input.uv.y))
      - heightBilinear(vec2<f32>(lo.x, input.uv.y))
  ) * params.gradE * (2.0 * step / max(hi.x - lo.x, step));
  let slopeN = (
    heightBilinear(vec2<f32>(input.uv.x, lo.y))
      - heightBilinear(vec2<f32>(input.uv.x, hi.y))
  ) * params.gradN * (2.0 * step / max(hi.y - lo.y, step));
  let up = normalize(input.up);
  var east = cross(vec3<f32>(0.0, 0.0, 1.0), up);
  let eastLength = length(east);
  east = select(vec3<f32>(1.0, 0.0, 0.0), east / max(eastLength, 1e-6), eastLength > 1e-4);
  let north = cross(up, east);
  let normal = normalize(-slopeE * east - slopeN * north + up);
  let azimuth = 5.4978;
  let elevation = 0.7854;
  let light = normalize(
    sin(elevation) * up
      + cos(elevation) * (sin(azimuth) * east + cos(azimuth) * north),
  );
  let shade = clamp(1.0 + (dot(normal, light) - dot(up, light)) * 2.2, 0.45, 1.35);
  return vec4<f32>(color.rgb * shade, 1.0);
}
`;function Ee(t,e){let o=t+1,u=t*t*6,c=new Uint32Array(u+(e?t*4*6:0)),n=0;for(let a=0;a<t;a++)for(let i=0;i<t;i++){let r=a*o+i,s=r+o;c.set([r,s,r+1,r+1,s,s+1],n),n+=6}if(e){let a=o*o,i=(r,s)=>{let m=a;a+=2,c.set([r,s,m+1,r,m+1,m],n),n+=6};for(let r=0;r<t;r++)i(r,r+1);for(let r=0;r<t;r++)i(t*o+r,t*o+r+1);for(let r=0;r<t;r++)i(r*o,(r+1)*o);for(let r=0;r<t;r++)i(r*o+t,(r+1)*o+t)}return c}function me(t,e){let o=(t.tile.y+e)/2**t.tile.z;return Math.atan(Math.sinh(Math.PI*(1-2*o)))*180/Math.PI}function Se(t,e,o){let u=e+1,c=t.height?e*4*2:0,n=new Float32Array((u*u+c)*xe),a=_((t.bounds.west+t.bounds.east)/2,me(t,.5),0),i=0,r=(s,m,h)=>{let v=s/e,w=m/e,E=t.uv.north+(t.uv.south-t.uv.north)*v,x=t.uv.west+(t.uv.east-t.uv.west)*w,z=t.bounds.west+(t.bounds.east-t.bounds.west)*w,R=me(t,v),B=_(z,R,0),P=j(z,R);n[i++]=B[0]-a[0],n[i++]=B[1]-a[1],n[i++]=B[2]-a[2],n[i++]=P[0],n[i++]=P[1],n[i++]=P[2],n[i++]=x,n[i++]=E,n[i++]=h};for(let s=0;s<=e;s++)for(let m=0;m<=e;m++)r(s,m,0);if(t.height){let s=4e-5*(1+o),m=(h,v,w,E)=>{r(h,v,s),r(w,E,s)};for(let h=0;h<e;h++)m(0,h,0,h+1);for(let h=0;h<e;h++)m(e,h,e,h+1);for(let h=0;h<e;h++)m(h,0,h+1,0);for(let h=0;h<e;h++)m(h,e,h+1,e)}return{values:n,origin:a}}var pe=new Float32Array(16),K=class{#o=null;#s=null;#h=null;#c=null;#n=new Map;#e;#r=new Map;#i=[];#f=null;#l=!1;#u;#a;#d;#g;#t={uploaded:0,textureUploads:0,reused:0,destroyed:0,draws:0};constructor(e){this.#u=e.subdivisions??12;let o=e.maxCacheTiles??320;if(!Number.isInteger(o)||o<1)throw new RangeError("maxCacheTiles must be a positive integer");if(this.#e=new I({limit:o}),this.#a=e.exaggeration??1,this.#d=ee(e.stratum),this.#g=Q(e.stratum),!Number.isInteger(this.#u)||this.#u<1||this.#u>128)throw new RangeError("subdivisions must be an integer within 1..128");if(!Number.isFinite(this.#a)||this.#a<0)throw new RangeError("exaggeration must be a non-negative finite value")}init(e){if(this.#l)throw new Error("WebGPU raster backend is destroyed");if(this.#o)throw new Error("WebGPU raster backend is already initialized");this.#o=e;let o=e.device.createShaderModule({code:Te});this.#s=e.device.createRenderPipeline({layout:"auto",vertex:{module:o,entryPoint:"vs",buffers:[{arrayStride:xe*4,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32x2"},{shaderLocation:3,offset:32,format:"float32"}]}]},fragment:{module:o,entryPoint:"fs",targets:[{format:e.colorFormat}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{format:e.depthFormat,depthWriteEnabled:!0,depthCompare:"less",depthBias:this.#d,depthBiasSlopeScale:this.#g,depthBiasClamp:0,stencilFront:{compare:"equal",passOp:"increment-clamp",failOp:"keep",depthFailOp:"keep"},stencilBack:{compare:"equal",passOp:"increment-clamp",failOp:"keep",depthFailOp:"keep"}},multisample:{count:e.samples}}),this.#h=e.device.createSampler({magFilter:"linear",minFilter:"linear"}),this.#c=e.device.createTexture({size:[1,1],format:"r32float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST})}#m(e){return Math.max(this.#u,Math.ceil(180/2**e.tile.z))}#p(e,o){let u=`${e}:${o?"skirt":"flat"}`,c=this.#n.get(u);if(c)return c;let n=this.#o;if(!n)throw new Error("WebGPU raster backend is not initialized");let a=Ee(e,o),i={buffer:G(n.device,a,GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST),count:a.length,byteLength:a.byteLength};return this.#n.set(u,i),i}#x(e){for(let[o,u]of this.#e)u.sourceKey===e&&(u.destroy(),this.#e.delete(o),this.#t.destroyed++);this.#r.get(e)?.destroy(),this.#r.delete(e)}#y(e){let o=this.#o;if(!o)throw new Error("WebGPU raster backend is not initialized");if(!Number.isFinite(e.image.width)||!Number.isFinite(e.image.height)||e.image.width<1||e.image.height<1)throw new RangeError("raster image dimensions must be positive");let u=this.#r.get(e.sourceKey);if(u?.image===e.image)return u;u&&this.#x(e.sourceKey);let c=o.device.createTexture({size:[e.image.width,e.image.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});try{o.device.queue.copyExternalImageToTexture({source:e.image},{texture:c},[e.image.width,e.image.height]);let n={image:e.image,texture:c,byteLength:e.image.width*e.image.height*4,destroy:()=>c.destroy()};return this.#r.set(e.sourceKey,n),this.#t.textureUploads++,n}catch(n){throw c.destroy(),n}}#w(e){let o=this.#o,u=this.#s,c=this.#h,n=this.#c;if(!o||!u||!c||!n)throw new Error("WebGPU raster backend is not initialized");let a=this.#y(e),i=this.#m(e),r=e.height;if(r&&(!Number.isInteger(r.size)||r.size<2||!(r.data instanceof Float32Array)||r.data.length!==r.size*r.size))throw new TypeError("raster height tile must be a square Float32Array with size >= 2");let s=this.#p(i,r!==void 0),{values:m,origin:h}=Se(e,i,this.#a),v=n,w=null,E=null;try{if(r){v=o.device.createTexture({size:[r.size,r.size],format:"r32float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});let f=r.size*4,p=Math.ceil(f/256)*256,y=new Float32Array(p/4*r.size);for(let S=0;S<r.size;S++)y.set(r.data.subarray(S*r.size,(S+1)*r.size),S*p/4);o.device.queue.writeTexture({texture:v},y,{bytesPerRow:p,rowsPerImage:r.size},[r.size,r.size])}let x=(e.bounds.north+e.bounds.south)/2,z=r?(e.bounds.east-e.bounds.west)*A*Z*Math.cos(x*A)/Math.max(1,r.size-1):1,R=r?(e.bounds.north-e.bounds.south)*A*Z/Math.max(1,r.size-1):1;w=o.device.createBuffer({size:ge,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),o.device.queue.writeBuffer(w,64,new Float32Array([r?.size??1,r?this.#a/Z:0,r?this.#a/(2*Math.max(z,1e-6)):0,r?this.#a/(2*Math.max(R,1e-6)):0])),E=G(o.device,m,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST);let B=o.device.createBindGroup({layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:a.texture.createView()},{binding:1,resource:c},{binding:2,resource:v.createView()},{binding:3,resource:{buffer:w}}]}),P=w;return{image:e.image,height:r,sourceKey:e.sourceKey,origin:h,params:P,vertex:E,index:s.buffer,indexCount:s.count,bodyCount:i*i*6,bindGroup:B,byteLength:m.byteLength+ge+(r?r.data.byteLength:0),destroy(){E?.destroy(),w?.destroy(),r&&v.destroy()}}}catch(x){throw E?.destroy(),w?.destroy(),r&&v.destroy(),x}}draw(e,o,u){if(this.#l)throw new Error("WebGPU raster backend is destroyed");let c=this.#o;if(!c||!this.#s)throw new Error("WebGPU raster backend is not initialized");if(!(o.vp instanceof Float32Array)||o.vp.length!==16)throw new TypeError("FrameState.vp must be a 16-value Float32Array");if(u!==this.#f){let a=new Set(u.map(r=>r.key));this.#i=[];for(let r of u){let s=this.#e.peek(r.key);s&&(s.image!==r.image||s.sourceKey!==r.sourceKey||s.height!==r.height)&&(s.destroy(),this.#e.delete(r.key),this.#t.destroyed++,s=void 0),s?(this.#e.get(r.key),this.#t.reused++):(s=this.#w(r),this.#e.set(r.key,s),this.#t.uploaded++),this.#i.push(s)}for(let[,r]of this.#e.prune(s=>a.has(s)))r.destroy(),this.#t.destroyed++;let i=new Set([...this.#e.values()].map(r=>r.sourceKey));for(let[r,s]of this.#r)i.has(r)||(s.destroy(),this.#r.delete(r));this.#f=u}else this.#t.reused+=u.length;for(let a of this.#i){let[i,r,s]=a.origin;ue(pe,o.vp,o.vp64,i,r,s),c.device.queue.writeBuffer(a.params,0,pe)}e.setPipeline(this.#s),e.setStencilReference(0);let n=null;for(let a of this.#i)e.setBindGroup(0,a.bindGroup),e.setVertexBuffer(0,a.vertex),a.index!==n&&(n=a.index,e.setIndexBuffer(a.index,"uint32")),e.drawIndexed(a.bodyCount,1,0),this.#t.draws++;for(let a of this.#i)a.indexCount<=a.bodyCount||(e.setBindGroup(0,a.bindGroup),e.setVertexBuffer(0,a.vertex),a.index!==n&&(n=a.index,e.setIndexBuffer(a.index,"uint32")),e.drawIndexed(a.indexCount-a.bodyCount,1,a.bodyCount),this.#t.draws++)}snapshot(){return{resources:this.#e.size,textures:this.#r.size,heightTextures:[...this.#e.values()].filter(e=>e.height!==void 0).length,bytes:[...this.#n.values()].reduce((e,o)=>e+o.byteLength,0)+[...this.#e.values()].reduce((e,o)=>e+o.byteLength,0)+[...this.#r.values()].reduce((e,o)=>e+o.byteLength,0),...this.#t}}destroy(){if(!this.#l){this.#l=!0;for(let e of this.#e.values())e.destroy(),this.#t.destroyed++;this.#e.clear();for(let e of this.#r.values())e.destroy();this.#r.clear(),this.#i=[],this.#f=null,this.#c?.destroy();for(let e of this.#n.values())e.buffer.destroy();this.#n.clear(),this.#c=null,this.#h=null,this.#s=null,this.#o=null}}};function q(t={}){return new K(t)}/*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 *//*!
 * Copyright (c) 2026 The Teluala Authors
 * SPDX-License-Identifier: MIT
 */var ze="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg",ye=[["Imagery: NASA Global Imagery Browse Services (GIBS), part of NASA ESDIS","https://nasa-gibs.github.io/gibs-api-docs/"]];function Re(t){let e=V({source:X({url:ze}),groundSurface:t,minZoom:1,maxZoom:8,attribution:ye.map(([o])=>o)});return N({controller:e,backend:q()})}async function He(t,e){let o=await te.create(t,{...e,initial:{lon:10,lat:20,range:2.4}});return o.attachLayer(Re()),{globe:o,credit:ye,caption:"NASA Blue Marble imagery \xB7 @teluala/raster"}}export{ze as a,ye as b,Re as c,He as d};
