precision mediump float;

uniform mat4 u_worldViewProjection;

attribute vec4 position;
//in vec3 a_normal;
attribute vec2 texcoord;

varying vec2 v_texCoord;
varying vec4 v_position;

void main(){

    v_texCoord = texcoord;

    v_position = position;

    gl_Position = (u_worldViewProjection * position);
}

