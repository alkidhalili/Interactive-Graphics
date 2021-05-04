"use strict";

var shadedCube = function() {

var canvas;

var gl;

// enable barycenter,Enable fragment shading,turn light on/off,nalbe Bump texture,reduce Barycenter,change direction,start rotation
var barycenter_point = false;
var fragment = true;
var light_starter = true;
var Bump_texture =false;
var reducebarycenter =false;
var directionstart = true;
var rot_start = true;

// emissive color of light object
var emissive = vec4(0.5, 0.5,1.0,1.0);
//intializing the intial shape of light 
var nLight = 0;
var index = 0;
var lightLoc;
// Field-of-view in Y direction
var  fovy = 45.0;  
var  aspect;       
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var tangent = vec3(1.0, 0.0, 0.0);

// 3 lights iside cilinder
var lightPositions = [ vec4(-0.01, 0.9, 0.0, 0.01), 
vec4(0.01, 0.9, 0.0, 0.01),
vec4(0.01, 0.9, 0.02, 1.0) ];
// just used to randomize the colors
var colourIndex =3 ;
var texSize = 64;
var barycentre =[];
var positionsArray = [];
var normalsArray = [];
var texCoordsArray = [];
var tangentsArray = [];

// modelViewMatrix,projectionMatrix,modelViewMatrixLoc,projectionMatrixLoc
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var nMatrix, nMatrixLoc;
var viewerPos;
var program;

//Perspective projection properties
var perspective_proj =false
var near = 1.3;
var far = 100.0;
var radius = 8.0;
var zeta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/180.0;
var coordinate_of_texture = [ vec2(0, 0), vec2(0, 0.5), vec2(1, 0.5), vec2(1, 0)];

// ############# ----- Light Properties ----- #############
var ambient_Light = vec4(1.0, 1.0, 1.0, 1.0);
var diffuse_Light = vec4(0.7, 1.0, 0.5, 1.0);
var specular_Light = vec4(0.9, 0.5, 1.0, 1.0);

// ############# ----- Bump material properties ----- #############
var Ambient_light_material = vec4(1.0, 0.5, 1.0, 1.0);
var Diffuse_light_material = vec4(1.0, 0.8, 0.4, 1.0);
var Specular_light_material = vec4(0.7, 0.8, 0.0, 1.0);
var materialShininess = 10;

// initialize axes
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 1;
var theta = vec3(0, 0, 0);
var thetaLoc;

// Bump map texture creation
var image1 = new Array()
    for (var i =0; i<texSize; i++)  image1[i] = new Array();
    for (var i =0; i<texSize; i++)
        for ( var j = 0; j < texSize; j++)
           image1[i][j] = new Float32Array(4);
    for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
        
        var c = (((i & 0x13) == 0) ^ ((j & 0x3)  == 0));
        image1[i][j] = [Math.random()*(c),Math.random()*0.7 ,Math.random()*c, 1];
    }
var image2 = new Uint8Array(4*texSize*texSize);

    for (var i = 0; i < texSize; i++)
        for (var j = 0; j < texSize; j++)
           for(var k =0; k<4; k++)
                image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];

// ############### ----- Exercise 1- object vertices replacement ----- #################
// 20 vertices of my object
var vertices =[
 vec4(0.0, 0.0, 0.40, 1.0),
 vec4(0.55, 0.0, 0.32, 1.0),
 vec4(-0.20, 0.3, 0.32, 1.0),
 vec4(-0.20, -0.3, 0.32, 1.0),
 vec4(0.55, 0.3, 0.12, 1.0),
 vec4(0.55, -0.1, 0.12, 1.0),
 vec4(-0.62, 0.2, 0.12, 1.0),
 vec4(0.068, 0.5, 0.12, 1.0),
 vec4(0.068, -0.5, 0.12, 1.0),
 vec4(-0.62, -0.2, 0.12, 1.0),
 vec4(0.62, 0.2, -0.12, 1.0),
 vec4(0.62, -0.2, -0.12, 1.0),
 vec4(-0.14, 0.3, -0.12, 1.0),
 vec4(-0.06, 0.5, -0.12, 1.0),
 vec4(-0.07, -0.5, -0.12, 1.0),
 vec4(-0.55, -0.3, -0.12, 1.0),
 vec4(0.20, 0.3, -0.28, 1.0),
 vec4(0.62, -0.3, -0.28, 1.0),
 vec4(-0.48, 0.0, -0.28, 1.0),
 vec4(0.0, 0.0, -0.41, 1.0)];
//configuring the texture for images
function configureTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);}

