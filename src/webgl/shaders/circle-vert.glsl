attribute float a_vertexId;
uniform float u_numVerts;
uniform vec2 u_resolution;

#define PI radians(180.0)

void main() {
    float numSlices = 125.0;
    float sliceId = floor(a_vertexId / 3.0);
    float triVertexId = mod(a_vertexId, 3.0);
    float edge = triVertexId + sliceId;
    float angleU = edge / numSlices;  // 0.0 to 1.0
    float angle = angleU * PI * 2.0;
    float radius = step(triVertexId, 1.5);
    vec2 pos = vec2(cos(angle), sin(angle)) * radius;

    float aspect = u_resolution.y / u_resolution.x;
    vec2 scale = vec2(aspect, 1);

    gl_Position = vec4(pos * scale, 0, 1);
}