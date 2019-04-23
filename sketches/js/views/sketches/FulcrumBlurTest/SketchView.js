import {BaseSketch} from '../../BaseSketch.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';

var vs = `
attribute vec4 position;

uniform mat4 u_matrix;

void main() {
  gl_Position = u_matrix * position;
}
`;

var fs = `
precision mediump float;

uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
`;
var vsQuad = `
attribute vec4 position;
attribute vec2 texcoord;

varying vec2 v_texcoord;

void main() {
  gl_Position = position;
  v_texcoord = texcoord;
}
`;

var fsFade = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
uniform float u_mixAmount;
uniform vec4 u_fadeColor;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);
  gl_FragColor = mix(color, u_fadeColor, u_mixAmount);
}
`;

var fsCopy = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_texcoord);
}
`;

export default class SketchView extends BaseSketch {

    constructor() {
        super('FulcrumBlurTest');

        LoadingUtils.LoadShaders(['assets/glsl/vert_simple.glsl', 'assets/glsl/vert.glsl', 'assets/glsl/diffuse_frag.glsl', 'assets/glsl/fulcrum_frag.glsl']).then(src => {

            this.buffer = CanvasUtils.CreateBufferWebGL();
            this.el.appendChild(this.buffer.canvas);

            this.rotationY = 0;
            this.mousePos = {
                x: 0.5,
                y: 0.5
            };

            var gl = this.buffer.gl;

            this.fadeAttachments = [
                {format: gl.RGBA, min: gl.NEAREST, max: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE,},
                {format: gl.DEPTH_STENCIL},
            ];

            this.fb1 = twgl.createFramebufferInfo(this.buffer.gl, this.fadeAttachments);
            //   this.fb1.name = 'fb1';

            this.fb2 = twgl.createFramebufferInfo(this.buffer.gl, this.fadeAttachments);
            //  this.fb2.name = 'fb2';

            this.programInfo = twgl.createProgramInfo(gl, [vs, fs]);
            this.fadeProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsFade]);
            this.copyProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsCopy]);
            //unbind
            // twgl.bindFramebufferInfo(this.buffer.gl, null);
            this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
            // this.createPlane([src[0], src[2]]);

            this.createPyramid([src[1], src[3]]);

            this.onResize(window.innerWidth, window.innerHeight);
        });
    }

    createPlane(src) {
        var gl = this.buffer.gl;
        //var programInfo = twgl.createProgramInfo(gl, src);

        const arrays = {
            position: [-1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
            indices: [0, 1, 2, 2, 1, 3],
            texcoord: [0, 0, 0, 1, 1, 0, 1, 1]
        };

        var bufferInfo = twgl.createBufferInfoFromArrays(this.buffer.ctx, arrays);
        //var bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 2, 2);

        this.plane = {
            'programInfo': this.copyProgramInfo,//this.programInfo,
            'bufferInfo': bufferInfo,
            'diffuse': this.fb1.frameBuffer,
            'uniforms': {
                u_worldViewProjection: twgl.m4.identity(),
                u_world: twgl.m4.identity()
            }
        }
    }

    createPyramid(src) {

        // this.programInfo = twgl.createProgramInfo(this.buffer.gl, src);
        var arrays = {
            'position': [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0, 0, 0, -1],
            'indices': [
                0, 4, 1,
                1, 4, 3,
                3, 4, 2,
                2, 4, 0],
            'texcoord': [0, 0, 1, 0, 0, 1, 1, 1, 1, 1]
        };
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.buffer.gl, arrays);

        this.uniforms = {
            u_worldViewProjection: twgl.m4.identity(),
            u_world: twgl.m4.identity(),
            u_time: 0
        };

        this.pyramid = {
            'programInfo': this.programInfo,
            'bufferInfo': this.bufferInfo,
            'uniforms': {
                u_worldViewProjection: twgl.m4.identity(),
                u_world: twgl.m4.identity(),
                u_time: 0
            }
        };
    }

    //----------------------------------------

    draw(time) {
        if (this.buffer) {
            //   this.renderToFrameBuffer();
            if (twgl.resizeCanvasToDisplaySize(this.buffer.canvas)) {
                twgl.resizeFramebufferInfo(gl, this.fb1, this.fadeAttachments);
                twgl.resizeFramebufferInfo(gl, this.fb2, this.fadeAttachments);
            }

            var gl = this.buffer.ctx;
            var m4 = twgl.m4;
            var viewProjection = this.viewProjection();


            /*// gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.clearColor(0.1, 0.1, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            */

            twgl.bindFramebufferInfo(gl, this.fb1);
            //this.renderPyramid(time, viewProjection);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.clearColor(0.1, 0.1, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            //projector bufferInfo

            var uni = this.pyramid.uniforms;
            var world = m4.identity();
            m4.identity(world);
            //  m4.translate(world, [0,0,0], world);
            m4.scale(world, [1, 1, 8], world);
            m4.multiply(viewProjection, world, uni.u_worldViewProjection);

            this.buffer.gl.useProgram(this.pyramid.programInfo.program);

            twgl.setUniforms(this.pyramid.programInfo, {
                u_worldViewProjection: uni.u_worldViewProjection,
                u_world: world,
                u_time: time * 0.000005,

            });
            twgl.setBuffersAndAttributes(gl, this.pyramid.programInfo, this.pyramid.bufferInfo);
            twgl.drawBufferInfo(gl, this.pyramid.bufferInfo);

            //---------------------------------------

            /*  twgl.bindFramebufferInfo(gl, null);

              gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

              this.buffer.gl.useProgram(this.plane.programInfo.program);

              var radius = 1;// * anim
              twgl.setUniforms({
                  'diffuse': this.fb1.attachments[0],
                  'u_blur': false,
                  'u_direction': [radius, 0],
                  'u_resolution': [window.innerWidth, window.innerHeight, 0] // use framebufer.width?
              });

              twgl.setBuffersAndAttributes(gl, this.plane.programInfo, this.plane.bufferInfo);
              twgl.drawBufferInfo(gl, this.plane.bufferInfo);*/

            //---------------------------------------

            /* twgl.bindFramebufferInfo(gl, this.fb1);
             this.buffer.gl.useProgram(this.plane.programInfo.program);

             radius = 2;// * anim
             twgl.setUniforms({
                 'diffuse': this.fb2.attachments[0],
                 'u_blur': true,
                 'u_direction': [0, radius],
                 'u_resolution': [window.innerWidth, window.innerHeight, 0] // use framebufer.width?
             });
             twgl.setBuffersAndAttributes(gl, this.plane.programInfo, this.plane.bufferInfo);
             twgl.drawBufferInfo(gl, this.plane.bufferInfo);*/
            //this.renderPlane(time);
        }
    }

    drawPyramid() {
        var gl = this.buffer.ctx;
        var m4 = twgl.m4;
        var viewProjection = this.viewProjection();

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var uni = this.pyramid.uniforms;
        var world = m4.identity();
        m4.identity(world);
        m4.scale(world, [1, 1, 8], world);
        m4.multiply(viewProjection, world, uni.u_worldViewProjection);

        this.buffer.gl.useProgram(this.pyramid.programInfo.program);

        twgl.setUniforms(this.pyramid.programInfo, {
            u_worldViewProjection: uni.u_worldViewProjection,
            u_world: world,
            u_time: Date.now() * 0.000005,

        });
        twgl.setBuffersAndAttributes(gl, this.pyramid.programInfo, this.pyramid.bufferInfo);

        twgl.drawBufferInfo(gl, this.pyramid.bufferInfo);
    }

    renderPlane(time) {

        var gl = this.buffer.gl;

        twgl.bindFramebufferInfo(gl, this.fb2);
        this.buffer.gl.useProgram(this.plane.programInfo.program);

        var radius = 1;// * anim
        twgl.setUniforms({
            'diffuse': this.fb1.attachments[0],
            'u_blur': true,
            'u_direction': [radius, 0],
            'u_resolution': [window.innerWidth, window.innerHeight, 0] // use framebufer.width?
        });

        twgl.setBuffersAndAttributes(gl, this.plane.programInfo, this.plane.bufferInfo);
        twgl.drawBufferInfo(gl, this.plane.bufferInfo);


        twgl.bindFramebufferInfo(gl, this.fb1);
        this.buffer.gl.useProgram(this.plane.programInfo.program);

        radius = 2;// * anim
        twgl.setUniforms({
            'diffuse': this.fb2.attachments[0],
            'u_blur': true,
            'u_direction': [0, radius],
            'u_resolution': [window.innerWidth, window.innerHeight, 0] // use framebufer.width?
        });
        twgl.setBuffersAndAttributes(gl, this.plane.programInfo, this.plane.bufferInfo);
        twgl.drawBufferInfo(gl, this.plane.bufferInfo);

        /* var temp = this.fb1;
         this.fb1 = this.fb2;
         this.fb2 = temp;*/


        /*  var numPasses = 1;
        for (var i = 0; i < numPasses; i++) {

            // this.previous = this.currentFB;

             twgl.bindFramebufferInfo(gl, this.fb2);
             //  this.currentFB = this.currentFB == this.fb2 ? this.fb1 : this.fb2;

             gl.enable(gl.BLEND);
             gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
             gl.useProgram(this.plane.programInfo.program);
             gl.clearColor(0, 0, 0, 0);
             gl.clear(gl.COLOR_BUFFER_BIT);

             var radius = (numPasses - i - 1);// * anim

             twgl.setUniforms({
                 'diffuse': this.fb1.attachments[0],
                 'u_blur' : true,
                 'u_direction': i % 2 === 0 ? [radius, 0] : [0, radius],
                 'u_resolution': [window.innerWidth, window.innerHeight, 0] // use framebufer.width?
             });

             twgl.setBuffersAndAttributes(gl, this.plane.programInfo, this.plane.bufferInfo);
             twgl.drawBufferInfo(gl, this.plane.bufferInfo);

            /!* var temp = this.fb1;
             this.fb1 = this.fb2;
             this.fb2 = temp;*!/
         }

         gl.disable(gl.BLEND);

         //finally draw to canvas buffer
         twgl.bindFramebufferInfo(gl, null);

         gl.enable(gl.BLEND);
         gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

         gl.useProgram(this.plane.programInfo.program);
         twgl.setUniforms({
            'diffuse': this.fb2.attachments[0],
             'u_blur' : false
         });
         twgl.setBuffersAndAttributes(gl, this.plane.programInfo, this.plane.bufferInfo);
         twgl.drawBufferInfo(gl, this.plane.bufferInfo);*/

    }

    renderPyramid(time, viewProjection) {

        var gl = this.buffer.ctx;
        var m4 = twgl.m4;

        //projector bufferInfo
        var uni = this.pyramid.uniforms;
        var world = m4.identity();
        m4.identity(world);
        //  m4.translate(world, [0,0,0], world);
        m4.scale(world, [1, 1, 8], world);
        m4.multiply(viewProjection, world, uni.u_worldViewProjection);

        this.buffer.gl.useProgram(this.pyramid.programInfo.program);
        twgl.setUniforms(this.pyramid.programInfo, {
            u_worldViewProjection: uni.u_worldViewProjection,
            u_world: world,
            u_time: time * 0.000005,

        });
        twgl.setBuffersAndAttributes(gl, this.pyramid.programInfo, this.pyramid.bufferInfo);
        twgl.drawBufferInfo(gl, this.pyramid.bufferInfo);


    }

    viewProjection() {
        var gl = this.buffer.ctx;
        var m4 = twgl.m4;

        //convert between -1 and 1
        var rotation = this.mousePos.x * 2 - 1;
        this.rotationY += rotation;
        var xPos = Math.sin(this.rotationY * Math.PI / 180) * 20;
        var zPos = Math.cos(this.rotationY * Math.PI / 180) * 20;
        //eye above scene
        var eye = [xPos, -0.1, zPos];

        var target = [0, 0, -3];

        var top = [0, 1, 0];
        var world = m4.identity();
        var mvp = m4.identity();
        var camera = m4.identity();
        var view = m4.identity();
        var viewProjection = m4.identity();
        var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 1000);

        //look down..
        m4.lookAt(eye, target, top, camera);
        m4.inverse(camera, view);
        m4.multiply(projection, view, viewProjection);
        m4.multiply(viewProjection, world, mvp);

        return viewProjection;
    }

    onResize(w, h) {
        super.onResize(w, h);

        if (this.buffer)
            this.buffer.resize(w, h);
    }

    onMouseMove(e) {
        super.onMouseMove(e);

        this.mousePos = {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight
        };

    }
}