// getting the texture Coord ,normals, tangents of all triangles
function triangle(a, b, c) {
    var t1 = subtract(b, a);
    var t2 = subtract(c, b);
    var normal = cross(t1, t2);
    normal = vec3(normal);
    tangent = t1;
    if(index % 2 == 0) {
        texCoordsArray.push(coordinate_of_texture[0])
        texCoordsArray.push(coordinate_of_texture[1])
        texCoordsArray.push(coordinate_of_texture[2])}
   else { texCoordsArray.push(coordinate_of_texture[0])
          texCoordsArray.push(coordinate_of_texture[2])
          texCoordsArray.push(coordinate_of_texture[3])}
    positionsArray.push(a);
    normalsArray.push(normal);
    tangentsArray.push(tangent);
    positionsArray.push(b);
    normalsArray.push(normal);
    tangentsArray.push(tangent);
    positionsArray.push(c);
    normalsArray.push(normal);
    tangentsArray.push(tangent);
    baryCenter(a,b,c)
    index += 3;
   if (colourIndex < 12){colourIndex+=3}
  else{colourIndex =3}}
  
// create the face by 3 triangles
function irregular_Obj(a, b, c, d,e ) {
    triangle(vertices[a], vertices[b],vertices[c]);
    triangle(vertices[a], vertices[c],vertices[d]);
    triangle(vertices[a], vertices[d],vertices[e]);    
}
// function that creates the 3d object
function created_object()
{
    irregular_Obj(0,1,4,7,2,0);
    irregular_Obj(0,2,6,9,3,0);
    irregular_Obj(0,3,8,5,1,0)
    irregular_Obj(1,5,11,10,4,0);
    irregular_Obj(2,7,13,12,6,0);
    irregular_Obj(3,9,15,14,8,0);
    irregular_Obj(4,10,16,13,7,0);
    irregular_Obj(5,8,14,17,11,0);
    irregular_Obj(6,12,18,15,9,0);
    irregular_Obj(10,11,17,19,16,0);
    irregular_Obj(12,13,16,19,18,0);
    irregular_Obj(14,15,18,19,17,0);
}

// ############### ----- Exercise 2- Barycenter of object ----- #################

// Calculating barycenter of each triangle of object, and then making new triangles from those and again calculating new barycenters till I converge 
// to the object barycenter
// Calculating Barycenter
function baryCenter(a, b, c){
	// finding the length of each of 3 segments of the triangle
     var l1 =Math.sqrt( Math.pow((b[0]-a[0]), 2) + Math.pow((b[1]-a[1]), 2)+ Math.pow((b[2]-a[2]), 2));
     var l2 =  Math.sqrt( Math.pow((c[0]-b[0]), 2) + Math.pow((c[1]-b[1]), 2)+ Math.pow((c[2]-b[2]), 2));
     var l3 =Math.sqrt( Math.pow((c[0]-a[0]), 2) + Math.pow((c[1]-a[1]), 2)+ Math.pow((c[2]-a[2]), 2));
	 
	 //finding the midpoint of each segment of triangle
     var mid_l1= [((b[0]+a[0])/2), ((b[1]+a[1])/2), ((b[2]+a[2])/2)];
     var mid_l2=[((c[0]+b[0])/2), ((c[1]+b[1])/2), ((c[2]+b[2])/2)];
     var mid_l3=  [((c[0]+a[0])/2), ((c[1]+a[1])/2), ((c[2]+a[2])/2)];
	 
	 // finding the barycenter of the triangle
     var x = ((l1*mid_l1[0])+ (l2*mid_l2[0]) + (l3*mid_l3[0])) / (l1+l2+l3);
     var y = ((l1*mid_l1[1])+ (l2*mid_l2[1]) + (l3*mid_l3[1])) / (l1+l2+l3);
     var z= ((l1*mid_l1[2])+ (l2*mid_l2[2]) + (l3*mid_l3[2])) / (l1+l2+l3);
     var bary  = vec4( x,y,z,1.0);
     barycentre.push(bary);
}
function reduce() {
    while (barycentre.length >1)// loop until 1 barycenter is left
		{
        if (barycentre.length<4)
        { reducebarycenter =true;
			// if there is only one barycenter this is the one of the object
			if (barycentre.length==1){break;}
            // if there are two barycenters left , I just compute the barecenter of the segment that they create, by finding  the average of x,y,z values.
			if (barycentre.length==2){
				var first_point_X=barycentre[0][0];
				var first_point_Y=barycentre[0][1];
				var first_point_Z=barycentre[0][2];
				var second_point_X=barycentre[1][0];
				var second_point_Y=barycentre[1][1];
				var second_point_Z=barycentre[1][2];
                var mid = [((second_point_X+first_point_X)/2), ((second_point_Y+first_point_Y)/2), ((second_point_Z+first_point_Z)/2),1.0];
				barycentre.push(mid);
                break;}
            // if there are 3 barycenter I just calculate the barycenter of the triangle that they create
			if (barycentre.length==3){baryCenter(barycentre[0],barycentre[1], barycentre[2]);}
}
    if (reducebarycenter) {break;}
    baryCenter(barycentre[0],barycentre[1], barycentre[2]);
    barycentre.splice(0,3);
      }
}

