import {BaseSketch} from '../../BaseSketch.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';

export default class SketchView extends BaseSketch {

    constructor() {
        super('FulcrumTest');

        LoadingUtils.LoadShaders(['assets/glsl/vert.glsl', 'assets/glsl/fulcrum_frag.glsl']).then(src => {

            this.buffer = CanvasUtils.CreateBufferWebGL();
            this.el.appendChild(this.buffer.canvas);

            /*
                        this.fb1 = twgl.createFramebufferInfo(this.buffer.gl, [{ format : this.buffer.gl.RGBA}]);

                        //unbind
                        twgl.bindFramebufferInfo(this.buffer.gl, null);

                        this.planeProgramInfo = twgl.createProgramInfo(this.buffer.gl, [src[0], src[2]]);
                        this.planeBufferInfo = twgl.createPlaneBufferInfo(this.buffer.gl, 2 ,2);
            */


            this.createPyramid(src);

            this.onResize(window.innerWidth, window.innerHeight);
        });
    }

    createPyramid(src) {

        this.programInfo = twgl.createProgramInfo(this.buffer.gl, src);
        var arrays = {
            'position': [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0, 0, 0, -1],
            'indices': [0, 1, 2, 2, 3, 1,
                0, 4, 1,
                1, 4, 3,
                3, 4, 2,
                2, 4, 0],
            'texcoord': [0, 0, 1, 0, 0, 1, 1, 1, 1, 1]
        };
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.buffer.gl, arrays);

        this.mousePos = {
            x: 0.5,
            y: 0.5
        };

        this.rotationY = 0;

        this.uniforms = {
            u_worldViewProjection: twgl.m4.identity(),
            u_world: twgl.m4.identity(),
            u_time: 0
        };

        this.pyramid = {
            'programInfo': this.programInfo,
            'bufferInfo': this.bufferInfo,
            'uniforms': this.uniforms,
            'rotationY': this.rotationY
        };
    }

    draw(time) {
        if (this.buffer) {
            this.render(time);
        }
    }

    render(time) {

        twgl.resizeCanvasToDisplaySize(this.buffer.canvas);
        this.buffer.ctx.viewport(0, 0, this.buffer.width, this.buffer.height);

        var gl = this.buffer.ctx;
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.drawPyramid(time);
    }

    drawPyramid(time){

        var viewProjection = this.viewProjection();

        var gl = this.buffer.ctx;
        var m4 = twgl.m4;

        //projector bufferInfo
        var uni = this.pyramid.uniforms;
        var world = m4.identity();
        m4.identity(world);
        //  m4.translate(world, [0,0,0], world);
        m4.scale(world, [1, 1, 8], world);
        m4.multiply(viewProjection, world, uni.u_worldViewProjection);

        this.buffer.ctx.useProgram(this.pyramid.programInfo.program);
        twgl.setUniforms(this.pyramid.programInfo, {
            u_worldViewProjection: uni.u_worldViewProjection,
            u_world: world,
            u_time: time * 0.000005
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