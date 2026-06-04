/* ========================================
   gradient-bg.js — Stripe-style WebGL gradient
   Basado en UVCanvas/Zenitho (MIT License)
   https://github.com/latentcat/uvcanvas
   ======================================== */

function normalizeColor(hexCode) {
  return [
    ((hexCode >> 16) & 255) / 255,
    ((hexCode >> 8) & 255) / 255,
    (255 & hexCode) / 255,
  ];
}

class MiniGl {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { antialias: true });
    this.meshes = [];

    if (width && height) this.setSize(width, height);

    const gl = this.gl;

    this.Material = class {
      constructor(vertexShaders, fragments, uniforms = {}) {
        const material = this;

        function getShaderByType(type, source) {
          const shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
          }
          return shader;
        }

        function getUniformDeclarations(uniforms, type) {
          return Object.entries(uniforms)
            .map(([name, val]) => val.getDeclaration(name, type))
            .join('\n');
        }

        const prefix = '\nprecision highp float;\n';

        material.vertexSource = `
          ${prefix}
          attribute vec4 position;
          attribute vec2 uv;
          attribute vec2 uvNorm;
          ${getUniformDeclarations(meshGl.commonUniforms, 'vertex')}
          ${getUniformDeclarations(uniforms, 'vertex')}
          ${vertexShaders}
        `;

        material.fragmentSource = `
          ${prefix}
          ${getUniformDeclarations(meshGl.commonUniforms, 'fragment')}
          ${getUniformDeclarations(uniforms, 'fragment')}
          ${fragments}
        `;

        material.vertexShader = getShaderByType(gl.VERTEX_SHADER, material.vertexSource);
        material.fragmentShader = getShaderByType(gl.FRAGMENT_SHADER, material.fragmentSource);
        material.program = gl.createProgram();
        gl.attachShader(material.program, material.vertexShader);
        gl.attachShader(material.program, material.fragmentShader);
        gl.linkProgram(material.program);
        if (!gl.getProgramParameter(material.program, gl.LINK_STATUS)) {
          console.error(gl.getProgramInfoLog(material.program));
        }
        gl.useProgram(material.program);

        material.uniforms = uniforms;
        material.uniformInstances = [];
        material.attachUniforms(undefined, meshGl.commonUniforms);
        material.attachUniforms(undefined, material.uniforms);
      }

      attachUniforms(name, uniforms) {
        const material = this;
        if (name === undefined) {
          Object.entries(uniforms).forEach(([n, u]) => material.attachUniforms(n, u));
        } else if (uniforms.type === 'array') {
          uniforms.value.forEach((u, i) => material.attachUniforms(`${name}[${i}]`, u));
        } else if (uniforms.type === 'struct') {
          Object.entries(uniforms.value).forEach(([n, u]) =>
            material.attachUniforms(`${name}.${n}`, u)
          );
        } else {
          material.uniformInstances.push({
            uniform: uniforms,
            location: gl.getUniformLocation(material.program, name),
          });
        }
      }
    };

    this.Uniform = class {
      constructor(opts) {
        this.type = 'float';
        Object.assign(this, opts);
        this.typeFn = (
          { float: '1f', int: '1i', vec2: '2fv', vec3: '3fv', vec4: '4fv', mat4: 'Matrix4fv' }
        )[this.type] || '1f';
      }

      update(value) {
        if (this.value !== undefined) {
          const fn = `uniform${this.typeFn}`;
          if (this.typeFn.startsWith('Matrix')) {
            gl[fn](value, this.transpose, this.value);
          } else {
            gl[fn](value, this.value);
          }
        }
      }

      getDeclaration(name, type, arrayLen) {
        if (this.excludeFrom === type) return '';
        if (this.type === 'array') {
          return (
            this.value[0].getDeclaration(name, type) +
            `\nconst int ${name}_length = ${this.value.length};`
          );
        }
        if (this.type === 'struct') {
          const nameNoPrefix = name.replace('u_', '');
          const structName = nameNoPrefix.charAt(0).toUpperCase() + nameNoPrefix.slice(1);
          return (
            `uniform struct ${structName} {\n` +
            Object.entries(this.value)
              .map(([n, u]) => u.getDeclaration(n, type).replace(/^uniform/, ''))
              .join('') +
            `\n} ${name};`
          );
        }
        return `uniform ${this.type} ${name};`;
      }
    };

    this.PlaneGeometry = class {
      constructor(w, h, xSeg, ySeg, orientation) {
        this.attributes = {
          position: new meshGl.Attribute({ target: gl.ARRAY_BUFFER, size: 3 }),
          uv: new meshGl.Attribute({ target: gl.ARRAY_BUFFER, size: 2 }),
          uvNorm: new meshGl.Attribute({ target: gl.ARRAY_BUFFER, size: 2 }),
          index: new meshGl.Attribute({
            target: gl.ELEMENT_ARRAY_BUFFER,
            size: 3,
            type: gl.UNSIGNED_SHORT,
          }),
        };
        this.setTopology(xSeg, ySeg);
        this.setSize(w, h, orientation);
      }

      setTopology(xSeg = 1, ySeg = 1) {
        this.xSegCount = xSeg;
        this.ySegCount = ySeg;
        this.vertexCount = (xSeg + 1) * (ySeg + 1);
        this.quadCount = xSeg * ySeg * 2;

        const uvVals = new Float32Array(2 * this.vertexCount);
        const uvNormVals = new Float32Array(2 * this.vertexCount);
        const idxVals = new Uint16Array(3 * this.quadCount);

        for (let ey = 0; ey <= ySeg; ey++) {
          for (let ex = 0; ex <= xSeg; ex++) {
            const i = ey * (xSeg + 1) + ex;
            uvVals[2 * i] = ex / xSeg;
            uvVals[2 * i + 1] = 1 - ey / ySeg;
            uvNormVals[2 * i] = (ex / xSeg) * 2 - 1;
            uvNormVals[2 * i + 1] = 1 - (ey / ySeg) * 2;
            if (ex < xSeg && ey < ySeg) {
              const quad = ey * xSeg + ex;
              idxVals[6 * quad] = i;
              idxVals[6 * quad + 1] = i + 1 + xSeg;
              idxVals[6 * quad + 2] = i + 1;
              idxVals[6 * quad + 3] = i + 1;
              idxVals[6 * quad + 4] = i + 1 + xSeg;
              idxVals[6 * quad + 5] = i + 2 + xSeg;
            }
          }
        }

        this.attributes.uv.values = uvVals;
        this.attributes.uvNorm.values = uvNormVals;
        this.attributes.index.values = idxVals;
        this.attributes.uv.update();
        this.attributes.uvNorm.update();
        this.attributes.index.update();
      }

      setSize(width = 1, height = 1, orientation = 'xz') {
        this.width = width;
        this.height = height;
        this.orientation = orientation;

        if (!this.attributes.position.values ||
            this.attributes.position.values.length !== 3 * this.vertexCount) {
          this.attributes.position.values = new Float32Array(3 * this.vertexCount);
        }

        const halfW = width / -2;
        const halfH = height / -2;
        const segW = width / this.xSegCount;
        const segH = height / this.ySegCount;
        const ax = 'xyz'.indexOf(orientation[0]);
        const ay = 'xyz'.indexOf(orientation[1]);

        for (let ey = 0; ey <= this.ySegCount; ey++) {
          const y = halfH + ey * segH;
          for (let ex = 0; ex <= this.xSegCount; ex++) {
            const x = halfW + ex * segW;
            const i = ey * (this.xSegCount + 1) + ex;
            this.attributes.position.values[3 * i + ax] = x;
            this.attributes.position.values[3 * i + ay] = -y;
          }
        }
        this.attributes.position.update();
      }
    };

    this.Mesh = class {
      constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.wireframe = false;
        this.attributeInstances = [];

        Object.entries(geometry.attributes).forEach(([name, attr]) => {
          this.attributeInstances.push({
            attribute: attr,
            location: attr.attach(name, material.program),
          });
        });
        meshGl.meshes.push(this);
      }

      draw() {
        gl.useProgram(this.material.program);
        this.material.uniformInstances.forEach(({ uniform, location }) => uniform.update(location));
        this.attributeInstances.forEach(({ attribute, location }) => attribute.use(location));
        gl.drawElements(
          this.wireframe ? gl.LINES : gl.TRIANGLES,
          this.geometry.attributes.index.values.length,
          gl.UNSIGNED_SHORT,
          0
        );
      }

      remove() {
        meshGl.meshes = meshGl.meshes.filter((m) => m !== this);
      }
    };

    this.Attribute = class {
      constructor(opts) {
        this.type = gl.FLOAT;
        this.normalized = false;
        Object.assign(this, opts);
        this.buffer = gl.createBuffer();
        this.update();
      }

      update() {
        if (this.values !== undefined) {
          gl.bindBuffer(this.target, this.buffer);
          gl.bufferData(this.target, this.values, gl.STATIC_DRAW);
        }
      }

      attach(name, program) {
        const loc = gl.getAttribLocation(program, name);
        if (this.target === gl.ARRAY_BUFFER) {
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, this.size, this.type, this.normalized, 0, 0);
        }
        return loc;
      }

      use(loc) {
        gl.bindBuffer(this.target, this.buffer);
        if (this.target === gl.ARRAY_BUFFER) {
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, this.size, this.type, this.normalized, 0, 0);
        }
      }
    };

    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const meshGl = this;

    this.commonUniforms = {
      projectionMatrix: new this.Uniform({ type: 'mat4', value: identity }),
      modelViewMatrix: new this.Uniform({ type: 'mat4', value: identity }),
      resolution: new this.Uniform({ type: 'vec2', value: [1, 1] }),
      aspectRatio: new this.Uniform({ type: 'float', value: 1 }),
    };
  }

  setSize(w = 640, h = 480) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
    this.commonUniforms.resolution.value = [w, h];
    this.commonUniforms.aspectRatio.value = w / h;
  }

  setOrthographicCamera(l = 0, r = 0, t = 0, n = -2000, f = 2000) {
    this.commonUniforms.projectionMatrix.value = [
      2 / this.width, 0, 0, 0,
      0, 2 / this.height, 0, 0,
      0, 0, 2 / (n - f), 0,
      l, r, t, 1,
    ];
  }

  render() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);
    this.meshes.forEach((m) => m.draw());
  }
}

