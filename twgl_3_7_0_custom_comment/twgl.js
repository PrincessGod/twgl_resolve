/*
 * Copyright 2015, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of his
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

define([
    './attributes',
    './draw',
    './framebuffers',
    './programs',
    './textures',
    './typedarrays',
    './vertex-arrays',
    './utils',
  ], function(
    attributes,
    draw,
    framebuffers,
    programs,
    textures,
    typedArrays,
    vertexArrays,
    utils) {
  "use strict";

  /**
   * The main TWGL module.                                                     // TWGL 主模块，所有主要方法的入口
   *
   * For most use cases you shouldn't need anything outside this module.       // 和 twgl-full 的区别就是不包含 (v3, m4, primitives)
   * Exceptions between the stuff added to twgl-full (v3, m4, primitives)
   *
   * @module twgl
   * @borrows module:twgl/attributes.setAttribInfoBufferFromArray as setAttribInfoBufferFromArray
   * @borrows module:twgl/attributes.createBufferInfoFromArrays as createBufferInfoFromArrays
   * @borrows module:twgl/attributes.createVertexArrayInfo as createVertexArrayInfo
   * @borrows module:twgl/draw.drawBufferInfo as drawBufferInfo
   * @borrows module:twgl/draw.drawObjectList as drawObjectList
   * @borrows module:twgl/framebuffers.createFramebufferInfo as createFramebufferInfo
   * @borrows module:twgl/framebuffers.resizeFramebufferInfo as resizeFramebufferInfo
   * @borrows module:twgl/framebuffers.bindFramebufferInfo as bindFramebufferInfo
   * @borrows module:twgl/programs.createProgramInfo as createProgramInfo
   * @borrows module:twgl/programs.createUniformBlockInfo as createUniformBlockInfo
   * @borrows module:twgl/programs.bindUniformBlock as bindUniformBlock
   * @borrows module:twgl/programs.setUniformBlock as setUniformBlock
   * @borrows module:twgl/programs.setBlockUniforms as setBlockUniforms
   * @borrows module:twgl/programs.setUniforms as setUniforms
   * @borrows module:twgl/programs.setBuffersAndAttributes as setBuffersAndAttributes
   * @borrows module:twgl/textures.setTextureFromArray as setTextureFromArray
   * @borrows module:twgl/textures.createTexture as createTexture
   * @borrows module:twgl/textures.resizeTexture as resizeTexture
   * @borrows module:twgl/textures.createTextures as createTextures
   */

  // make sure we don't see a global gl                                        // 这样做可以有效防止使用外部作用域中存在 gl 对象，非常必要且周到
  var gl = undefined;  // eslint-disable-line

  // 保存一些默认设置，setDefaults（）中使用
  var defaults = {
    addExtensionsToContext: true,
  };

  /**
   * Various default settings for twgl.
   *
   * Note: You can call this any number of times. Example:
   *
   *     twgl.setDefaults({ textureColor: [1, 0, 0, 1] });
   *     twgl.setDefaults({ attribPrefix: 'a_' });
   *
   * is equivalent to
   *
   *     twgl.setDefaults({
   *       textureColor: [1, 0, 0, 1],
   *       attribPrefix: 'a_',
   *     });
   *
   * @typedef {Object} Defaults
   * @property {string} attribPrefix The prefix to stick on attributes         // 用于JavaScript对象 和 GLSL attribute 映射
   * 
   *   When writing shaders I prefer to name attributes with `a_`, uniforms with `u_` and varyings with `v_`
   *   as it makes it clear where they came from. But, when building geometry I prefer using unprefixed names.
   *
   *   In otherwords I'll create arrays of geometry like this
   *
   *       var arrays = {
   *         position: ...
   *         normal: ...
   *         texcoord: ...
   *       };
   *
   *   But need those mapped to attributes and my attributes start with `a_`.
   *
   *   Default: `""`
   *
   * @property {number[]} textureColor Array of 4 values in the range 0 to 1   // 纹理没有下载完成之前使用什么颜色代替
   *
   *   The default texture color is used when loading textures from
   *   urls. Because the URL will be loaded async we'd like to be
   *   able to use the texture immediately. By putting a 1x1 pixel
   *   color in the texture we can start using the texture before
   *   the URL has loaded.
   *
   *   Default: `[0.5, 0.75, 1, 1]`
   *
   * @property {string} crossOrigin                                            // 当下载跨域图片时没有定义 crossOrigin 属性就用这个默认值
   *
   *   If not undefined sets the crossOrigin attribute on images
   *   that twgl creates when downloading images for textures.
   *
   *   Also see {@link module:twgl.TextureOptions}.
   *
   * @property {bool} addExtensionsToContext                                   // 是否添加可用的扩展到 GL 上下文
   *
   *   If true, then, when twgl will try to add any supported WebGL extensions
   *   directly to the context under their normal GL names. For example
   *   if ANGLE_instances_arrays exists then twgl would enable it,
   *   add the functions `vertexAttribDivisor`, `drawArraysInstanced`,
   *   `drawElementsInstanced`, and the constant `VERTEX_ATTRIB_ARRAY_DIVISOR`
   *   to the `WebGLRenderingContext`.
   *
   * @memberOf module:twgl
   */

  /**
   * Sets various defaults for twgl.
   *
   * In the interest of terseness which is kind of the point
   * of twgl I've integrated a few of the older functions here
   *
   * @param {module:twgl.Defaults} newDefaults The default settings.
   * @memberOf module:twgl
   */
  function setDefaults(newDefaults) {
    utils.copyExistingProperties(newDefaults, defaults);                // 只更新目标中存在的键值
    attributes.setDefaults_(newDefaults);  // eslint-disable-line       // 更新 attributes 默认设置
    textures.setDefaults_(newDefaults);  // eslint-disable-line         // 更新 textures 默认设置
  }

  const prefixRE = /^(.*?)_/;                                           // 获取前缀  例如 'ANGLE_instanced_arrays' 可以得到字符组 ANGLE
  function addExtensionToContext(gl, extensionName) {                   // 添加 WebGL 扩展的方法
    const ext = gl.getExtension(extensionName);
    if (ext) {
      const fnSuffix = prefixRE.exec(extensionName)[1];
      const enumSuffix = '_' + fnSuffix;
      for (var key in ext) {
        const value = ext[key];
        const isFunc = typeof (value) === 'function';
        const suffix = isFunc ? fnSuffix : enumSuffix;
        var name = key;
        // examples of where this is not true are WEBGL_compressed_texture_s3tc
        // and WEBGL_compressed_texture_pvrtc
        if (key.endsWith(suffix)) {
          name = key.substring(0, key.length - suffix.length);
        }
        if (gl[name] !== undefined) {
          if (!isFunc && gl[name] !== value) {
            console.warn(name, gl[name], value, key); // eslint-disable-line
          }
        } else {
          if (isFunc) {
            gl[name] = function(origFn) {
              return function() {
                return origFn.apply(ext, arguments);
              };
            }(value);
          } else {
            gl[name] = value;
          }
        }
      }
    }
    return ext;
  }

  const supportedExtensions = [                                                // 默认开启的扩展列表
    'ANGLE_instanced_arrays',
    'EXT_blend_minmax',
    'EXT_color_buffer_half_float',
    'EXT_disjoint_timer_query',
    'EXT_frag_depth',
    'EXT_sRGB',
    'EXT_shader_texture_lod',
    'EXT_texture_filter_anisotropic',
    'OES_element_index_uint',
    'OES_standard_derivatives',
    'OES_texture_float',
    'OES_texture_float_linear',
    'OES_texture_half_float',
    'OES_texture_half_float_linear',
    'OES_vertex_array_object',
    'WEBGL_color_buffer_float',
    'WEBGL_compressed_texture_atc',
    'WEBGL_compressed_texture_etc1',
    'WEBGL_compressed_texture_pvrtc',
    'WEBGL_compressed_texture_s3tc',
    'WEBGL_depth_texture',
    'WEBGL_draw_buffers',
  ];

  /**
   * Attempts to enable all of the following extensions                        // 尝试开启所有列表中的扩展
   * and add their functions and constants to the
   * `WebGLRenderingContext` using their normal non-extension like names.
   *
   *      ANGLE_instanced_arrays
   *      EXT_blend_minmax
   *      EXT_color_buffer_half_float
   *      EXT_disjoint_timer_query
   *      EXT_frag_depth
   *      EXT_sRGB
   *      EXT_shader_texture_lod
   *      EXT_texture_filter_anisotropic
   *      OES_element_index_uint
   *      OES_standard_derivatives
   *      OES_texture_float
   *      OES_texture_float_linear
   *      OES_texture_half_float
   *      OES_texture_half_float_linear
   *      OES_vertex_array_object
   *      WEBGL_color_buffer_float
   *      WEBGL_compressed_texture_atc
   *      WEBGL_compressed_texture_etc1
   *      WEBGL_compressed_texture_pvrtc
   *      WEBGL_compressed_texture_s3tc
   *      WEBGL_depth_texture
   *      WEBGL_draw_buffers
   *
   * For example if `ANGLE_instanced_arrays` exists then the functions
   * `drawArraysInstanced`, `drawElementsInstanced`, `vertexAttribDivisor`
   * and the constant `VERTEX_ATTRIB_ARRAY_DIVISOR` are added to the
   * `WebGLRenderingContext`.
   *
   * Note that if you want to know if the extension exists you should
   * probably call `gl.getExtension` for each extension. Alternatively
   * you can check for the existance of the functions or constants that
   * are expected to be added. For example
   *
   *    if (gl.drawBuffers) {
   *      // Either WEBGL_draw_buffers was enabled OR you're running in WebGL2
   *      ....
   *
   * @param {WebGLRenderingContext} gl A WebGLRenderingContext
   * @memberOf module:twgl
   */
  function addExtensionsToContext(gl) {
    for (var ii = 0; ii < supportedExtensions.length; ++ii) {
      addExtensionToContext(gl, supportedExtensions[ii]);
    }
  }

  /**
   * Creates a webgl context.                                                  // 创建一个 WebGL 上下文对象
   * @param {HTMLCanvasElement} canvas The canvas tag to get
   *     context from. If one is not passed in one will be
   *     created.
   * @return {WebGLRenderingContext} The created context.                      // 可以设置初始化参数
   */
  function create3DContext(canvas, opt_attribs) {
    var names = ["webgl", "experimental-webgl"];                               // 这里第二个选项是为了支持更多浏览器，有时 EDGE 需要用 bate 版 WebGL
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {
      context = canvas.getContext(names[ii], opt_attribs);
      if (context) {
        if (defaults.addExtensionsToContext) {                                 // 如果获取上下文成功，并且默认加载扩展，就尝试加载所有列表中的扩展
          addExtensionsToContext(context);
        }
        break;
      }
    }
    return context;
  }

  /**
   * Gets a WebGL1 context.                                                    // 获取 WebGL1 上下文，但试图通过加载扩展支持 VAO，添加 WebGL2 入口，
   *                                                                           // 除非初始化前将关闭扩展加载，这样可以最大化支持新的特性
   *
   * Note: Will attempt to enable Vertex Array Objects
   * and add WebGL2 entry points. (unless you first set defaults with
   * `twgl.setDefaults({enableVertexArrayObjects: false})`;
   *
   * @param {HTMLCanvasElement} canvas a canvas element.
   * @param {WebGLContextCreationAttirbutes} [opt_attribs] optional webgl context creation attributes
   * @memberOf module:twgl
   */
  function getWebGLContext(canvas, opt_attribs) {
    var gl = create3DContext(canvas, opt_attribs);
    return gl;
  }

  /**
   * Creates a webgl context.                                                  // 创建 WebGL 上下文，如果可以就获取 WebGL2 上下文
   *
   * Will return a WebGL2 context if possible.
   *
   * You can check if it's WebGL2 with
   *
   *     twgl.isWebGL2(gl);
   *
   * @param {HTMLCanvasElement} canvas The canvas tag to get
   *     context from. If one is not passed in one will be
   *     created.
   * @return {WebGLRenderingContext} The created context.
   */
  function createContext(canvas, opt_attribs) {
    var names = ["webgl2", "webgl", "experimental-webgl"];
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {
      context = canvas.getContext(names[ii], opt_attribs);
      if (context) {
        if (defaults.addExtensionsToContext) {
          addExtensionsToContext(context);
        }
        break;
      }
    }
    return context;
  }

  /**
   * Gets a WebGL context.  Will create a WebGL2 context if possible.          // 获取 WebGL 上下文，如果可以就获取 WebGL2 上下文，
   *                                                                           // 还提供了检查当前 WebGL 版本的方法
   * You can check if it's WebGL2 with
   *
   *    function isWebGL2(gl) {
   *      return gl.getParameter(gl.VERSION).indexOf("WebGL 2.0 ") == 0;
   *    }
   *
   * Note: For a WebGL1 context will attempt to enable Vertex Array Objects
   * and add WebGL2 entry points. (unless you first set defaults with
   * `twgl.setDefaults({enableVertexArrayObjects: false})`;
   *
   * @param {HTMLCanvasElement} canvas a canvas element.
   * @param {WebGLContextCreationAttirbutes} [opt_attribs] optional webgl context creation attributes
   * @return {WebGLRenderingContext} The created context.
   * @memberOf module:twgl
   */
  function getContext(canvas, opt_attribs) {
    var gl = createContext(canvas, opt_attribs);
    return gl;
  }

  /**
   * Resize a canvas to match the size it's displayed.                         // 更新画布大小，可以根据实际情况设置比率
   * @param {HTMLCanvasElement} canvas The canvas to resize.                   // 如果是高分屏，可以设置为 `window.devicePixelRatio` 支持高清，如果机器性能有限，可以等比缩放一定倍数，例如 0.5
   * @param {number} [multiplier] So you can pass in `window.devicePixelRatio` or other scale value if you want to.
   * @return {boolean} true if the canvas was resized.
   * @memberOf module:twgl
   */
  function resizeCanvasToDisplaySize(canvas, multiplier) {
    multiplier = multiplier || 1;
    multiplier = Math.max(0, multiplier);
    var width  = canvas.clientWidth  * multiplier | 0;
    var height = canvas.clientHeight * multiplier | 0;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

  // Using quotes prevents Uglify from changing the names.                     // 以下代码从其他模块中将公共接口导出，和此模块接口合并导出
  // No speed diff AFAICT.
  var api = {                                                                  // 此模块包含的辅助方法
    "addExtensionsToContext": addExtensionsToContext,
    "getContext": getContext,
    "getWebGLContext": getWebGLContext,
    "isWebGL1": utils.isWebGL1,
    "isWebGL2": utils.isWebGL2,
    "resizeCanvasToDisplaySize": resizeCanvasToDisplaySize,
    "setDefaults": setDefaults,
  };

  function notPrivate(name) {
    return name[name.length - 1] !== '_';
  }

  function copyPublicProperties(src, dst) {
    Object.keys(src).filter(notPrivate).forEach(function(key) {
      dst[key] = src[key];
    });
    return dst;
  }

  var apis = {
    attributes: attributes,                                                    // attribute 相关辅助方法
    draw: draw,                                                                // 绘制相关辅助方法
    framebuffers: framebuffers,                                                // 帧缓冲相关辅助方法
    programs: programs,                                                        // 着色程序相关辅助方法
    textures: textures,                                                        // 纹理相关辅助方法
    typedArrays: typedArrays,                                                  // 着色器相关类型的底层辅助方法
    vertexArrays: vertexArrays,                                                // VAO 相关辅助方法
  };
  Object.keys(apis).forEach(function(name) {
    var srcApi = apis[name];
    copyPublicProperties(srcApi, api);
    api[name] = copyPublicProperties(srcApi, {});
  });

  return api;

});

