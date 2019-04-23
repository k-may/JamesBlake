#version 300 es
precision highp float;

uniform vec3 u_projector;
uniform float u_scale;
uniform vec3 u_transform;
uniform float u_rotation;

uniform mat4 u_worldViewProjection;

in vec4 position;
in vec2 texcoord;

out vec2 v_texCoord;
out vec2 v_videoTexCoord;
out vec4 v_position;
out float v_light;

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
    sin(_angle),cos(_angle));
}

void main(){

    v_texCoord = texcoord;

    v_texCoord -= vec2(0.5);
    v_texCoord *= rotate2d(-u_rotation);
    v_texCoord += vec2(0.5);

    float dScale = abs(position.z - u_projector.z) / u_projector.z;//.z - position.z;
    float scale = u_scale * (1. - dScale);
    float w = 1.;
    float w1 = (w * (1. - u_scale))/2.;
    vec2 translation = vec2(u_transform.x, u_transform.z) * u_scale * 0.5 + vec2(w1);

    v_videoTexCoord = texcoord;
    v_videoTexCoord *= u_scale;
    v_videoTexCoord += translation;

    v_light = 1.0 - distance(vec2(u_transform.x, u_transform.z), vec2(0.));

    v_position = (u_worldViewProjection * position);

    gl_Position = v_position;
}