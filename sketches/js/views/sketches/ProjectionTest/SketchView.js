import {BaseSketch} from '../../BaseSketch.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';

export default class SketchView extends BaseSketch {

    constructor() {
        super('ProjectionTest');

        LoadingUtils.LoadShaders(['assets/glsl/vert.glsl', 'assets/glsl/screen_vert.glsl', 'assets/glsl/diffuse_frag.glsl']).then(src => {

            this.buffer = CanvasUtils.CreateBufferWebGL({alpha: false, premultipliedAlpha: false});
            this.el.appendChild(this.buffer.canvas);

            this.mousePos = {
                x: 0.5,
                y: 0.5
            };

            this.programInfo = twgl.createProgramInfo(this.buffer.ctx, [src[0], src[2]]);
            this.screenProgInfo = twgl.createProgramInfo(this.buffer.ctx, [src[1], src[2]]);

            this.createVideo();
            this.createPlayButton();
            this.createProjectorSource(src);
            this.createProjectionScreen(src);

            this.onResize(window.innerWidth, window.innerHeight);

        });
    }

    createVideo() {

        this.video = document.createElement('video');
        this.video.src = 'assets/Black and White 8mm Footage.mp4';
        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.volume = 0;
        this.video.currentTime = 5;
        this.video.addEventListener('playing', () => {
            this.copyVideo = true;
            this.playButton.style.display = 'none';
        }, true);
        this.video.addEventListener('ended', () => {
            this.video.currentTime = 5;
            this.copyVideo = false;
            this.video.play();
        }, true);

    }

    createPlayButton() {
        var playButton = document.createElement('button');
        playButton.style.width = '100px';
        playButton.style.height = '100px';
        playButton.style.position = 'absolute';

        playButton.style.top = '50%';
        playButton.style.left = '50%';
        playButton.style.backgroundImage = 'url(assets/play_button.png)';
        playButton.style.backgroundSize = 'contain';
        playButton.style.backgroundColor = '#ffffff00';
        playButton.style.border = '0';

        this.el.appendChild(playButton);
        playButton.onclick = () => {
            this.video.play();
        };
        this.playButton = playButton;
    }

    createProjectionScreen(src) {

        var gl = this.buffer.ctx;
        this.videoTexture = twgl.createTexture(gl, {
            src: [0, 0, 255],
            format: gl.RGB,
            min: gl.LINEAR,
            wrap: gl.CLAMP_TO_EDGE,
        });//twgl.createTexture(this.buffer.ctx, {src: 'assets/glare.png'});

        this.screens = [];
        var numScreens = 10;
        var distance = 90 / numScreens;
        for (var i = 0; i < numScreens; i++) {
            var scale = Math.random();
            var translation = [(Math.random() * 2 - 1) * 1, (i / numScreens) * distance, (Math.random() * 2 - 1) * 1];
            var plane = twgl.primitives.createPlaneBufferInfo(this.buffer.ctx, 2, 2);
            this.screens.push({
                programInfo: this.screenProgInfo,
                bufferInfo: plane,
                uniforms: {
                    alpha: 0.2,
                    diffuse: this.videoTexture,
                    u_worldViewProjection: twgl.m4.identity(),
                    u_world: twgl.m4.identity(),
                    u_scale: scale,
                    u_transform: translation,
                    u_color: [1, 1, 1],
                },
                scale: scale,
                translation: translation
            });
        }

        /* var scale = 1;
         var translation = [0, 0, 0];
         var bufferInfo = twgl.primitives.createPlaneBufferInfo(this.buffer.ctx, 2, 2);
         this.bgScreen = {
             programInfo: this.programInfo,
             bufferInfo: bufferInfo,
             uniforms: {
                 alpha: 0.5,
                 diffuse: this.videoTexture,
                 u_worldViewProjection: twgl.m4.identity(),
                 u_world: twgl.m4.identity(),
                 u_scale: scale,
                 u_transform: translation,
                 u_color: [1, 1, 1]
             },
             scale: scale,
             translation: translation
         };*/
    }

    createProjectorSource(src) {

        var projectorSource = twgl.createTexture(this.buffer.ctx, {src: 'assets/glare.png'});

        var plane = twgl.primitives.createPlaneBufferInfo(this.buffer.ctx, 2, 2);
        this.projector = {
            programInfo: this.programInfo,
            bufferInfo: plane,
            uniforms: {
                alpha: 1,
                diffuse: projectorSource,
                u_worldViewProjection: twgl.m4.identity(),
                u_world: twgl.m4.identity()
            },
            translation: [0, 90, 0]
        };
    }

    draw(time) {

        if (this.buffer) {

            this.drawScene(time);

            super.draw(time);
        }

    }

    drawScene(time) {

        twgl.resizeCanvasToDisplaySize(this.buffer.canvas);
        this.buffer.ctx.viewport(0, 0, this.buffer.width, this.buffer.height);

        var gl = this.buffer.ctx;
        gl.enable(gl.BLEND);
        // gl.enable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var m4 = twgl.m4;
        var gl = this.buffer.ctx;

        var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 1000);
        //eye above scene
        var eye = [this.mousePos.x * -2 + 1, -5, this.mousePos.y * 2 - 1];

        var target = [0, 40, 0];
        var left = [0, 0, -1];
        var world = m4.identity();
        var mvp = m4.identity();
        var camera = m4.identity();
        var view = m4.identity();
        var viewProjection = m4.identity();

        //look down..
        m4.lookAt(eye, target, left, camera);
        m4.inverse(camera, view);
        m4.multiply(projection, view, viewProjection);
        m4.multiply(viewProjection, world, mvp);

        //projector bufferInfo
        var uni = this.projector.uniforms;
        var world = uni.u_world;
        m4.identity(world);
        m4.translate(world, this.projector.translation, world);
        m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);

        if (this.copyVideo) {
            gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.video);
            //this was crashing stuff...
            //this.videoTexture = twgl.createTexture(this.buffer.ctx, {src: this.video});
        }

        this.screens.forEach(obj => {
            //projection bufferInfo
            uni = obj.uniforms;
            var world = uni.u_world;
            m4.identity(world);
            //todo move this to vert
            var scale = (this.projector.translation[1] - obj.translation[1]) / this.projector.translation[1];
            scale *= obj.scale;

            m4.scale(world, [scale, scale, scale], world);
            m4.translate(world, obj.translation, world);
            m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);

            uni.u_projector = m4.getTranslation(this.projector.uniforms.u_world);
            uni.u_scale = obj.scale;
            uni.diffuse = this.videoTexture;
        });

        //bg screen
        /*uni = this.bgScreen.uniforms;
        var world = uni.u_world;
        m4.identity(world);
        //todo move this to vert
        m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);

        uni.u_projector = m4.getTranslation(this.projector.uniforms.u_world);

        if (this.copyVideo) {
            uni.diffuse = twgl.createTexture(this.buffer.ctx, {src: this.video});
        }*/

        var arr = this.screens.concat([this.projector]);
        twgl.drawObjectList(this.buffer.ctx, arr);

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