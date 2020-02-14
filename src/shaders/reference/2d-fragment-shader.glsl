
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;
uniform vec4 u_color;

varying vec4 v_color;

void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
//    gl_FragColor = vec4(0.9, 0, 0.1, 1); // return redish-purple
//    u for input
//    gl_FragColor = u_color;
    gl_FragColor = v_color;

}