// ------------------------------------------------------------------------------------
// ################## ---------------- INIT function --------------- ##################
// ------------------------------------------------------------------------------------
init();

function init() {
    
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available");

    //Viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    //color of the background
    gl.clearColor(0.4, 0.4, 0.57, 1.0);
    // viewport aspect ratio
    aspect =  canvas.width/canvas.height;
    // hidden surface removal
    gl.enable(gl.DEPTH_TEST);
    
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    // activing the shaders for use
    gl.useProgram(program);
    
    // calling for all intailizing the geometry
    created_object();
    // functon for converging the nr of barycenters to 1,2 or 3.
    reduce();

    // creating the cylinder 
    var myCylinder = cylinder(45, 1, true);
    myCylinder.scale(0.1, 1.0, 0.1);
    myCylinder.rotate(0.0, [0, 1, 0]);
    myCylinder.translate(0.9, 0.0, 0.0);
	
	 
    positionsArray = positionsArray.concat(myCylinder.TriangleVertices);
    texCoordsArray = texCoordsArray.concat(myCylinder.TextureCoordinates);
    normalsArray = normalsArray.concat(myCylinder.TriangleNormals);
    nLight = myCylinder.TriangleVertices.length;
	

    for (var i = 0; i < nLight; i++){ tangentsArray.push(vec4(0,0,0,0));}
    
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var location_of_normals = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(location_of_normals, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location_of_normals);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var location_of_textcoords = gl.getAttribLocation( program, "aTexCoord");
    gl.vertexAttribPointer(location_of_textcoords, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location_of_textcoords);


    var tanBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tanBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tangentsArray), gl.STATIC_DRAW);

    var tanBufferLoc = gl.getAttribLocation( program, "uObjTangent");
    gl.vertexAttribPointer(tanBufferLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tanBufferLoc);
    
    //Configure the second image to add as texture
    configureTexture(image2);
    //uploading it to the GPU using the refrence indentifier
    gl.uniform1i( gl.getUniformLocation(program, "uTextureMap"), 0);
    
    //just getting the refrence identifier for theta rotation value
    thetaLoc = gl.getUniformLocation(program, "theta");
    viewerPos = vec3(0.0, 0.0, -20.0);

    //ortho projection
    projectionMatrix = ortho(-0.7, 0.7, -0.7, 0.7, -50, 50);

    var ambientProduct = mult(ambient_Light, Ambient_light_material);
    var diffuseProduct = mult(diffuse_Light, Diffuse_light_material);
    var specularProduct = mult(specular_Light, Specular_light_material);
    
    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),diffuseProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),specularProduct );
    gl.uniform4fv( gl.getUniformLocation(program,"uLightPosition1"),lightPositions[0]);
    gl.uniform4fv( gl.getUniformLocation(program,"uLightPosition2"),lightPositions[1]);
    gl.uniform4fv( gl.getUniformLocation(program, "uLightPosition3"),lightPositions[2]);
    gl.uniform4fv(gl.getUniformLocation(program, "uLightEmissive"), emissive);
    gl.uniform1f( gl.getUniformLocation(program,"uShininess"),      materialShininess );
    gl.uniform1i(gl.getUniformLocation(program, "uLightOn"),   light_starter);
    gl.uniform1i(gl.getUniformLocation(program, "ufragment"),   fragment);
    gl.uniform1i(gl.getUniformLocation(program, "uBump_rm"),  Bump_texture);
    
	// ####### ------ Buttons ------ ###########
    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("Button_Start_Rotation").onclick = function(){rot_start = !rot_start;};
    document.getElementById("barycenter_on").onclick = function(){barycenter_point = true; perspective_proj =false;};
	document.getElementById("barycenter_off").onclick = function(){barycenter_point = false; perspective_proj =false;};
    document.getElementById("Clockwise_Direction").onclick = function(){directionstart = true;};
	document.getElementById("Counterclockwise_Direction").onclick = function(){directionstart = false;};
    document.getElementById("perspective_proj").onclick = function(){perspective_proj =!perspective_proj;};
    document.getElementById("increase_z").onclick = function(){near  *= 2.0; far *= 2.0;perspective_proj =true;};
    document.getElementById("decrease_z").onclick = function(){near *= 0.5; far *= 0.5;perspective_proj =true;};
    document.getElementById("increase_r").onclick = function(){radius *= 2.0;perspective_proj =true;};
    document.getElementById("decrease_r").onclick = function(){radius *= 0.5;perspective_proj =true;};
    document.getElementById("increase_theta").onclick = function(){zeta += dr;perspective_proj =true;};
    document.getElementById("decrease_theta").onclick = function(){zeta -= dr;perspective_proj =true;};
    document.getElementById("increase_phi").onclick = function(){phi += dr;perspective_proj =true;};
    document.getElementById("decrease_phi").onclick = function(){phi -= dr;perspective_proj =true;};
    document.getElementById("Light").onclick = function(){light_starter= !light_starter;gl.uniform1i(gl.getUniformLocation(program, "uLightOn"),light_starter);};
	
    document.getElementById("FragmentShader").onclick = function(){fragment=true;gl.uniform1i(gl.getUniformLocation(program, "ufragment"),fragment);};
    document.getElementById("VertexShader").onclick = function(){fragment=false;Bump_texture=false;
        gl.uniform1i(gl.getUniformLocation(program, "uBump_rm"),  Bump_texture);gl.uniform1i(gl.getUniformLocation(program, "ufragment"),   fragment);};
    document.getElementById("Bump_texture").onclick = function(){Bump_texture=!Bump_texture;
        gl.uniform1i(gl.getUniformLocation(program, "uBump_rm"),   !Bump_texture);fragment=true;gl.uniform1i(gl.getUniformLocation(program, "ufragment"),   fragment);};
     
   
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"),  
            false, flatten(projectionMatrix));
    nMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");   
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    
    render();
}


