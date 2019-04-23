#version 300 es
precision mediump float;

in vec3 position;
in vec2 texcoord;
out vec2 uv;

void main(){
    uv = texcoord;
    gl_Position = vec4(position.x, position.y, position.z, 1.0);
}