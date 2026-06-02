/* eslint-disable */
// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useOverdrive } from "../contexts/OverdriveContext";

interface ShaderCanvasProps {
  colorPreset?: "GREEN" | "AMBER" | "COSMIC";
  opacity?: number;
}

export default function ShaderCanvas({ colorPreset = "GREEN", opacity = 0.08 }: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Global overdrive scales the shader's simulation time. Held in a ref so the
  // rAF loop reads the live multiplier without recompiling the program.
  const { speedMul } = useOverdrive();
  const speedMulRef = useRef(speedMul);
  useEffect(() => { speedMulRef.current = speedMul; }, [speedMul]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      setErrorStatus("WebGL not supported. Loading telemetry backup.");
      return;
    }

    // Enable standard derivatives for fwidth
    const derivativesExt = gl.getExtension("OES_standard_derivatives");

    // Vertex Shader Source
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        vUv.y = 1.0 - vUv.y; // Flip Y
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader Source with 3D math and Raymarching/Wave distortion + real-time 4x4 Bayer Dithering
    const fsSource = `
      #extension GL_OES_standard_derivatives : enable
      precision mediump float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform int uColorPreset; // 0=Green, 1=Amber, 2=Cosmic Blue/Purple

      // 4x4 Bayer Dithering Matrix
      float getDitherLimit(vec2 fragCoord) {
        int x = int(mod(fragCoord.x, 4.0));
        int y = int(mod(fragCoord.y, 4.0));
        int index = x + y * 4;
        
        float val = 0.0;
        if (index == 0) val = 0.0;
        else if (index == 1) val = 8.0;
        else if (index == 2) val = 2.0;
        else if (index == 3) val = 10.0;
        else if (index == 4) val = 12.0;
        else if (index == 5) val = 4.0;
        else if (index == 6) val = 14.0;
        else if (index == 7) val = 6.0;
        else if (index == 8) val = 3.0;
        else if (index == 9) val = 11.0;
        else if (index == 10) val = 1.0;
        else if (index == 11) val = 9.0;
        else if (index == 12) val = 15.0;
        else if (index == 13) val = 7.0;
        else if (index == 14) val = 13.0;
        else if (index == 15) val = 5.0;
        
        return (val + 0.5) / 16.0;
      }

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      // 3D Grid Perspective Warp with Mouse Accents
      float quantum3DGrid(vec2 uv, float time, vec2 mouse) {
        float d = 1.0 - uv.y;
        if (d < 0.02) d = 0.02;
        
        vec2 p = vec2((uv.x - 0.5) / d, 1.0 / d);
        p.y += time * 1.5;
        
        // Perspective warp driven by mouse coordinate shift
        float warpX = (mouse.x - 0.5) * 1.8;
        p.x += sin(p.y * 0.1 + time) * 0.3 + warpX / d;
        p.y += (mouse.y - 0.5) * 2.0;
        
        vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p);
        float line = min(grid.x, grid.y);
        float gridPattern = 1.0 - min(line, 1.0);
        
        gridPattern *= pow(d, 1.5);
        return gridPattern;
      }

      // Raymarched holographic quantum attractor ball with Magnetic Pull
      float quantumAttractor(vec2 uv, float time, vec2 mouse) {
        vec2 p = uv - 0.5;
        p.x *= uResolution.x / uResolution.y;
        
        float distance = length(p);
        float speed = time * 0.8;
        
        float core = 0.0;
        for(int i = 1; i < 4; i++) {
          float fi = float(i);
          vec2 center = vec2(
            sin(speed * fi * 1.1 + fi * 2.0) * 0.15,
            cos(speed * fi * 0.9 + fi) * 0.15
          );
          
          // Magnetic Pull towards mouse coords
          vec2 mDiff = vec2((mouse.x - 0.5) * (uResolution.x / uResolution.y), -(mouse.y - 0.5));
          float dToMouse = length(p - mDiff);
          float attraction = smoothstep(0.5, 0.0, dToMouse) * 0.12;
          center += normalize(p - mDiff) * attraction;
          
          float rad = 0.12 + sin(time * 3.0 + fi) * 0.02;
          float item = smoothstep(rad + 0.01, rad - 0.05, length(p - center));
          core += item * (1.1 / fi);
        }
        
        float ring = abs(p.x * cos(time) - p.y * sin(time)) + abs(p.y * cos(time) + p.x * sin(time)) * 0.5;
        float orbit = smoothstep(0.02, 0.00, abs(distance - 0.28 - sin(time * 2.0) * 0.03) - 0.005);
        orbit += smoothstep(0.01, 0.00, abs(ring - 0.02));
        
        return core * 0.5 + orbit * 0.4;
      }

      void main() {
        vec2 uv = vUv;
        float time = uTime;
        
        float grid = quantum3DGrid(uv, time, uMouse);
        float attractor = quantumAttractor(uv, time, uMouse);
        
        float luma = mix(grid * 0.4, attractor, 0.65);
        
        float vignette = 1.0 - length(uv - 0.5) * 1.1;
        luma *= max(vignette, 0.0);
        
        vec2 pixelCoord = uv * uResolution;
        vec2 chunkCoord = floor(pixelCoord / 2.0) * 2.0;
        float chunkyThreshold = getDitherLimit(chunkCoord);
        
        float scanline = sin(pixelCoord.y * 1.5 + time * 4.0) * 0.08 + 0.92;
        luma *= scanline;
        
        float finalBinary = (luma > chunkyThreshold) ? 1.0 : 0.0;
        
        float noise = hash(uv + vec2(time)) * 0.06;
        float dynamicLuma = finalBinary + noise;

        vec3 finalColor = vec3(0.0);
        if (uColorPreset == 0) {
          finalColor = vec3(dynamicLuma * 0.2, dynamicLuma * 0.95, dynamicLuma * 0.5);
          if(luma > 0.65) finalColor += vec3(0.3, 0.5, 0.2) * (luma - 0.65);
        } else if (uColorPreset == 1) {
          finalColor = vec3(dynamicLuma * 1.0, dynamicLuma * 0.55, dynamicLuma * 0.05);
          if(luma > 0.6) finalColor += vec3(0.4, 0.2, 0.0) * (luma - 0.6);
        } else {
          finalColor = vec3(dynamicLuma * 0.0, dynamicLuma * 0.75, dynamicLuma * 1.0);
          finalColor.r += dynamicLuma * 0.8 * (sin(time * 1.2 + uv.x * 2.0 + uv.y * 2.0) * 0.5 + 0.5);
          finalColor.b += dynamicLuma * 0.3 * (cos(time + uv.y * 3.0) * 0.5 + 0.5);
        }

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Initialize WebGL
    const compileShader = (source: string, type: number): WebGLShader | null => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader compile error: ", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) {
      setErrorStatus("Holographic core simulation compiler crashed.");
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Link error: ", gl.getProgramInfoLog(program));
      return;
    }

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, "uTime");
    const resolutionLoc = gl.getUniformLocation(program, "uResolution");
    const mouseLoc = gl.getUniformLocation(program, "uMouse");
    const colorPresetLoc = gl.getUniformLocation(program, "uColorPreset");

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse coordinates tracking object
    const mouseLocal = {
      x: 0.5,
      y: 0.5,
      targetX: 0.5,
      targetY: 0.5
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      if (x >= -2 && x <= 3 && y >= -2 && y <= 3) {
        mouseLocal.targetX = Math.min(Math.max(x, 0.0), 1.0);
        mouseLocal.targetY = Math.min(Math.max(y, 0.0), 1.0);
      } else {
        mouseLocal.targetX = 0.5;
        mouseLocal.targetY = 0.5;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationId: number;
    let lastTs = Date.now();
    let simTime = 0;

    const render = () => {
      animationId = requestAnimationFrame(render);
      const now = Date.now();
      const dt = (now - lastTs) / 1000;
      lastTs = now;
      simTime += dt * speedMulRef.current;

      // Smooth interpolation for mouse movement coordinates with lerp
      mouseLocal.x += (mouseLocal.targetX - mouseLocal.x) * 0.08;
      mouseLocal.y += (mouseLocal.targetY - mouseLocal.y) * 0.08;

      gl.useProgram(program);
      gl.uniform1f(timeLoc, simTime);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(mouseLoc, mouseLocal.x, mouseLocal.y);

      let presetIndex = 0;
      if (colorPreset === "AMBER") presetIndex = 1;
      else if (colorPreset === "COSMIC") presetIndex = 2;
      gl.uniform1i(colorPresetLoc, presetIndex);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [colorPreset]);

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen transition-all duration-700"
      style={{ opacity }}
    >
      {errorStatus ? (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <div className="font-mono text-xs text-emerald-500/80 animate-pulse uppercase tracking-wider">
            {errorStatus}
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover select-none scale-[1.01]"
          style={{ filter: "contrast(1.0) brightness(0.7)" }}
        />
      )}
      <div className="absolute inset-0 scanline-mask bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />
    </div>
  );
}
