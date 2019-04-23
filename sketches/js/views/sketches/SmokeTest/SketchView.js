import {BaseSketch} from '../../BaseSketch.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';

export default class SketchView extends BaseSketch {

    constructor() {
        super('SmokeTest');

        LoadingUtils.LoadShaders(['assets/smoke_test/glsl/smoke_vert.glsl', 'assets/smoke_test/glsl/smoke_frag.glsl']).then(src => {

            this.particles = [];

            this.buffer = CanvasUtils.CreateBufferWebGL({alpha: false, premultipliedAlpha: false});
            this.el.appendChild(this.buffer.canvas);
            this.programInfo = twgl.createProgramInfo(this.buffer.ctx, src);
            this.createProjectorSource(src);
            this.createSmoke(src);

            this.onResize(window.innerWidth, window.innerHeight);

        });
    }

    createProjectorSource(src) {

        var projectorSource = twgl.createTexture(this.buffer.ctx, {src: 'assets/glare.png'});

        var plane = twgl.primitives.createPlaneBufferInfo(this.buffer.ctx, 2, 2);
        this.projector = {
            programInfo: this.programInfo,
            bufferInfo: plane,
            uniforms: {
                diffuse: projectorSource,
                u_worldViewProjection: twgl.m4.identity(),
                u_world: twgl.m4.identity()
            },
            translation: [0, 90, 0]
        };
    }

    createSmoke(src) {

        var smokeTexture = twgl.createTexture(this.buffer.ctx, {src: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png'});
        var plane = twgl.primitives.createPlaneBufferInfo(this.buffer.ctx, 2, 2);

        for(var i =0; i < 1000; i ++) {
            this.particles.push({
                uniforms: {
                    diffuse: smokeTexture,
                    u_worldViewProjection: twgl.m4.identity(),
                    u_world: twgl.m4.identity(),
                },
                programInfo: this.programInfo,
                bufferInfo: plane,
                scale : Math.random() + 1,
                rotationY : Math.random() * Math.PI,
                rotationSpeed : Math.random()*0.001 - 0.0005,
                translation: [Math.random() * 10 - 5, Math.random() * 10 ,Math.random() * 10 - 5]//[Math.random() * 5 - 10, Math.random() * 1 + 10, 0]
            });
        }

    }

    draw(time) {

        if (this.buffer) {

            twgl.resizeCanvasToDisplaySize(this.buffer.canvas);
            this.buffer.ctx.viewport(0, 0, this.buffer.width, this.buffer.height);

            var gl = this.buffer.ctx;

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var m4 = twgl.m4;
            var gl = this.buffer.ctx;

            var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 1000);
            var eye = [0, -10, 0];
            var target = [0, 0, 0];
            var left = [0, 0, -1];
            var world = m4.identity();
            var mvp = m4.identity();
            var camera = m4.identity();
            var view = m4.identity();
            var viewProjection = m4.identity();

            m4.lookAt(eye, target, left, camera);
            m4.inverse(camera, view);
            m4.multiply(projection, view, viewProjection);
            m4.multiply(viewProjection, world, mvp);

            var uni = this.projector.uniforms;
            var world = uni.u_world;
            m4.identity(world);
            m4.translate(world, this.projector.translation, world);
            m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);

            this.particles.forEach(obj => {

                var uni = obj.uniforms;
                const world = uni.u_world;

                m4.identity(world);
                m4.scale(world, [obj.scale,obj.scale,obj.scale], world);
                m4.translate(world, obj.translation, world);
                obj.rotationY += obj.rotationSpeed;
                m4.rotateY(world, obj.rotationY, world);

                m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);
                
            });

            var arr = this.particles.concat([this.projector]);
            twgl.drawObjectList(this.buffer.ctx, arr);

            super.draw(time);
        }

    }

    onResize(w, h) {

        super.onResize(w, h);

        if (this.buffer)
            this.buffer.resize(w, h);
    }
}