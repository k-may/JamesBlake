#version 300 es
precision highp float;

uniform vec3 u_projector;
uniform float u_scale;
uniform vec3 u_transform;

uniform mat4 u_worldViewProjection;
//uniform vec3 u_lightWorldPos;
//uniform mat4 u_world;
//uniform mat4 u_viewInverse;
//uniform mat4 u_worldInverseTranspose;

in vec4 position;
//in vec3 a_normal;
in vec2 texcoord;

out vec2 v_texCoord;
out vec4 v_position;
//out vec3 v_normal;
//out vec3 v_surfaceToLight;
//out vec3 v_surfaceToView;
//
void main(){

   /* float screenWidth = 2.0 * tan(0.523598)* dist;
    float screenHeight = screenWidth * 5.0/4.0;*/

    float dScale = abs(position.z - u_projector.z) / u_projector.z;//.z - position.z;
    float scale = u_scale * (1. - dScale);
    float w = 1.;
    float w1 = (w * (1. - u_scale))/2.;
    vec2 offset = vec2(u_transform.x, u_transform.z) * u_scale * 0.5 + vec2(w1);

    v_texCoord = texcoord;
    v_texCoord *= u_scale;
    v_texCoord += offset;

    //gl_Position = vec4(position.x, position.y, position.z, 1.0);
    v_position = (u_worldViewProjection * position);
    /*
        v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
        v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
        v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
    */

    gl_Position = v_position;
}