// ------------------------------------------------------------------------------------
// ################## ---------------- RENDER function --------------- ################
// ------------------------------------------------------------------------------------
function render(){

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    modelViewMatrix = mat4();
    if(rot_start && directionstart) theta[axis] += 0.97;
    if(!directionstart){  if(rot_start) theta[axis] -= 0.97; }
    projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);
	// if perspective view is active then I make rotations around axes with perspective on
    if (perspective_proj){
		eye = vec3(radius*Math.sin(zeta)*Math.cos(phi),
        radius*Math.sin(zeta)*Math.sin(phi), radius*Math.cos(zeta));
        modelViewMatrix = lookAt(eye, at , up);
        projectionMatrix = perspective(fovy, aspect, near, far);
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));}
	
	// rotation around barycenter
    if (barycenter_point){       
        var len  = barycentre.length
		
		//rotation around barycenter and X-axis
		if (axis==0){
			modelViewMatrix = mult(translate(barycentre[len-1][0],barycentre[len-1][1],barycentre[len-1][2]),rotate(theta[xAxis], vec3(1, 0, 0)));
            modelViewMatrix = mult( modelViewMatrix,translate(-barycentre[len-1][0],-barycentre[len-1][1],-barycentre[len-1][2]));}
		//rotation around barycenter and Y-axis		
		if (axis==1){
			modelViewMatrix = mult(translate(barycentre[len-1][0],barycentre[len-1][1],barycentre[len-1][2]),rotate(theta[yAxis], vec3(0, 1, 0)));
            modelViewMatrix = mult( modelViewMatrix,translate(-barycentre[len-1][0],-barycentre[len-1][1],-barycentre[len-1][2]));}
		//rotation around barycenter and Z-axis
		if (axis==2){
			modelViewMatrix = mult(translate(barycentre[len-1][0],barycentre[len-1][1],barycentre[len-1][2]),rotate(theta[zAxis], vec3(0, 0, 1)));
            modelViewMatrix = mult( modelViewMatrix,translate(-barycentre[len-1][0],-barycentre[len-1][1],-barycentre[len-1][2]));}}
		  
        else{  modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));}
       
    nMatrix =normalMatrix(modelViewMatrix, true );
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"),false, flatten(projectionMatrix))
    gl.uniformMatrix4fv(gl.getUniformLocation(program,"uModelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix));
    gl.uniform4fv(gl.getUniformLocation(program,"uLightEmissive"), vec4(0,0,0,0));
    gl.drawArrays(gl.TRIANGLES, 0, index);

    gl.uniform4fv(gl.getUniformLocation(program,"uLightEmissive"), emissive);
    gl.drawArrays(gl.TRIANGLES, index, nLight);
    requestAnimationFrame(render);
}

}

shadedCube();
