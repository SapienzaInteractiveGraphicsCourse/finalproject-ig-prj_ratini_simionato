var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);


// AUX FUNCTIONS
function normalize(max, min){
    return (min/(max/100)/100)
}
function toRad(deg){return deg * Math.PI/180;}

// CHARACTER CONTROL
var  gameParameters = {
    "hAxis" : 0,
    "vAxis" : 0,
    "eAxis" : 0,
    "dt" : 0,
    "moveSpeed" : 20,
    "fallSpeed" : -10,
    "cameraDistance" : 2.0,
    "currentDistance" : 0,
    "camFactorX" : 1,
    "camFactorZ" : 0,
    "fw" : 0,
    "bw" : 0,
    "rt" : 0,
    "lt" : 0,
    "up" : 0,
    "dw" : 0,
    "relativePos" : {"x":0, "y":0, "z": 0},
    "isMoving" : false,
    "idleAnim" : null,
    "curCircle" : 0
}
function triggers_circles(char, circles, MAT_Circles, MAT_wireframe, spawn_point){
    var currentCircle = char._gameParameters["curCircle"];

    for(i = 0; i < circles.length; i++){
        if(circles[i].intersectsMesh(char,false)){
            var circle = parseInt(circles[i].name.split("Circle")[1]);
            if(circle == char._gameParameters["curCircle"]+1){
                char._gameParameters["curCircle"] = circle;
                circles[i].material= MAT_wireframe;

            }else if(circle == currentCircle){
            }else if(circle > char._gameParameters["curCircle"]+1){
                char._gameParameters["curCircle"] = 0;
                reset(char, spawn_point, MAT_Circles, circles);
            }
        }
    }

}
function animation_manager(char){
    if (!char._gameParameters["idleAnim"].isStarted){
        char._gameParameters["idleAnim"].play(true);
    }


}
function triggers_manager(char, last_circle, spawn_point, MAT_Circles, circles) {
    if(char.intersectsMesh(last_circle, false)) {
        if (char._gameParameters["curCircle"] == 18){
            window.location = "../index.html";
        } else {
            reset(char, spawn_point, MAT_Circles, circles);
        }
    }
}
function reset(char, spawn_point, MAT_Circles, circles){
    for(i = 0; i<circles.length; i++){
        circles[i].material = MAT_Circles;
    }
     char.position = new BABYLON.Vector3(spawn_point.x, spawn_point.y, spawn_point.z);


}
function state_manager(char){
        if (char._gameParameters["vAxis"] != 0 || char._gameParameters["hAxis"] != 0) {
            char._gameParameters["isMoving"] = true;
        }else{
            char._gameParameters["isMoving"] = false;
        }
}
function update_gameparameters(char, scene){
    var hAxis = char._gameParameters["hAxis"];
    var vAxis = char._gameParameters["vAxis"];
    var eAxis = char._gameParameters["eAxis"];
    var dir = 0;
    if(vAxis == 0 && hAxis == 0){ char.rotation.x = toRad(0);}
    else if(vAxis == -1 && hAxis == 0){char.rotation.x = toRad(0);}// W
    else if(vAxis == 1 && hAxis == 0){char.rotation.x = toRad(0);}// S
    else if(vAxis == 0 && hAxis == -1){char.rotation.x = toRad(10);} // A
    else if(vAxis == 0 && hAxis == 1){char.rotation.x = toRad(-10);} // D
    else if(vAxis == -1 && hAxis == -1){char.rotation.x = toRad(10);} //WA
    else if(vAxis == -1 && hAxis == 1){char.rotation.x = toRad(-10);} // WD
    else if(vAxis == 1 && hAxis == -1){char.rotation.x = toRad(10);} //SA
    else if(vAxis == 1 && hAxis == 1){char.rotation.x = toRad(-10);} //SD

    if(eAxis == 0) {char.rotation.z = toRad(0);}
    else if(eAxis == 1){char.rotation.z = toRad(10);}
    else if(eAxis == -1) {char.rotation.z = toRad(-10);}

    char.rotation.y =  Math.PI  - scene.activeCamera.alpha; // + toRad(dir);
    char._gameParameters["relativePos"].x = (char.position.x - scene.activeCamera.position.x) * -1;
    char._gameParameters["relativePos"].z = (char.position.z - scene.activeCamera.position.z) * -1;

    var relativePos = char._gameParameters["relativePos"];
    var moveSpeed = char._gameParameters["moveSpeed"]

    char._gameParameters["currentDistance"] = Math.sqrt((relativePos.x*relativePos.x) + (relativePos.z*relativePos.z));
    char._gameParameters["camFactorX"] = normalize(char._gameParameters["currentDistance"] , relativePos.x);
    char._gameParameters["camFactorZ"] = normalize(char._gameParameters["currentDistance"] , relativePos.z);
    char._gameParameters["dt"] = engine.getDeltaTime()/1000;
    char._gameParameters["fw"] = vAxis*char._gameParameters["camFactorX"]*char._gameParameters["dt"]*moveSpeed;
    char._gameParameters["bw"] = vAxis*char._gameParameters["camFactorZ"]*char._gameParameters["dt"]*moveSpeed;
    char._gameParameters["lt"] = (hAxis*char._gameParameters["camFactorX"]*char._gameParameters["dt"]*moveSpeed);
    char._gameParameters["rt"] = (hAxis*char._gameParameters["camFactorZ"]*char._gameParameters["dt"]*moveSpeed)*-1;
    char._gameParameters["up"] =  eAxis*char._gameParameters["dt"]*moveSpeed;
}
function create_materials(scene, OBJ_Carpet, OBJ_Char){
    var MAT_Head = new BABYLON.StandardMaterial("MAT_Head", scene);
    MAT_Head.diffuseTexture = new BABYLON.Texture("../L3/texture000.jpg", scene);
    MAT_Head.specularColor = new BABYLON.Color3(0,0,0);
    var head = scene.getMeshByName("Head");
    head.material = MAT_Head;

    var MAT_Albero1 = new BABYLON.StandardMaterial("MAT_Albero1", scene);
    MAT_Albero1.diffuseColor = new BABYLON.Color3(0, 0.1, 0);
    MAT_Albero1.specularColor = new BABYLON.Color3(0, 0.1, 0);
    var albero1 = scene.getMeshByName("OBJ_Tree1");
    albero1.material = MAT_Albero1;

    var MAT_Albero2 = new BABYLON.StandardMaterial("MAT_Albero2", scene);
    MAT_Albero2.diffuseColor = new BABYLON.Color3(0.05, 0.04, 0);
    MAT_Albero2.specularColor = new BABYLON.Color3(0.05, 0.04, 0);
    var albero2 = scene.getMeshByName("OBJ_Tree2");
    albero2.material = MAT_Albero2;

    var MAT_Albero3 = new BABYLON.StandardMaterial("MAT_Albero3", scene);
    MAT_Albero3.diffuseColor = new BABYLON.Color3(0.01, 0.06, 0.03);
    MAT_Albero3.specularColor = new BABYLON.Color3(0.01, 0.06, 0.03);
    var albero3 = scene.getMeshByName("OBJ_Tree3");
    albero3.material = MAT_Albero3;

    var MAT_Albero4 = new BABYLON.StandardMaterial("MAT_Albero4", scene);
    MAT_Albero4.diffuseColor = new BABYLON.Color3(0.06, 0.03, 0);
    MAT_Albero4.specularColor = new BABYLON.Color3(0.06, 0.03, 0);
    var albero4 = scene.getMeshByName("OBJ_Tree4");
    albero4.material = MAT_Albero4;

    var MAT_Albero5 = new BABYLON.StandardMaterial("MAT_Albero5", scene);
    MAT_Albero5.diffuseColor = new BABYLON.Color3(0, 0.4, 0);
    MAT_Albero5.specularColor = new BABYLON.Color3(0, 0.4, 0);
    var albero5 = scene.getMeshByName("OBJ_Tree5");
    albero5.material = MAT_Albero5;

    var MAT_Albero6 = new BABYLON.StandardMaterial("MAT_Albero6", scene);
    MAT_Albero6.diffuseColor = new BABYLON.Color3(0.25, 0.5, 0.16);
    MAT_Albero6.specularColor = new BABYLON.Color3(0.25, 0.5, 0.16);
    var albero6 = scene.getMeshByName("OBJ_Tree6");
    albero6.material = MAT_Albero6;

    var MAT_Albero7 = new BABYLON.StandardMaterial("MAT_Albero7", scene);
    MAT_Albero7.diffuseColor = new BABYLON.Color3(0.01, 0.02, 0);
    MAT_Albero7.specularColor = new BABYLON.Color3(0.01, 0.02, 0);
    var albero7 = scene.getMeshByName("OBJ_Tree7");
    albero7.material = MAT_Albero7;
    var dec_tree = scene.getMeshByName("OBJ_Dec_tree");
    dec_tree.material = MAT_Albero7;

    var MAT_Albero8 = new BABYLON.StandardMaterial("MAT_Albero8", scene);
    MAT_Albero8.diffuseColor = new BABYLON.Color3(0.5, 0.34, 0.11);
    MAT_Albero8.specularColor = new BABYLON.Color3(0.5, 0.34, 0.11);
    var albero8 = scene.getMeshByName("OBJ_Tree8");
    albero8.material = MAT_Albero8;

    var MAT_Albero9 = new BABYLON.StandardMaterial("MAT_Albero9", scene);
    MAT_Albero9.diffuseColor = new BABYLON.Color3(0.01, 0.08, 0);
    MAT_Albero9.specularColor = new BABYLON.Color3(0.01, 0.08, 0);
    var albero9 = scene.getMeshByName("OBJ_Tree9");
    albero9.material = MAT_Albero9;

    var MAT_Carpet = new BABYLON.StandardMaterial("MAT_Carpet", scene);
    MAT_Carpet.diffuseTexture = new BABYLON.Texture("../L3/Carpet_COL.jpg", scene);
    MAT_Carpet.backFaceCulling = false;
    var carpet = scene.getMeshByName("OBJ_Carpet");
    carpet.material = MAT_Carpet;

    var MAT_Circles = new BABYLON.StandardMaterial("MAT_Circles", scene);
    MAT_Circles.diffuseColor = new BABYLON.Color3(0.8, 0, 0);
    var circle1 = scene.getMeshByName("OBJ_Circle1");
    circle1.material = MAT_Circles;
    var circle2 = scene.getMeshByName("OBJ_Circle2");
    circle2.material = MAT_Circles;
    var circle3 = scene.getMeshByName("OBJ_Circle3");
    circle3.material = MAT_Circles;
    var circle4 = scene.getMeshByName("OBJ_Circle4");
    circle4.material = MAT_Circles;
    var circle5 = scene.getMeshByName("OBJ_Circle5");
    circle5.material = MAT_Circles;
    var circle6 = scene.getMeshByName("OBJ_Circle6");
    circle6.material = MAT_Circles;
    var circle7 = scene.getMeshByName("OBJ_Circle7");
    circle7.material = MAT_Circles;
    var circle8 = scene.getMeshByName("OBJ_Circle8");
    circle8.material = MAT_Circles;
    var circle9 = scene.getMeshByName("OBJ_Circle9");
    circle9.material = MAT_Circles;
    var circle10 = scene.getMeshByName("OBJ_Circle10");
    circle10.material = MAT_Circles;
    var circle11 = scene.getMeshByName("OBJ_Circle11");
    circle11.material = MAT_Circles;
    var circle12 = scene.getMeshByName("OBJ_Circle12");
    circle12.material = MAT_Circles;
    var circle13 = scene.getMeshByName("OBJ_Circle13");
    circle13.material = MAT_Circles;
    var circle14 = scene.getMeshByName("OBJ_Circle14");
    circle14.material = MAT_Circles;
    var circle15 = scene.getMeshByName("OBJ_Circle15");
    circle15.material = MAT_Circles;
    var circle16 = scene.getMeshByName("OBJ_Circle16");
    circle16.material = MAT_Circles;
    var circle17 = scene.getMeshByName("OBJ_Circle17");
    circle17.material = MAT_Circles;
    var circle18 = scene.getMeshByName("OBJ_Circle18");
    circle18.material = MAT_Circles;
    var circle19 = scene.getMeshByName("OBJ_Circle19");
    circle19.material = MAT_Circles;

    var MAT_Details = new BABYLON.StandardMaterial("MAT_Details", scene);
    MAT_Details.diffuseColor = new BABYLON.Color3(0.11, 0.02, 0);
    var OBJ_Details = scene.getMeshByName("OBJ_Details");
    OBJ_Details.material = MAT_Details;

    var MAT_Door = new BABYLON.StandardMaterial("MAT_Door", scene);
    MAT_Door.diffuseTexture = new BABYLON.Texture("../L3/door2.jpg", scene);
    var Door = scene.getMeshByName("OBJ_Door");
    Door.material = MAT_Door;

    var MAT_EgyptColumn = new BABYLON.StandardMaterial("MAT_EgyptColumn", scene);
    MAT_EgyptColumn.diffuseTexture = new BABYLON.Texture("../L3/egyptColText.jpg", scene);
    MAT_EgyptColumn.diffuseTexture.uScale = 4;
    MAT_EgyptColumn.diffuseTexture.vScale = 4.1;
    var Column1 = scene.getMeshByName("OBJ_Column1");
    Column1.material = MAT_EgyptColumn;
    var Column2 = scene.getMeshByName("OBJ_Column2");
    Column2.material = MAT_EgyptColumn;
    var Ruin2 = scene.getMeshByName("OBJ_Ruin2");
    Ruin2.material = MAT_EgyptColumn;

    var MAT_Gold = new BABYLON.StandardMaterial("MAT_Gold", scene);
    MAT_Gold.diffuseColor = new BABYLON.Color3(0.65, 0.42, 0);
    var Gold = scene.getMeshByName("OBJ_Gold");
    Gold.material = MAT_Gold;

    var MAT_MetallicRed = new BABYLON.StandardMaterial("MAT_MetallicRed", scene);
    MAT_MetallicRed.diffuseColor = new BABYLON.Color3(0.129886, 0, 0);
    var MetallicRed = scene.getMeshByName("OBJ_MetallicRed");
    MetallicRed.material = MAT_MetallicRed;

    var MAT_Mountain_Terrain = new BABYLON.StandardMaterial("MAT_Mountain_Terrain", scene);
    MAT_Mountain_Terrain.diffuseTexture = new BABYLON.Texture("../L3/MountLake_DIF.png", scene);
    var Mountain_Terrain = scene.getMeshByName("OBJ_Mountain_Terrain");
    Mountain_Terrain.material = MAT_Mountain_Terrain;

    var MAT_Mountains = new BABYLON.StandardMaterial("MAT_Mountains", scene);
    MAT_Mountains.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    MAT_Mountains.specularTexture = new BABYLON.Texture("../L3/Rock1_SPE.png", scene);
    MAT_Mountains.bumpTexture = new BABYLON.Texture("../L3/Rock1_NOR.png", scene);
    MAT_Mountains.specularTexture.level = 0.1;
    MAT_Mountains.bumpTexture.level = 0.1;
    MAT_Mountains.specularTexture.uScale = 5;
    MAT_Mountains.specularTexture.vScale = 5;
    MAT_Mountains.bumpTexture.uScale = 5;
    MAT_Mountains.bumpTexture.vScale = 5;
    var Mountains = scene.getMeshByName("OBJ_Mountains");
    Mountains.material = MAT_Mountains;

    var MAT_Pilastri = new BABYLON.StandardMaterial("MAT_Pilastri", scene);
    MAT_Pilastri.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.35);
    var Pilastri = scene.getMeshByName("OBJ_Pilastri");
    Pilastri.material = MAT_Pilastri;

    var MAT_Pyramid = new BABYLON.StandardMaterial("MAT_Pyramid", scene);
    MAT_Pyramid.diffuseTexture = new BABYLON.Texture("../L3/pyramidTexture.jpg", scene);
    MAT_Pyramid.diffuseTexture.uScale = 5;
    MAT_Pyramid.diffuseTexture.vScale = 5;
    var Pyramids = scene.getMeshByName("OBJ_Pyramid");
    Pyramids.material = MAT_Pyramid;

    var MAT_Ringhiere = new BABYLON.StandardMaterial("MAT_Ringhiere", scene);
    MAT_Ringhiere.diffuseColor = new BABYLON.Color3(0.46, 0.7, 0.8);
    var Grata = scene.getMeshByName("OBJ_Grata");
    Grata.material = MAT_Ringhiere;

    var MAT_Rock1 = new BABYLON.StandardMaterial("MAT_Rock1", scene);
    MAT_Rock1.diffuseTexture = new BABYLON.Texture("../L3/Rock1_DIF.png", scene);
    MAT_Rock1.specularTexture = new BABYLON.Texture("../L3/Rock1_SPE.png", scene);
    MAT_Rock1.bumpTexture = new BABYLON.Texture("../L3/Rock1_NOR.png", scene);
    MAT_Rock1.specularTexture.level = 0.3;
    MAT_Rock1.bumpTexture.level = 0.3;
    MAT_Rock1.diffuseTexture.uScale = 2;
    MAT_Rock1.diffuseTexture.vScale = 2;
    var Rocks1 = scene.getMeshByName("OBJ_Rocks1");
    Rocks1.material = MAT_Rock1;

    var MAT_Rock2 = new BABYLON.StandardMaterial("MAT_Rock2", scene);
    MAT_Rock2.diffuseTexture = new BABYLON.Texture("../L3/Rock2_DIF.png", scene);
    MAT_Rock2.specularTexture = new BABYLON.Texture("../L3/Rock1_SPE.png", scene);
    MAT_Rock2.bumpTexture = new BABYLON.Texture("../L3/Rock1_NOR.png", scene);
    MAT_Rock2.specularTexture.level = 0.3;
    MAT_Rock2.bumpTexture.level = 0.3;
    MAT_Rock2.diffuseTexture.uScale = 2;
    MAT_Rock2.diffuseTexture.vScale = 2;
    var Rocks2 = scene.getMeshByName("OBJ_Rocks2");
    Rocks2.material = MAT_Rock2;

    var MAT_Rock3 = new BABYLON.StandardMaterial("MAT_Rock3", scene);
    MAT_Rock3.diffuseTexture = new BABYLON.Texture("../L3/Rock3_DIF.png", scene);
    MAT_Rock3.specularTexture = new BABYLON.Texture("../L3/Rock1_SPE.png", scene);
    MAT_Rock3.bumpTexture = new BABYLON.Texture("../L3/Rock1_NOR.png", scene);
    MAT_Rock3.specularTexture.level = 0.3;
    MAT_Rock3.bumpTexture.level = 0.3;
    MAT_Rock3.diffuseTexture.uScale = 2;
    MAT_Rock3.diffuseTexture.vScale = 2;
    var Rocks3 = scene.getMeshByName("OBJ_Rocks3");
    Rocks3.material = MAT_Rock3;

    var MAT_Ruin1 = new BABYLON.StandardMaterial("MAT_Ruin1", scene);
    MAT_Ruin1.diffuseTexture = new BABYLON.Texture("../L3/Ruin1_DIF.png", scene);
    var Ruin1 = scene.getMeshByName("OBJ_Ruin1");
    Ruin1.material = MAT_Ruin1;

    var MAT_Ruin3 = new BABYLON.StandardMaterial("MAT_Ruin3", scene);
    MAT_Ruin3.diffuseTexture = new BABYLON.Texture("../L3/Ruin3_DIF.png", scene);
    var Ruin3 = scene.getMeshByName("OBJ_Ruin3");
    Ruin3.material = MAT_Ruin3;

    var MAT_Sand = new BABYLON.StandardMaterial("MAT_Sand", scene);
    MAT_Sand.diffuseTexture = new BABYLON.Texture("../L3/Sand_DIF.png", scene);
    MAT_Sand.bumpTexture = new BABYLON.Texture("../L3/Sand_NOR.png", scene);
    MAT_Sand.specularColor =  new BABYLON.Color3(0.1, 0.1, 0.1);
    MAT_Sand.bumpTexture.level = 0.1;
    var Desert = scene.getMeshByName("OBJ_Desert");
    Desert.material = MAT_Sand;
    var Sand1 = scene.getMeshByName("OBJ_Sand1");
    Sand1.material = MAT_Sand;
    var Sand2 = scene.getMeshByName("OBJ_Sand2");
    Sand2.material = MAT_Sand;

    var MAT_Terrain = new BABYLON.StandardMaterial("MAT_Terrain", scene);
    MAT_Terrain.diffuseTexture = new BABYLON.Texture("../L3/Terrain_DIF.png", scene);
    MAT_Terrain.specularTexture = new BABYLON.Texture("../L3/Terrain_SPE.png", scene);
    MAT_Terrain.bumpTexture = new BABYLON.Texture("../L3/Terrain_NOR.png", scene);
    MAT_Terrain.specularTexture.level = 0.01
    MAT_Terrain.bumpTexture.level = 0.1;
    var Terrain_Lake = scene.getMeshByName("OBJ_Terrain_Lake");
    Terrain_Lake.material = MAT_Terrain;
    var Terrain_extra = scene.getMeshByName("OBJ_Terrain_extra");
    Terrain_extra.material = MAT_Terrain;

    var MAT_TerrainDesert = new BABYLON.StandardMaterial("MAT_TerrainDesert", scene);
    MAT_TerrainDesert.diffuseTexture = new BABYLON.Texture("../L3/LakeDesert_DIF.png", scene);
    MAT_TerrainDesert.specularTexture = new BABYLON.Texture("../L3/LakeDesert_SPE.png", scene);
    MAT_TerrainDesert.bumpTexture = new BABYLON.Texture("../L3/LakeDesert_NOR.png", scene);
    MAT_TerrainDesert.specularTexture.level = 0.01;
    MAT_TerrainDesert.bumpTexture.level = 0.3;
    var Terrain_Desert = scene.getMeshByName("OBJ_Terrain_Desert");
    Terrain_Desert.material = MAT_TerrainDesert;

    var MAT_Wall = new BABYLON.StandardMaterial("MAT_Wall", scene);
    MAT_Wall.diffuseColor = new BABYLON.Color3(0.57, 0.60, 0.59);
    var Platform = scene.getMeshByName("OBJ_Platform");
    Platform.material = MAT_Wall;

    // Water
    var lake_terrain = scene.getMeshByName("OBJ_Terrain_Lake");
    var waterMesh = BABYLON.Mesh.CreateGround("waterMesh", 135, 68, 32, scene, false);
    waterMesh.position.x = lake_terrain.position.x;
    waterMesh.position.y = lake_terrain.position.y-1;
    waterMesh.position.z = lake_terrain.position.z;
    var MAT_water = new BABYLON.WaterMaterial("MAT_water", scene, new BABYLON.Vector2(512, 512));
    MAT_water.bumpTexture = new BABYLON.Texture("../L3/waterbump.png", scene);
    MAT_water.windForce = -15;
    MAT_water.waveHeight = 0.1;
    MAT_water.windDirection = new BABYLON.Vector2(1, 1);
    MAT_water.waterColor = new BABYLON.Color3(0.3, 0.3, 0.65);
    MAT_water.colorBlendFactor = 0.3;
    MAT_water.bumpHeight = 0.1;
    MAT_water.waveLength = 0.1;
    MAT_water.addToRenderList(lake_terrain);
    MAT_water.addToRenderList(OBJ_Carpet);
    MAT_water.addToRenderList(OBJ_Char);
    waterMesh.material = MAT_water;

}

