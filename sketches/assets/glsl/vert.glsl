#version 300 es
precision mediump float;

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

    v_texCoord = texcoord;//vec2(texcoord.x, 1.0 - texcoord.y);

    //gl_Position = vec4(position.x, position.y, position.z, 1.0);
    v_position = (u_worldViewProjection * position);
    /*
        v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
        v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
        v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
    */

    gl_Position = v_position;
}