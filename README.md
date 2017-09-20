# TWGL 源码解读

[`twgl.js`](https://github.com/greggman/twgl.js) 源码解读，学习 WebGL 代码在实践过程中的组织和重构。

## What is TWGL?

`twgl.js` 是一个 WebGL 的帮助类库，对 WebGL API 做了一个浅层封装，
使编写 WebGL 应用更加简便。它将大量 WebGL API 组合到几个有限的接口中，
提升了编写 WebGL 应用的效率，将逻辑代码与 WebGL API 调用分离，提升代码的可阅读以及可维护性。

## Why TWGL?

根本原因是学习 WebGL，但是 WebGL 的的 API 那么多，实际使用中又有很多实践经验，
所以选择一个成熟的 WebGL 类库，学习它的源码，能够从中获得很多WebGL的实践经验。
现在 WebGL 相关的开源库非常多，最火的就是`three.js`了，为什么不学习它呢？

`three.js`实际上是一个三维库，主要使用 WebGL 实现常用的三维库的功能，
更侧重于三维库中的三维内容（场景，相机，Mash，光照，材质等）的实现。
而 WebGL 只是一个光栅化引擎，WebGL 对于 `three.js` 就像 OpenGL ES 对于 OpenGL。
更多相关信息可以看[这里](https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-2d-vs-3d-library.html)。

假如你想做出三维应用，又不想涉及太多底层知识，那么成熟的三维库`three.js`就是你最好的选择。
但是如果你想学习更底层的东西，想从基础理论去了解基于 WebGL 的二维/三维库的实现原理，
那么学习 WebGL 就是正确的选择，如果你还不了解 WebGL，你可以看看[WebGL Fundamentals 中文版](https://webglfundamentals.org/webgl/lessons/zh_cn/)。
而 `twgl.js` 则在你了解 WebGL 的原理以后，提供浅层封装帮助你更好的利用 WebGL。

而此系列文章是在你学习完 WebGL 基础原理以后，通过对`twgl.js`的源码进行分析，
学习 WebGL 代码在实际使用中的组织和重构技巧。

## What should I konw first?

* 有一定的 JavaScript 基础
* 熟悉 WebGL 的使用，基础 2D/3D 的实现

如果你还不了解 WebGL，可以在[WebGL Fundamentals 中文版](https://webglfundamentals.org/webgl/lessons/zh_cn/)中学习所有相关技术。

## Table of Contents

* Todos

## License

[BSD 2-clause](./LICENSE)