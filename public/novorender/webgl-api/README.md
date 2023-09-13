<img src="https://novorender.com/wp-content/uploads/2021/06/novorender_logo_RGB_2021.png"/>

# [NovoRender](http://novorender.com/)

> A Web API for scalable 3D rendering in the cloud.

<!-- [![build-api](https://github.com/novorender/NovoRender-API/actions/workflows/build.yml/badge.svg)](https://github.com/novorender/NovoRender-API/actions/workflows/build.yml) -->

[![Latest NPM Version](https://img.shields.io/npm/v/@novorender/webgl-api.svg?label=@novorender/webgl-api)](https://www.npmjs.com/package/@novorender/webgl-api)  
Build version: 0.4.61  
Build date: Thu, 29 Jun 2023 19:13:09 GMT  

## Requirements

Novorender requires a modern web browser with [WebGL2](https://get.webgl.org/webgl2/) and
[WebAssembly](https://webassembly.org/) support.<br/>
<img height="64" src="https://www.khronos.org/assets/images/api_logos/webgl.svg"/>
<img height="64" src="https://upload.wikimedia.org/wikipedia/commons/1/1f/WebAssembly_Logo.svg"/>

## Dependencies

For linear algebra (vector and matrix math) we use the [gl-matrix](http://glmatrix.net/) library internally. Colors and 3D vectors are defined as `vec3` types, which equates to a array of `length=3`. If all you wish to do is to pass in parameters or read values, you may treat these types a regular array of numbers, i.e. you don't need the gl-matrix library itself for this. If you do wish to perform some linear algebra yourself, however, we recommend you do add it to your own code as well. Just make sure you use same major version as us (^3.3.0). Also note that we use Array instead of Float32Array for vector types, since this is more performant on most modern browsers: `glMatrix.setMatrixArrayType(Array);`

## Further information

For tutorials and more detailed documentation, please visit [docs.novorender.com](https://docs.novorender.com/)!