// ANIMATIONS
function idleAnimation(parts){
    var idleGroup = new BABYLON.AnimationGroup("idle");
    var hIdle = new BABYLON.Animation("idle_head", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var nIdle = new BABYLON.Animation("idle_neck", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var ubIdle = new BABYLON.Animation("idle_upper_body", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lbIdle = new BABYLON.Animation("idle_lower_body", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rIdle = new BABYLON.Animation("idle_root", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var luaIdle = new BABYLON.Animation("idle_left_upper_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var llaIdle = new BABYLON.Animation("idle_left_lower_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lhIdle = new BABYLON.Animation("idle_left_hand", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var ruaIdle = new BABYLON.Animation("idle_right_upper_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rlaIdle = new BABYLON.Animation("idle_right_lower_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rhIdle = new BABYLON.Animation("idle_right_hand", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lulIdle = new BABYLON.Animation("idle_left_upper_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lllIdle = new BABYLON.Animation("idle_left_lower_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lsIdle = new BABYLON.Animation("idle_left_shoe", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rulIdle = new BABYLON.Animation("idle_right_upper_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rllIdle = new BABYLON.Animation("idle_right_lower_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rsIdle = new BABYLON.Animation("idle_right_shoe", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    var hKeys = [];
    var nKeys = [];
    var ubKeys = [];
    var lbKeys = [];
    var rKeys = [];
    var luaKeys = [];
    var llaKeys = [];
    var lhKeys = [];
    var ruaKeys = [];
    var rlaKeys = [];
    var rhKeys = [];
    var lulKeys = [];
    var lllKeys = [];
    var lsKeys = [];
    var rulKeys = [];
    var rllKeys = [];
    var rsKeys = [];

    // Head keys
    {hKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        hKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        hKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        hKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        hKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        hIdle.setKeys(hKeys);}

    // Neck keys
    {nKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        nKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        nKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        nKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        nKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        nIdle.setKeys(nKeys);}

    // Upper_Body keys
    {ubKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        ubKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        ubKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        ubKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        ubKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        ubIdle.setKeys(ubKeys);}

    // Lower_Body keys
    {lbKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        lbKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        lbKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        lbKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        lbKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        lbIdle.setKeys(lbKeys);}

    // Root_Body keys
    {rKeys.push({frame: 1,value: new BABYLON.Vector3(0, 0.13, 0)});
        rKeys.push({frame: 8,value:  new BABYLON.Vector3(0, 0.13, 0)});
        rKeys.push({frame: 15,value:  new BABYLON.Vector3(0, 0.13, 0)});
        rKeys.push({frame: 23,value:  new BABYLON.Vector3(0, 0.13, 0)});
        rKeys.push({frame: 30,value:  new BABYLON.Vector3(0, 0.13, 0)});
        rIdle.setKeys(rKeys);}



    // Left_Upper_Arm keys
    {luaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-50), toRad(39), toRad(86))});
        luaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-50), toRad(39), toRad(86))});
        luaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-50), toRad(39), toRad(86))});
        luaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-50), toRad(39), toRad(86))});
        luaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-50), toRad(39), toRad(86))});
        luaIdle.setKeys(luaKeys);}

    // Left_Lower_Arm keys
    {llaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(36), toRad(-30), toRad(180))});
        llaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(36), toRad(-30), toRad(180))});
        llaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(36), toRad(-30), toRad(180))});
        llaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(36), toRad(-30), toRad(180))});
        llaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(36), toRad(-30), toRad(180))});
        llaIdle.setKeys(llaKeys);}

    // Left_Hand keys
    {lhKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-19), toRad(3), toRad(-3))});
        lhKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-19), toRad(3), toRad(-3))});
        lhKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-19), toRad(3), toRad(-3))});
        lhKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-19), toRad(3), toRad(-3))});
        lhKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-19), toRad(3), toRad(-3))});
        lhIdle.setKeys(lhKeys);}

    // Right_Upper_Arm keys
    {ruaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(49), toRad(0), toRad(19.7))});
        ruaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(49), toRad(0), toRad(19.7))});
        ruaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(49), toRad(0), toRad(19.7))});
        ruaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(49), toRad(0), toRad(19.7))});
        ruaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(49), toRad(0), toRad(19.7))});
        ruaIdle.setKeys(ruaKeys);}

    // Right_Lower_Arm keys
    {rlaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-19), toRad(-50), toRad(-12))});
        rlaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-19), toRad(-50), toRad(-12))});
        rlaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-19), toRad(-50), toRad(-12))});
        rlaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-19), toRad(-50), toRad(-12))});
        rlaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-19), toRad(-50), toRad(-12))});
        rlaIdle.setKeys(rlaKeys);}

    // Right_Hand keys
    {rhKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(8), toRad(4), toRad(-15))});
        rhKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(8), toRad(4), toRad(-15))});
        rhKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(8), toRad(4), toRad(-15))});
        rhKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(8), toRad(4), toRad(-15))});
        rhKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(8), toRad(4), toRad(-15))});
        rhIdle.setKeys(rhKeys);}

    // Left_Upper_Leg keys
    {lulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(1), toRad(-9), toRad(-129))});
        lulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(1), toRad(-9), toRad(-129))});
        lulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(1), toRad(-9), toRad(-129))});
        lulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(1), toRad(-9), toRad(-129))});
        lulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(1), toRad(-9), toRad(-129))});
        lulIdle.setKeys(lulKeys);}

    // Left_Lower_Leg keys
    {lllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(78))});
        lllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(78))});
        lllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(78))});
        lllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(78))});
        lllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(78))});
        lllIdle.setKeys(lllKeys);}

    // Left_Shoe keys
    {lsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(7), toRad(8), toRad(49))});
        lsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(7), toRad(8), toRad(49))});
        lsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(7), toRad(8), toRad(49))});
        lsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(7), toRad(8), toRad(49))});
        lsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(7), toRad(8), toRad(49))});
        lsIdle.setKeys(lsKeys);}

    // Right_Upper_Leg keys
    {rulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(42), toRad(-88))});
        rulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(42), toRad(-88))});
        rulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(42), toRad(-88))});
        rulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(42), toRad(-88))});
        rulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(42), toRad(-88))});
        rulIdle.setKeys(rulKeys);}

    // Right_Lower_Leg keys
    {rllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(15), toRad(96), toRad(113))});
        rllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(15), toRad(96), toRad(113))});
        rllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(15), toRad(96), toRad(113))});
        rllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(15), toRad(96), toRad(113))});
        rllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(15), toRad(96), toRad(113))});
        rllIdle.setKeys(rllKeys);}

    // Right_Shoe keys
    {rsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-5.8), toRad(-2.2), toRad(29))});
        rsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-5.8), toRad(-2.2), toRad(29))});
        rsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-5.8), toRad(-2.2), toRad(29))});
        rsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-5.8), toRad(-2.2), toRad(29))});
        rsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-5.8), toRad(-2.2), toRad(29))});
        rsIdle.setKeys(rsKeys);}

    idleGroup.addTargetedAnimation(hIdle, parts["Head"]);
    idleGroup.addTargetedAnimation(nIdle, parts["Neck"]);
    idleGroup.addTargetedAnimation(ubIdle, parts["Upper_Body"]);
    idleGroup.addTargetedAnimation(lbIdle, parts["Lower_Body"]);
    idleGroup.addTargetedAnimation(rIdle, parts["Root"]);
    idleGroup.addTargetedAnimation(luaIdle, parts["Left_Upper_Arm"]);
    idleGroup.addTargetedAnimation(llaIdle, parts["Left_Lower_Arm"]);
    idleGroup.addTargetedAnimation(lhIdle, parts["Left_Hand"]);
    idleGroup.addTargetedAnimation(ruaIdle, parts["Right_Upper_Arm"]);
    idleGroup.addTargetedAnimation(rlaIdle, parts["Right_Lower_Arm"]);
    idleGroup.addTargetedAnimation(rhIdle, parts["Right_Hand"]);
    idleGroup.addTargetedAnimation(lulIdle, parts["Left_Upper_Leg"]);
    idleGroup.addTargetedAnimation(lllIdle, parts["Left_Lower_Leg"]);
    idleGroup.addTargetedAnimation(lsIdle, parts["Left_Shoe"]);
    idleGroup.addTargetedAnimation(rulIdle, parts["Right_Upper_Leg"]);
    idleGroup.addTargetedAnimation(rllIdle, parts["Right_Lower_Leg"]);
    idleGroup.addTargetedAnimation(rsIdle, parts["Right_Shoe"]);
    idleGroup.normalize(0, 30);

    return idleGroup;
}