class GradientBg {
  constructor(container, options = {}) {
    this.container = container;
    this.colors = options.colors || ['#FF6B00', '#0A0A0A'];
    this.playing = true;
    this.t = 1253106;
    this.last = 0;
    this.amp = options.amp !== undefined ? options.amp : 320;
    this.seed = options.seed !== undefined ? options.seed : 5;
    this.freqX = options.freqX !== undefined ? options.freqX : 14e-5;
    this.freqY = options.freqY !== undefined ? options.freqY : 29e-5;
    this.angle = options.angle || 0;
    this.density = options.density || [0.03, 0.08];
    this.sectionColors = null;
    this.uniforms = null;
    this.minigl = null;
    this.mesh = null;
    this.material = null;
    this.geometry = null;

    this._onResize = this._resize.bind(this);
    this._animate = this._animate.bind(this);

    this._init();
  }

  /* ----- shader sources ----- */

  static _shaderNoise() {
    return `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;
  }

  static _shaderBlend() {
    return `
vec3 blendNormal(vec3 base, vec3 blend) { return blend; }
vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
  return (blendNormal(base, blend) * opacity + base * (1.0 - opacity));
}`;
  }

  static _shaderVertex() {
    return `
varying vec3 v_color;
void main() {
  float time = u_time * u_global.noiseSpeed;
  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;
  vec2 st = 1.0 - uvNorm.xy;
  float tilt = resolution.y / 2.0 * uvNorm.y;
  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;
  float offset = resolution.x / 2.0 * u_vertDeform.incline * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);
  float noise = snoise(vec3(
    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
    noiseCoord.y * u_vertDeform.noiseFreq.y,
    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed
  )) * u_vertDeform.noiseAmp;
  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);
  noise = max(0.0, noise);
  vec3 pos = vec3(position.x, position.y + tilt + incline + noise - offset, position.z);
  if (u_active_colors[0] == 1.0) { v_color = u_baseColor; }
  for (int i = 0; i < u_waveLayers_length; i++) {
    if (u_active_colors[i + 1] == 1.0) {
      WaveLayers layer = u_waveLayers[i];
      float n = smoothstep(layer.noiseFloor, layer.noiseCeil,
        snoise(vec3(
          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
          noiseCoord.y * layer.noiseFreq.y,
          time * layer.noiseSpeed + layer.noiseSeed
        )) / 2.0 + 0.5);
      v_color = blendNormal(v_color, layer.color, pow(n, 4.0));
    }
  }
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;
  }

  static _shaderFragment() {
    return `
varying vec3 v_color;
void main() {
  vec3 color = v_color;
  if (u_darken_top == 1.0) {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
  }
  gl_FragColor = vec4(color, 1.0);
}`;
  }

  /* ----- init ----- */

  _init() {
    if (!document.createElement('canvas').getContext('webgl')) {
      return;
    }

    const containerStyle = this.container.style;
    if (getComputedStyle(this.container).position === 'static') {
      containerStyle.position = 'relative';
    }

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;pointer-events:none';
    this.canvas.dataset.jsDarkenTop = '';
    this.container.prepend(this.canvas);

    this.minigl = new MiniGl(this.canvas);

    this._initGradientColors();
    this._initMesh();
    this._resize();
    requestAnimationFrame(this._animate);
    window.addEventListener('resize', this._onResize);
  }

  _initGradientColors() {
    this.sectionColors = this.colors
      .map((hex) => {
        let h = hex;
        if (h.length === 4) {
          h = `#${h.substr(1).split('').map((c) => c + c).join('')}`;
        }
        return h && `0x${h.substr(1)}`;
      })
      .filter(Boolean)
      .map(normalizeColor);
  }

  _initMesh() {
    this.uniforms = {
      u_time: new this.minigl.Uniform({ value: 0 }),
      u_shadow_power: new this.minigl.Uniform({ value: 5 }),
      u_darken_top: new this.minigl.Uniform({ value: 1 }),
      u_active_colors: new this.minigl.Uniform({
        value: [1, 1, 1, 1],
        type: 'vec4',
      }),
      u_global: new this.minigl.Uniform({
        value: {
          noiseFreq: new this.minigl.Uniform({ value: [this.freqX, this.freqY], type: 'vec2' }),
          noiseSpeed: new this.minigl.Uniform({ value: 5e-6 }),
        },
        type: 'struct',
      }),
      u_vertDeform: new this.minigl.Uniform({
        value: {
          incline: new this.minigl.Uniform({
            value: Math.sin(this.angle) / Math.cos(this.angle),
          }),
          offsetTop: new this.minigl.Uniform({ value: -0.5 }),
          offsetBottom: new this.minigl.Uniform({ value: -0.5 }),
          noiseFreq: new this.minigl.Uniform({ value: [3, 4], type: 'vec2' }),
          noiseAmp: new this.minigl.Uniform({ value: this.amp }),
          noiseSpeed: new this.minigl.Uniform({ value: 10 }),
          noiseFlow: new this.minigl.Uniform({ value: 3 }),
          noiseSeed: new this.minigl.Uniform({ value: this.seed }),
        },
        type: 'struct',
        excludeFrom: 'fragment',
      }),
      u_baseColor: new this.minigl.Uniform({
        value: this.sectionColors[0],
        type: 'vec3',
        excludeFrom: 'fragment',
      }),
      u_waveLayers: new this.minigl.Uniform({
        value: [],
        excludeFrom: 'fragment',
        type: 'array',
      }),
    };

    for (let i = 1; i < this.sectionColors.length; i++) {
      this.uniforms.u_waveLayers.value.push(
        new this.minigl.Uniform({
          value: {
            color: new this.minigl.Uniform({ value: this.sectionColors[i], type: 'vec3' }),
            noiseFreq: new this.minigl.Uniform({
              value: [2 + i / this.sectionColors.length, 3 + i / this.sectionColors.length],
              type: 'vec2',
            }),
            noiseSpeed: new this.minigl.Uniform({ value: 11 + 0.3 * i }),
            noiseFlow: new this.minigl.Uniform({ value: 6.5 + 0.3 * i }),
            noiseSeed: new this.minigl.Uniform({ value: this.seed + 10 * i }),
            noiseFloor: new this.minigl.Uniform({ value: 0.1 }),
            noiseCeil: new this.minigl.Uniform({ value: 0.63 + 0.07 * i }),
          },
          type: 'struct',
        })
      );
    }

    const vertexSrc = [
      GradientBg._shaderNoise(),
      GradientBg._shaderBlend(),
      GradientBg._shaderVertex(),
    ].join('\n\n');

    this.material = new this.minigl.Material(vertexSrc, GradientBg._shaderFragment(), this.uniforms);
    this.geometry = new this.minigl.PlaneGeometry();
    this.mesh = new this.minigl.Mesh(this.geometry, this.material);
  }

  /* ----- lifecycle ----- */

  _resize() {
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    if (w === 0 || h === 0) return;
    this.minigl.setSize(w, h);
    this.minigl.setOrthographicCamera();
    const xSeg = Math.ceil(w * this.density[0]);
    const ySeg = Math.ceil(h * this.density[1]);
    this.mesh.geometry.setTopology(xSeg, ySeg);
    this.mesh.geometry.setSize(w, h);
    this.mesh.material.uniforms.u_shadow_power.value = w < 600 ? 5 : 6;
  }

  _animate(ts) {
    if (!this._shouldSkipFrame(ts) || this.playing) {
      this.t += Math.min(ts - this.last, 1000 / 15);
      this.last = ts;
      this.mesh.material.uniforms.u_time.value = this.t;
      this.minigl.render();
    }
    if (this.playing) {
      requestAnimationFrame(this._animate);
    }
  }

  _shouldSkipFrame() {
    return !!document.hidden;
  }

  pause() {
    this.playing = false;
  }

  play() {
    if (!this.playing) {
      this.playing = true;
      requestAnimationFrame(this._animate);
    }
  }

  destroy() {
    this.playing = false;
    window.removeEventListener('resize', this._onResize);
    if (this.minigl) {
      this.minigl.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