var createL3 = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3.White();
    scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
    scene.collisionsEnabled = true;



    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0,0, new BABYLON.Vector3(0, 0, 0), scene);

    scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
    scene.animationPropertiesOverride.enableBlending = true;
    scene.animationPropertiesOverride.blendingSpeed = 0.1;
    scene.animationPropertiesOverride.loopMode = 1;

    //SKYBOX
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("../L3/skybox/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    var music = new BABYLON.Sound("Music", "../musics/third.mp3", scene,
        function () {
            music.play();
        }
    ,  { loop: true });

    BABYLON.SceneLoader.Append("", "../L3/L3.babylon", scene, function (scene) {

        // Define the controller
        var OBJ_Controller = scene.getMeshByName("OBJ_Controller");
        //OBJ_Controller.position.y = 1.05;
        OBJ_Controller.checkCollisions = true;
        OBJ_Controller.showBoundingBox = false;
        OBJ_Controller._gameParameters = gameParameters;

        var MAT_wireframe = new BABYLON.StandardMaterial("MAT_wireframe", scene);
        MAT_wireframe.wireframe = true;
        MAT_wireframe.alpha = 0;
        OBJ_Controller.material = MAT_wireframe;

        // SPAWN POINT && RESET
        var spawn_point = new BABYLON.Vector3(OBJ_Controller.position.x, OBJ_Controller.position.y, OBJ_Controller.position.z);

        // Camera Settings
        camera.setPosition(new BABYLON.Vector3(OBJ_Controller.position.x , OBJ_Controller.position.y+10, OBJ_Controller.position.z));
        camera.radius = 5;
        camera.wheelPrecision = 10;

        camera.lockedTarget = OBJ_Controller;
        scene.activeCamera.attachControl(canvas, true);

        // Character Settings
        var CHAR_MESH = scene.getMeshByName("Root");
        CHAR_MESH.rotation.y = toRad(180);
        CHAR_MESH.setParent(OBJ_Controller);
        var  body_parts = {
            "Head" : scene.getMeshByName("Head"),
            "Neck" : scene.getMeshByName("Neck"),
            "Upper_Body" : scene.getMeshByName("Upper_Body"),
            "Lower_Body" : scene.getMeshByName("Lower_body"),
            "Root" : scene.getMeshByName("Root"),
            "Left_Upper_Arm" : scene.getMeshByName("Left_Upper_Arm"),
            "Left_Lower_Arm" : scene.getMeshByName("Left_Lower_Arm"),
            "Left_Hand" : scene.getMeshByName("Left_Hand"),
            "Right_Upper_Arm" : scene.getMeshByName("Right_Upper_Arm"),
            "Right_Lower_Arm" : scene.getMeshByName("Right_Lower_Arm"),
            "Right_Hand" : scene.getMeshByName("Right_Hand"),
            "Left_Upper_Leg" : scene.getMeshByName("Left_Upper_Leg"),
            "Left_Lower_Leg" : scene.getMeshByName("Left_Lower_leg"),
            "Left_Shoe" : scene.getMeshByName("Left_Shoe"),
            "Right_Upper_Leg" : scene.getMeshByName("Right_Upper_Leg"),
            "Right_Lower_Leg" : scene.getMeshByName("Right_Lower_Leg"),
            "Right_Shoe" : scene.getMeshByName("Right_Shoe")
        }

        // Define the carpet
        var OBJ_Carpet = scene.getMeshByName("OBJ_Carpet");
        OBJ_Carpet.setParent(OBJ_Controller);

        // Animation Definitions
        OBJ_Controller._gameParameters["idleAnim"] = idleAnimation(body_parts);

        // Defining inputs
        window.addEventListener("keypress", function(e){
            if(e.key == 'w'){// --> W
                OBJ_Controller._gameParameters["vAxis"] = -1.0;
            }
            if(e.key == 's'){// --> S
                OBJ_Controller._gameParameters["vAxis"] = 1.0;
            }
            if(e.key == 'a'){// --> A
                OBJ_Controller._gameParameters["hAxis"] = -1.0;
            }
            if(e.key == 'd'){// --> D
                OBJ_Controller._gameParameters["hAxis"] = 1.0;
            }
            if(e.key == ' '){// --> D
                OBJ_Controller._gameParameters["eAxis"] = 1.0;
            }
            if(e.key == '<'){// --> D
                OBJ_Controller._gameParameters["eAxis"] = -1.0;
            }

        });
        window.addEventListener("keyup", function(e){
            if(e.keyCode == 87){// --> W
                OBJ_Controller._gameParameters["vAxis"] = 0;
            }
            if(e.keyCode == 83){// --> S
                OBJ_Controller._gameParameters["vAxis"] = 0;
            }
            if(e.keyCode == 65){// --> A
                OBJ_Controller._gameParameters["hAxis"] = 0;
            }
            if(e.keyCode == 68){// --> D
                OBJ_Controller._gameParameters["hAxis"] = 0;
            }
            if(e.key == ' '){// --> D
                OBJ_Controller._gameParameters["eAxis"] = 0;
            }
            if(e.key == '<'){// --> D
                OBJ_Controller._gameParameters["eAxis"] = 0;
            }
        });

        create_materials(scene, OBJ_Carpet, CHAR_MESH);

        //Circle definitions
        var gl = new BABYLON.GlowLayer("glow", scene);
        var circle_objects =[];

        for (i = 0; i<scene.meshes.length;i++){
            if(scene.meshes[i].name.includes("Circle")){
                circle_objects.push(scene.meshes[i]);
            }
        }

        var MAT_Circles = circle_objects[0].material;
        gl.customEmissiveColorSelector = function(mesh, subMesh, material, result) {
            if(mesh.material.name == MAT_Circles.name){
                result.set(1, 0.6, 0, 1);
            }else{
                result.set(0, 0, 0, 0);
            }
        }
        gl.intensity = 3;



        // Physics definitions
        var ground_objects = [];
        for (i = 0; i<scene.meshes.length;i++){
            if(scene.meshes[i].name.includes("CX")){
                scene.meshes[i].checkCollisions = true;
                ground_objects.push(scene.meshes[i]);

                if(!scene.meshes[i].name.includes("OBJ")) {
                    scene.meshes[i].material = MAT_wireframe;
                }

            }
        }

        var last_circle = scene.getMeshByName("OBJ_Circle19");

        scene.registerBeforeRender(function () {
            OBJ_Controller.moveWithCollisions(new BABYLON.Vector3( OBJ_Controller._gameParameters["fw"] + OBJ_Controller._gameParameters["rt"] , OBJ_Controller._gameParameters["up"], OBJ_Controller._gameParameters["bw"] + OBJ_Controller._gameParameters["lt"]));
            triggers_manager(OBJ_Controller, last_circle, spawn_point, MAT_Circles, circle_objects);
            triggers_circles(OBJ_Controller, circle_objects,MAT_Circles, MAT_wireframe, spawn_point);
            animation_manager(OBJ_Controller);
            state_manager(OBJ_Controller, ground_objects, scene);
            update_gameparameters(OBJ_Controller, scene, engine);
        })
    });

    return scene;
};



var scene = createL3();



engine.runRenderLoop(function(){

    scene.render();

});

