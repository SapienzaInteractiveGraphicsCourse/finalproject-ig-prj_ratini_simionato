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
    "dt" : 0,
    "moveSpeed" : 4,
    "fallSpeed" : -10,
    "cameraDistance" : 2.0,
    "currentDistance" : 0,
    "camFactorX" : 1,
    "camFactorZ" : 0,
    "fw" : 0,
    "bw" : 0,
    "rt" : 0,
    "lt" : 0,
    "relativePos" : {"x":0, "y":0, "z": 0},
    "jumpPower" : 0,
    "jumpStartTime" : -1e10,
    "isJumping" : false,
    "isGrounded" : true,
    "isFalling" : false,
    "isMoving" : false,
    "idleAnim" : null,
    "jumpAnim" : null,
    "runAnim" : null,
    "fallAnim": null,
    "lever_enabled" : false,
    "lamp_enabled" : false,
    "wall_down" : false
}
function animation_manager(char){
    if(char._gameParameters["isGrounded"] && ! char._gameParameters["isMoving"] && !char._gameParameters["idleAnim"].isStarted){
        char._gameParameters["idleAnim"].play(true);
        char._gameParameters["runAnim"].stop();
        char._gameParameters["jumpAnim"].stop();
        char._gameParameters["fallAnim"].stop();
    }

    if(char._gameParameters["isGrounded"] && char._gameParameters["isMoving"] && !char._gameParameters["runAnim"].isStarted){
        char._gameParameters["runAnim"].play(true);
        char._gameParameters["idleAnim"].stop();
        char._gameParameters["jumpAnim"].stop();
        char._gameParameters["fallAnim"].stop();
    }

    if(/*char._gameParameters["isGrounded"] && */ char._gameParameters["isJumping"] && !char._gameParameters["jumpAnim"].isStarted){
        char._gameParameters["jumpAnim"].play(true);
        char._gameParameters["runAnim"].stop();
        char._gameParameters["idleAnim"].stop();
        char._gameParameters["fallAnim"].stop();
    }

    if(!char._gameParameters["isGrounded"] && !char._gameParameters["isJumping"] && !char._gameParameters["fallAnim"].isStarted){
        char._gameParameters["fallAnim"].play(true);
        char._gameParameters["runAnim"].stop();
        char._gameParameters["idleAnim"].stop();
        char._gameParameters["jumpAnim"].stop();
    }

}
function triggers_manager(char, tb_lever, tb_lamp, gl) {
    if(char.intersectsMesh(tb_lever, false)){
        char._gameParameters["lever_enabled"] = true;
    }else{
        char._gameParameters["lever_enabled"] = false;
    }

    if(char.intersectsMesh(tb_lamp, false)){
        char._gameParameters["lamp_enabled"] = true;
    }else{
        char._gameParameters["lamp_enabled"] = false;
    }

    gl.customEmissiveColorSelector = function(mesh, subMesh, material, result) {
        if(mesh.name == "Obj_Rod" &&  char._gameParameters["lever_enabled"] ==true){result.set(1, 0.6, 0, 1);}
        else if(mesh.name == "Obj_lamp" &&  char._gameParameters["lamp_enabled"] ==true){result.set(1, 0.6, 0, 1);}
        else{result.set(0, 0, 0, 0);}
    }
    gl.intensity =0.8;
}
function reset(char, floor, spawn_point){
    if(char.intersectsMesh(floor, false)){
        char.position = new BABYLON.Vector3(spawn_point.x, spawn_point.y, spawn_point.z);
    }

}
function state_manager(char, meshlist, scene){
    if(char._gameParameters["isGrounded"]){
        if (char._gameParameters["vAxis"] != 0 || char._gameParameters["hAxis"] != 0) {
            char._gameParameters["isMoving"] = true;
        }else{
            char._gameParameters["isMoving"] = false;
        }
    }
    update_grounding(char, meshlist, scene);

}
function update_gameparameters(char, scene){
    var hAxis = char._gameParameters["hAxis"];
    var vAxis = char._gameParameters["vAxis"];
    var dir = 0;
    if(vAxis == 0 && hAxis == 0){ dir = 0;}
    else if(vAxis == -1 && hAxis == 0){dir = 0;}// W
    else if(vAxis == 1 && hAxis == 0){dir = -180;}// S
    else if(vAxis == 0 && hAxis == -1){dir = -90;} // A
    else if(vAxis == 0 && hAxis == 1){dir = 90;} // D
    else if(vAxis == -1 && hAxis == -1){dir = -45;} //WA
    else if(vAxis == -1 && hAxis == 1){dir = 45;} // WD
    else if(vAxis == 1 && hAxis == -1){dir = -135;} //SA
    else if(vAxis == 1 && hAxis == 1){dir = -225;} //SD

    char.rotation.y =  Math.PI  - scene.activeCamera.alpha + toRad(dir);
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
}
function updateJump(jumpStartTime){
    var JUMP_DURATION = 700;

    var elapsed = Date.now() - jumpStartTime;
    var progress = elapsed / JUMP_DURATION;

    return Math.cos(Math.min(progress, 1) * Math.PI/2);
}
function update_grounding(char, meshlist, scene){
    char._gameParameters["isGrounded"] = false;
    var center = char.position;
    var down = new BABYLON.Vector3(center.x, center.y - 1.05, center.z);

    var points = [center, down];

    var line =  BABYLON.MeshBuilder.CreateLines("lines", {points: points}, scene);
    for (var i = 0; i < meshlist.length; i++) {
        if(line.intersectsMesh(meshlist[i], false)) {
            char._gameParameters["isJumping"] = false;
            char._gameParameters["isFalling"] = false;
            char._gameParameters["isGrounded"] = true;
            char._gameParameters["moveSpeed"] = 4;
        }
    }

    line.dispose();
    if(char._gameParameters["isJumping"] == false && char._gameParameters["isGrounded"] == false){
        char._gameParameters["isFalling"] = true;
    }


}
function create_materials(scene){
    var MAT_Head = new BABYLON.StandardMaterial("MAT_Head", scene);
    MAT_Head.diffuseTexture = new BABYLON.Texture("../L1/texture000.jpg", scene);
    MAT_Head.specularColor = new BABYLON.Color3(0,0,0);
    var head = scene.getMeshByName("Head");
    head.material = MAT_Head;

    var MAT_Gold = new BABYLON.StandardMaterial("MAT_Gold", scene);
    MAT_Gold.diffuseColor = new BABYLON.Color3(0.65, 0.42, 0);
    var lamp = scene.getMeshByName("Obj_lamp");
    lamp.material = MAT_Gold;

    var MAT_Cords = new BABYLON.StandardMaterial("MAT_Gold", scene);
    MAT_Cords.diffuseColor = new BABYLON.Color3(0.8, 0.64, 0.35);
    var cords = scene.getMeshByName("Obj_bridge_cord");
    cords.material = MAT_Cords;

    var MAT_lever_rod = new BABYLON.StandardMaterial("MAT_lever_rod", scene);
    MAT_lever_rod.diffuseTexture = new BABYLON.Texture("../L1/trib1.jpg", scene);
    var rod = scene.getMeshByName("Obj_Rod");
    rod.material = MAT_lever_rod;

    var MAT_Rock1 = new BABYLON.StandardMaterial("MAT_Rock1", scene);
    MAT_Rock1.diffuseTexture = new BABYLON.Texture("../L1/ROCK_COL1.png", scene);
    MAT_Rock1.specularTexture = new BABYLON.Texture("../L1/ROCK_SPE.png", scene);
    MAT_Rock1.bumpTexture = new BABYLON.Texture("../L1/ROCK_NOR.png", scene);
    MAT_Rock1.specularTexture.level = 0.3;
    MAT_Rock1.bumpTexture.level = 0.3;
    var start = scene.getMeshByName("Obj_start");
    start.material = MAT_Rock1;
    var pillar1 = scene.getMeshByName("Obj_pillar1");
    pillar1.material = MAT_Rock1;
    var pillar2 = scene.getMeshByName("Obj_pillar2");
    pillar2.material = MAT_Rock1;
    var pillar3 = scene.getMeshByName("Obj_pillar3");
    pillar3.material = MAT_Rock1;
    var pillar4 = scene.getMeshByName("Obj_pillar4");
    pillar4.material = MAT_Rock1;
    var pillar5 = scene.getMeshByName("Obj_pillar5");
    pillar5.material = MAT_Rock1;
    var pillar6 = scene.getMeshByName("Obj_pillar6");
    pillar6.material = MAT_Rock1;
    var pillar7 = scene.getMeshByName("Obj_pillar7");
    pillar7.material = MAT_Rock1;
    var pillar8 = scene.getMeshByName("Obj_pillar8");
    pillar8.material = MAT_Rock1;
    var pillar9 = scene.getMeshByName("Obj_pillar9");
    pillar9.material = MAT_Rock1;
    var bridge_column = scene.getMeshByName("Obj_bridge_column");
    bridge_column.material = MAT_Rock1;
    var wall = scene.getMeshByName("CX_Obj_wall");
    wall.material = MAT_Rock1;

    var MAT_Rock2 = new BABYLON.StandardMaterial("MAT_Rock2", scene);
    MAT_Rock2.diffuseTexture = new BABYLON.Texture("../L1/ROCK_COL2.png", scene);
    MAT_Rock2.specularTexture = new BABYLON.Texture("../L1/ROCK_SPE.png", scene);
    MAT_Rock2.bumpTexture = new BABYLON.Texture("../L1/ROCK_NOR.png", scene);
    MAT_Rock2.specularTexture.level = 0.3;
    MAT_Rock2.bumpTexture.level = 0.3;
    var rocks_floor = scene.getMeshByName("Obj_rocks_floor");
    rocks_floor.material = MAT_Rock2;
    var lever = scene.getMeshByName("Obj_Lever");
    lever.material = MAT_Rock2;

    var MAT_Rock3 = new BABYLON.StandardMaterial("MAT_Rock3", scene);
    MAT_Rock3.diffuseTexture = new BABYLON.Texture("../L1/ROCK_COL3.png", scene);
    MAT_Rock3.specularTexture = new BABYLON.Texture("../L1/ROCK_SPE.png", scene);
    MAT_Rock3.bumpTexture = new BABYLON.Texture("../L1/ROCK_NOR.png", scene);
    MAT_Rock3.specularTexture.level = 0.3;
    MAT_Rock3.bumpTexture.level = 0.3;
    var roof_rocks = scene.getMeshByName("Obj_roof_rocks");
    roof_rocks.material = MAT_Rock3;
    var rocks_decorative = scene.getMeshByName("Obj_rocks_decorative");
    rocks_decorative.material = MAT_Rock3;
    var start_rocks = scene.getMeshByName("Obj_start_rocks");
    start_rocks.material = MAT_Rock3;

    var MAT_Rock4 = new BABYLON.StandardMaterial("MAT_Rock4", scene);
    MAT_Rock4.diffuseTexture = new BABYLON.Texture("../L1/ROCK_COL4.png", scene);
    MAT_Rock4.specularTexture = new BABYLON.Texture("../L1/ROCK_SPE.png", scene);
    MAT_Rock4.bumpTexture = new BABYLON.Texture("../L1/ROCK_NOR.png", scene);
    MAT_Rock4.specularTexture.level = 0.3;
    MAT_Rock4.bumpTexture.level = 0.3;
    var cave = scene.getMeshByName("Obj_cave");
    cave.material = MAT_Rock4;

    var MAT_crystals_red = new BABYLON.StandardMaterial("MAT_crystals_red", scene);
    MAT_crystals_red.diffuseColor = new BABYLON.Color3(1, 0, 0);
    MAT_crystals_red.specularColor = new BABYLON.Color3(1, 0.5, 0.5);
    var crystals_red = scene.getMeshByName("Obj_Crystals_RED");
    crystals_red.material = MAT_crystals_red;

    var MAT_crystals_green = new BABYLON.StandardMaterial("MAT_crystals_green", scene);
    MAT_crystals_green.diffuseColor = new BABYLON.Color3(0, 1, 0);
    MAT_crystals_green.specularColor = new BABYLON.Color3(0.5, 1, 0.5);
    var crystals_green = scene.getMeshByName("Obj_Crystals_GREEN");
    crystals_green.material = MAT_crystals_green;

    var MAT_crystals_blue = new BABYLON.StandardMaterial("MAT_crystals_blue", scene);
    MAT_crystals_blue.diffuseColor = new BABYLON.Color3(0, 0, 1);
    MAT_crystals_blue.specularColor = new BABYLON.Color3(0.5, 0.5,1);
    var crystals_blue = scene.getMeshByName("Obj_Crystals_BLUE");
    crystals_blue.material = MAT_crystals_blue;

    var MAT_emeralds_r = new BABYLON.StandardMaterial("MAT_emeralds_r", scene);
    MAT_emeralds_r.diffuseColor = new BABYLON.Color3(1, 0, 0);
    MAT_emeralds_r.specularColor = new BABYLON.Color3(1, 0.5, 0.5);
    var emeralds_r = scene.getMeshByName("Obj_Emerald_RED");
    emeralds_r.material = MAT_emeralds_r;

    var MAT_emeralds_g = new BABYLON.StandardMaterial("MAT_emeralds_g", scene);
    MAT_emeralds_g.diffuseColor = new BABYLON.Color3(0, 1, 0);
    MAT_emeralds_g.specularColor = new BABYLON.Color3(0.5, 1, 0.5);
    var emeralds_g = scene.getMeshByName("Obj_Emerald_GREEN");
    emeralds_g.material = MAT_emeralds_g;

    var MAT_emeralds_b = new BABYLON.StandardMaterial("MAT_emeralds_b", scene);
    MAT_emeralds_b.diffuseColor = new BABYLON.Color3(0, 0, 1);
    MAT_emeralds_b.specularColor = new BABYLON.Color3(0.5, 0.5, 1);
    var emeralds_b = scene.getMeshByName("Obj_Emerald_BLUE");
    emeralds_b.material = MAT_emeralds_b;

    var MAT_diamonds_w = new BABYLON.StandardMaterial("MAT_diamonds_WHITE", scene);
    MAT_diamonds_w.diffuseColor = new BABYLON.Color3(1, 1, 1);
    MAT_diamonds_w.specularColor = new BABYLON.Color3(0.5, 1, 0.5);
    var diamonds_w = scene.getMeshByName("Obj_diamond_WHITE");
    diamonds_w.material = MAT_diamonds_w;

    var MAT_diamonds_y = new BABYLON.StandardMaterial("MAT_diamonds_YELLOW", scene);
    MAT_diamonds_y.diffuseColor = new BABYLON.Color3(1, 1, 0);
    MAT_diamonds_y.specularColor = new BABYLON.Color3(1, 1, 0.5);
    var diamonds_y = scene.getMeshByName("Obj_diamond_YELLOW");
    diamonds_y.material = MAT_diamonds_y;

    var MAT_diamonds_c = new BABYLON.StandardMaterial("MAT_diamonds_CYAN", scene);
    MAT_diamonds_c.diffuseColor = new BABYLON.Color3(0, 1, 1);
    MAT_diamonds_c.specularColor = new BABYLON.Color3(0.5, 1, 1);
    var diamonds_c = scene.getMeshByName("Obj_diamond_CYAN");
    diamonds_c.material = MAT_diamonds_c;

    var MAT_diamonds_m = new BABYLON.StandardMaterial("MAT_diamonds_MAGENTA", scene);
    MAT_diamonds_m.diffuseColor = new BABYLON.Color3(1, 0, 1);
    MAT_diamonds_m.specularColor = new BABYLON.Color3(1, 0.5, 1);
    var diamonds_m = scene.getMeshByName("Obj_diamond_MAGENTA");
    diamonds_m.material = MAT_diamonds_m;


    var bridge_boards = scene.getMeshByName("Obj_bridge_boards");
    var MAT_wood = new BABYLON.StandardMaterial("MAT_wood", scene);
    MAT_wood.diffuseTexture = new BABYLON.Texture("../L1/wood_col.jpg", scene);
    MAT_wood.bumpTexture = new BABYLON.Texture("../L1/wood_nor.jpg", scene);
    MAT_wood.bumpTexture.level= 0.5;
    MAT_wood.specularTexture = new BABYLON.Texture("../L1/wood_spe.jpg", scene);
    MAT_wood.specularTexture.level= 0.1;
    bridge_boards.material = MAT_wood;
}

// ANIMATIONS
function leverAnimation(rod){
    var rotationGroup = new BABYLON.AnimationGroup("lever_rot");

    var rotAnim = new BABYLON.Animation("lever_animation", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    var rotKeys = [];

    {
        rotKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        rotKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(50))});
        rotKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(100))});
        rotKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(50))});
        rotKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(0))});
        rotAnim.setKeys(rotKeys);
    }

    rotationGroup.addTargetedAnimation(rotAnim, rod);
    rotationGroup.normalize(0, 30);

    return rotationGroup;

}
function wallAnimation(wall, pos){
    var wallGroup = new BABYLON.AnimationGroup("wall_anim_group");

    var posAnim = new BABYLON.Animation("wall_anim", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    var posKeys = [];

    {
        posKeys.push({frame: 1, value: new BABYLON.Vector3(pos.x, pos.y, pos.z)});
        posKeys.push({frame: 15, value: new BABYLON.Vector3(pos.x, pos.y-1.25, pos.z)});
        posKeys.push({frame: 30, value: new BABYLON.Vector3(pos.x, pos.y-2.5, pos.z)});
        posKeys.push({frame: 45, value: new BABYLON.Vector3(pos.x, pos.y-3.75, pos.z)});
        posKeys.push({frame: 60, value: new BABYLON.Vector3(pos.x, pos.y-5, pos.z)});
        posAnim.setKeys(posKeys);
    }

    wallGroup.addTargetedAnimation(posAnim, wall);
    wallGroup.normalize(0, 60);

    return wallGroup;

}
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
    {hKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0.38), toRad(-6.28), toRad(-4.7))});
        hKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0.38), toRad(-6.28), toRad(-4.7))});
        hKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0.38), toRad(-6.28), toRad(-4.7))});
        hKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0.38), toRad(-6.28), toRad(-4.7))});
        hKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0.38), toRad(-6.28), toRad(-4.7))});
        hIdle.setKeys(hKeys);}

    // Neck keys
    {nKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-0.2), toRad(1.28), toRad(-4.3))});
        nKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-0.2), toRad(1.28), toRad(-4.3))});
        nKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-0.2), toRad(1.28), toRad(-4.3))});
        nKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-0.2), toRad(1.28), toRad(-4.3))});
        nKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-0.2), toRad(1.28), toRad(-4.3))});
        nIdle.setKeys(nKeys);}

    // Upper_Body keys
    {ubKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-5.37))});
        ubKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-4.9))});
        ubKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-4.5))});
        ubKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-4.9))});
        ubKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-5.37))});
        ubIdle.setKeys(ubKeys);}

    // Lower_Body keys
    {lbKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-4.82))});
        lbKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-4.4))});
        lbKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-4))});
        lbKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-4.4))});
        lbKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-4.82))});
        lbIdle.setKeys(lbKeys);}

    // Root_Body keys
    {rKeys.push({frame: 1,value: new BABYLON.Vector3(0, 0.21, 0)});
        rKeys.push({frame: 8,value: new BABYLON.Vector3(0, 0.21, 0)});
        rKeys.push({frame: 15,value: new BABYLON.Vector3(0, 0.21, 0)});
        rKeys.push({frame: 23,value: new BABYLON.Vector3(0, 0.21, 0)});
        rKeys.push({frame: 30,value: new BABYLON.Vector3(0, 0.21, 0)});
        rIdle.setKeys(rKeys);}



    // Left_Upper_Arm keys
    {luaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(64), toRad(5), toRad(12))});
        luaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(64), toRad(5), toRad(11))});
        luaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(64), toRad(5), toRad(10))});
        luaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(64), toRad(5), toRad(11))});
        luaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(64), toRad(5), toRad(12))});
        luaIdle.setKeys(luaKeys);}

    // Left_Lower_Arm keys
    {llaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(16), toRad(5.71), toRad(5))});
        llaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(16), toRad(5.71), toRad(5))});
        llaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(16), toRad(5.71), toRad(5))});
        llaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(16), toRad(5.71), toRad(5))});
        llaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(16), toRad(5.71), toRad(5))});
        llaIdle.setKeys(llaKeys);}

    // Left_Hand keys
    {lhKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-8), toRad(-16), toRad(0))});
        lhKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-8), toRad(-16), toRad(0))});
        lhKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-8), toRad(-16), toRad(0))});
        lhKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-8), toRad(-16), toRad(0))});
        lhKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-8), toRad(-16), toRad(0))});
        lhIdle.setKeys(lhKeys);}

    // Right_Upper_Arm keys
    {ruaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-71), toRad(-6.1), toRad(-10))});
        ruaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-71), toRad(-6.1), toRad(-9))});
        ruaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-71), toRad(-6.1), toRad(-8))});
        ruaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-71), toRad(-6.1), toRad(-9))});
        ruaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-71), toRad(-6.1), toRad(-10))});
        ruaIdle.setKeys(ruaKeys);}

    // Right_Lower_Arm keys
    {rlaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(-15), toRad(5))});
        rlaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(-15), toRad(5))});
        rlaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(-15), toRad(5))});
        rlaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(-15), toRad(5))});
        rlaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(-15), toRad(5))});
        rlaIdle.setKeys(rlaKeys);}

    // Right_Hand keys
    {rhKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(5.3), toRad(11.1), toRad(-4.3))});
        rhKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(5.3), toRad(11.1), toRad(-4.3))});
        rhKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(5.3), toRad(11.1), toRad(-4.3))});
        rhKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(5.3), toRad(11.1), toRad(-4.3))});
        rhKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(5.3), toRad(11.1), toRad(-4.3))});
        rhIdle.setKeys(rhKeys);}

    // Left_Upper_Leg keys
    {lulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-1.4), toRad(-11.4), toRad(32.5))});
        lulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-1.4), toRad(-11.4), toRad(32.5))});
        lulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-1.4), toRad(-11.4), toRad(32.5))});
        lulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-1.4), toRad(-11.4), toRad(32.5))});
        lulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-1.4), toRad(-11.4), toRad(32.5))});
        lulIdle.setKeys(lulKeys);}

    // Left_Lower_Leg keys
    {lllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(2.78), toRad(0), toRad(-28))});
        lllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(2.78), toRad(0), toRad(-28))});
        lllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(2.78), toRad(0), toRad(-28))});
        lllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(2.78), toRad(0), toRad(-28))});
        lllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(2.78), toRad(0), toRad(-28))});
        lllIdle.setKeys(lllKeys);}

    // Left_Shoe keys
    {lsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-11))});
        lsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-11))});
        lsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-11))});
        lsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-11))});
        lsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-11))});
        lsIdle.setKeys(lsKeys);}

    // Right_Upper_Leg keys
    {rulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(3.7), toRad(-5), toRad(-5))});
        rulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(3.7), toRad(-5), toRad(-5))});
        rulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(3.7), toRad(-5), toRad(-5))});
        rulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(3.7), toRad(-5), toRad(-5))});
        rulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(3.7), toRad(-5), toRad(-5))});
        rulIdle.setKeys(rulKeys);}

    // Right_Lower_Leg keys
    {rllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(-16), toRad(-12))});
        rllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(-16), toRad(-12))});
        rllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(-16), toRad(-12))});
        rllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(-16), toRad(-12))});
        rllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(-16), toRad(-12))});
        rllIdle.setKeys(rllKeys);}

    // Right_Shoe keys
    {rsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-1.3), toRad(26.5), toRad(2))});
        rsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-1.3), toRad(26.5), toRad(2))});
        rsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-1.3), toRad(26.5), toRad(2))});
        rsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-1.3), toRad(26.5), toRad(2))});
        rsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-1.3), toRad(26.5), toRad(2))});
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
function runAnimation(parts){
    var runGroup = new BABYLON.AnimationGroup("run");
    var hRun = new BABYLON.Animation("run_head", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var nRun = new BABYLON.Animation("run_neck", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var ubRun = new BABYLON.Animation("run_upper_body", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lbRun = new BABYLON.Animation("run_lower_body", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rRun = new BABYLON.Animation("run_root", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var luaRun = new BABYLON.Animation("run_left_upper_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var llaRun = new BABYLON.Animation("run_left_lower_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lhRun = new BABYLON.Animation("run_left_hand", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var ruaRun = new BABYLON.Animation("run_right_upper_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rlaRun = new BABYLON.Animation("run_right_lower_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rhRun = new BABYLON.Animation("run_right_hand", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lulRun = new BABYLON.Animation("run_left_upper_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lllRun = new BABYLON.Animation("run_left_lower_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lsRun = new BABYLON.Animation("run_left_shoe", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rulRun = new BABYLON.Animation("run_right_upper_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rllRun = new BABYLON.Animation("run_right_lower_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rsRun = new BABYLON.Animation("run_right_shoe", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

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
    {hKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(8.65))});
        hKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(8.65))});
        hKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(8.65))});
        hKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(8.65))});
        hKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(8.65))});
        hRun.setKeys(hKeys);}

    // Neck keys
    {nKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(15.3))});
        nKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(15.3))});//19.7
        nKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(15.3))});//20.8
        nKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(15.3))});//38
        nKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(15.3))});
        nRun.setKeys(nKeys);}

    // Upper_Body keys
    {ubKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-19.7))});
        ubKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-19.7))});//-16.1
        ubKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-19.7))});//-19.7
        ubKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-19.7))});//-25.7
        ubKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-19.7))});
        ubRun.setKeys(ubKeys);}

    // Lower_Body keys
    {lbKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-5.24))});
        lbKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-7.28))});
        lbKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-5.82))});
        lbKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-9.41))});
        lbKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-5.24))});
        lbRun.setKeys(lbKeys);}

    // Root_Body keys
    {rKeys.push({frame: 1,value: new BABYLON.Vector3(0, 0.06, 0)});
        rKeys.push({frame: 8,value: new BABYLON.Vector3(0, 0.27, 0)});
        rKeys.push({frame: 15,value: new BABYLON.Vector3(0, 0.09, 0)});
        rKeys.push({frame: 23,value: new BABYLON.Vector3(0, 0.20, 0)});
        rKeys.push({frame: 30,value: new BABYLON.Vector3(0, 0.06, 0)});
        rRun.setKeys(rKeys);}

    // Left_Upper_Arm keys
    {luaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(64), toRad(0), toRad(-6.31))});
        luaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(71), toRad(5.55), toRad(-25))});
        luaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(59), toRad(18.1), toRad(13.5))});
        luaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(42), toRad(24.2), toRad(39.9))});
        luaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(64), toRad(0), toRad(-6.31))});
        luaRun.setKeys(luaKeys);}

    // Left_Lower_Arm keys
    {llaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(5.2), toRad(97.5), toRad(6.36))});
        llaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-9.31), toRad(91.7), toRad(7.35))});
        llaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-10.6), toRad(103), toRad(5.37))});
        llaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(3.44), toRad(114), toRad(-14))});
        llaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(5.2), toRad(97.5), toRad(6.36))});
        llaRun.setKeys(llaKeys);}

    // Left_Hand keys
    {lhKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhRun.setKeys(lhKeys);}

    // Right_Upper_Arm keys
    {ruaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-47.4), toRad(-23.4), toRad(15.1))});
        ruaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-44.1), toRad(-33.2), toRad(24.5))});
        ruaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-49.6), toRad(-9.98), toRad(9.79))});
        ruaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-68.2), toRad(-10.6), toRad(-21.5))});
        ruaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-47.4), toRad(-23.4), toRad(15.1))});
        ruaRun.setKeys(ruaKeys);}

    // Right_Lower_Arm keys
    {rlaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0.16), toRad(-84.6), toRad(-4.27))});
        rlaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-5), toRad(-95.3), toRad(-4.78))});
        rlaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-21.8), toRad(-71.2), toRad(-5.94))});
        rlaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(4.03), toRad(-83.5), toRad(15.4))});
        rlaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0.16), toRad(-84.6), toRad(-4.27))});
        rlaRun.setKeys(rlaKeys);}

    // Right_Hand keys
    {rhKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhRun.setKeys(rhKeys);}

    // Left_Upper_Leg keys
    {lulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(37.8))});
        lulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(7.3), toRad(-4.82), toRad(41.2))});
        lulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(3.99), toRad(-9.02), toRad(28.6))});
        lulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0.38), toRad(-11.7), toRad(-5.88))});
        lulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(37.8))});
        lulRun.setKeys(lulKeys);}

    // Left_Lower_Leg keys
    {lllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-91.8))});
        lllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0.36), toRad(6.39), toRad(-29.6))});
        lllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(6.92), toRad(2.56), toRad(-41.6))});
        lllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(6.04), toRad(9.87), toRad(-30.2))});
        lllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-91.8))});
        lllRun.setKeys(lllKeys);}

    // Left_Shoe keys
    {lsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-26))});
        lsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(1.49), toRad(4.91), toRad(-30.5))});
        lsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-10.1), toRad(3.91), toRad(11))});
        lsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-5.38), toRad(4.91), toRad(-38.4))});
        lsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-26))});
        lsRun.setKeys(lsKeys);}

    // Right_Upper_Leg keys
    {rulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(28.1))});
        rulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-6), toRad(-1), toRad(-9.62))});
        rulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-8.32), toRad(4.2), toRad(35))});
        rulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-0.33), toRad(-3.35), toRad(48.2))});
        rulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(28.1))});
        rulRun.setKeys(rulKeys);}

    // Right_Lower_Leg keys
    {rllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-57))});
        rllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-18))});
        rllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-98))});
        rllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-38.9))});
        rllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-57))});
        rllRun.setKeys(rllKeys);}

    // Right_Shoe keys
    {rsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(20.3))});
        rsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-0.86), toRad(5.13), toRad(-44.1))});
        rsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-12.5), toRad(28.2), toRad(-40.8))});
        rsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(5.89), toRad(4.52), toRad(-22.5))});
        rsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(20.3))});
        rsRun.setKeys(rsKeys);}

    runGroup.addTargetedAnimation(hRun, parts["Head"]);
    runGroup.addTargetedAnimation(nRun, parts["Neck"]);
    runGroup.addTargetedAnimation(ubRun, parts["Upper_Body"]);
    runGroup.addTargetedAnimation(lbRun, parts["Lower_Body"]);
    runGroup.addTargetedAnimation(rRun, parts["Root"]);
    runGroup.addTargetedAnimation(luaRun, parts["Left_Upper_Arm"]);
    runGroup.addTargetedAnimation(llaRun, parts["Left_Lower_Arm"]);
    runGroup.addTargetedAnimation(lhRun, parts["Left_Hand"]);
    runGroup.addTargetedAnimation(ruaRun, parts["Right_Upper_Arm"]);
    runGroup.addTargetedAnimation(rlaRun, parts["Right_Lower_Arm"]);
    runGroup.addTargetedAnimation(rhRun, parts["Right_Hand"]);
    runGroup.addTargetedAnimation(lulRun, parts["Left_Upper_Leg"]);
    runGroup.addTargetedAnimation(lllRun, parts["Left_Lower_Leg"]);
    runGroup.addTargetedAnimation(lsRun, parts["Left_Shoe"]);
    runGroup.addTargetedAnimation(rulRun, parts["Right_Upper_Leg"]);
    runGroup.addTargetedAnimation(rllRun, parts["Right_Lower_Leg"]);
    runGroup.addTargetedAnimation(rsRun, parts["Right_Shoe"]);
    runGroup.normalize(0, 30);

    return runGroup;
}
function jumpAnimation(parts){
    var jumpGroup = new BABYLON.AnimationGroup("jump");
    var hJump = new BABYLON.Animation("jump_head", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var nJump = new BABYLON.Animation("jump_neck", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var ubJump = new BABYLON.Animation("jump_upper_body", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lbJump = new BABYLON.Animation("jump_lower_body", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rJump = new BABYLON.Animation("jump_root", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var luaJump = new BABYLON.Animation("jump_left_upper_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var llaJump = new BABYLON.Animation("jump_left_lower_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lhJump = new BABYLON.Animation("jump_left_hand", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var ruaJump = new BABYLON.Animation("jump_right_upper_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rlaJump = new BABYLON.Animation("jump_right_lower_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rhJump = new BABYLON.Animation("jump_right_hand", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lulJump = new BABYLON.Animation("jump_left_upper_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lllJump = new BABYLON.Animation("jump_left_lower_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lsJump = new BABYLON.Animation("jump_left_shoe", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rulJump = new BABYLON.Animation("jump_right_upper_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rllJump = new BABYLON.Animation("jump_right_lower_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rsJump = new BABYLON.Animation("jump_right_shoe", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

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
    {hKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(10.5))});
        hKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-5.05))});
        hKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-2.93))});
        hKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-4.74))});
        hKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(10.5))});
        hJump.setKeys(hKeys);}

    // Neck keys
    {nKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(9.52))});
        nKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-2.65))});//19.7
        nKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-5.62))});//20.8
        nKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-5.55))});//38
        nKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(9.52))});
        nJump.setKeys(nKeys);}

    // Upper_Body keys
    {ubKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-9.8))});
        ubKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-21))});//-16.1
        ubKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-3.15))});//-19.7
        ubKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-7.61))});//-25.7
        ubKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-9.8))});
        ubJump.setKeys(ubKeys);}

    // Lower_Body keys
    {lbKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-33.8))});
        lbKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(1.89))});
        lbKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-19.5))});
        lbKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-22.2))});
        lbKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0.757), toRad(0), toRad(-33.8))});
        lbJump.setKeys(lbKeys);}

    // Root_Body keys
    {rKeys.push({frame: 1,value: new BABYLON.Vector3(0, 0, 0)});
        rKeys.push({frame: 8,value: new BABYLON.Vector3(0, 0, 0)});
        rKeys.push({frame: 15,value: new BABYLON.Vector3(0, 0, 0)});
        rKeys.push({frame: 23,value: new BABYLON.Vector3(0, 0, 0)});
        rKeys.push({frame: 30,value: new BABYLON.Vector3(0, 0, 0)});
        rJump.setKeys(rKeys);}

    // Left_Upper_Arm keys
    {luaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(64), toRad(0), toRad(-6.31))});
        luaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(71), toRad(5.55), toRad(-25))});
        luaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(59), toRad(18.1), toRad(13.5))});
        luaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(42), toRad(24.2), toRad(39.9))});
        luaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(64), toRad(0), toRad(-6.31))});
        luaJump.setKeys(luaKeys);}

    // Left_Lower_Arm keys
    {llaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(5.2), toRad(97.5), toRad(6.36))});
        llaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-9.31), toRad(91.7), toRad(7.35))});
        llaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-10.6), toRad(103), toRad(5.37))});
        llaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(3.44), toRad(114), toRad(-14))});
        llaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(5.2), toRad(97.5), toRad(6.36))});
        llaJump.setKeys(llaKeys);}

    // Left_Hand keys
    {lhKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-1.43), toRad(0), toRad(9.59))});
        lhJump.setKeys(lhKeys);}

    // Right_Upper_Arm keys
    {ruaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-47.4), toRad(-23.4), toRad(15.1))});
        ruaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-44.1), toRad(-33.2), toRad(24.5))});
        ruaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-49.6), toRad(-9.98), toRad(9.79))});
        ruaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-68.2), toRad(-10.6), toRad(-21.5))});
        ruaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-47.4), toRad(-23.4), toRad(15.1))});
        ruaJump.setKeys(ruaKeys);}

    // Right_Lower_Arm keys
    {rlaKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0.16), toRad(-84.6), toRad(-4.27))});
        rlaKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-5), toRad(-95.3), toRad(-4.78))});
        rlaKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-21.8), toRad(-71.2), toRad(-5.94))});
        rlaKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(4.03), toRad(-83.5), toRad(15.4))});
        rlaKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0.16), toRad(-84.6), toRad(-4.27))});
        rlaJump.setKeys(rlaKeys);}

    // Right_Hand keys
    {rhKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(5.3), toRad(-5.83), toRad(-3.06))});
        rhJump.setKeys(rhKeys);}

    // Left_Upper_Leg keys
    {lulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-5), toRad(1.19), toRad(13.5))});
        lulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-2.6), toRad(-10.2), toRad(-4.12))});
        lulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-15.6), toRad(13.9), toRad(83.9))});
        lulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-13.5), toRad(23.4), toRad(60.2))});
        lulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-5), toRad(1.19), toRad(13.5))});
        lulJump.setKeys(lulKeys);}

    // Left_Lower_Leg keys
    {lllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0.3), toRad(-7.58), toRad(-55.1))});
        lllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(2.25), toRad(-2), toRad(-74.7))});
        lllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-14.7), toRad(-8), toRad(-120))});
        lllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-15.1), toRad(-21.4), toRad(-24.3))});
        lllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0.3), toRad(-7.58), toRad(-55.1))});
        lllJump.setKeys(lllKeys);}

    // Left_Shoe keys
    {lsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-1.32), toRad(9.74), toRad(36.2))});
        lsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-3.42), toRad(12.7), toRad(-19.8))});
        lsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(5.35), toRad(0.83), toRad(5.18))});
        lsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(2.59), toRad(9.12), toRad(-11.6))});
        lsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-1.32), toRad(9.74), toRad(36.2))});
        lsJump.setKeys(lsKeys);}

    // Right_Upper_Leg keys
    {rulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-1.67), toRad(-1.73), toRad(52.5))});
        rulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(1.72), toRad(-6.58), toRad(115))});
        rulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-1.5), toRad(4.32), toRad(55.8))});
        rulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(5.5), toRad(-1.96), toRad(23.2))});
        rulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-1.67), toRad(-1.73), toRad(52.5))});
        rulJump.setKeys(rulKeys);}

    // Right_Lower_Leg keys
    {rllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-110))});
        rllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(12.7), toRad(0), toRad(-92.6))});
        rllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-1.23), toRad(0), toRad(-24.6))});
        rllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-0.55), toRad(0), toRad(-79))});
        rllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-110))});
        rllJump.setKeys(rllKeys);}

    // Right_Shoe keys
    {rsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-1.42), toRad(-2.24), toRad(2.48))});
        rsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-10.1), toRad(-10.8), toRad(-26.6))});
        rsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-5.06), toRad(-10.2), toRad(-24.3))});
        rsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-5.15), toRad(-10.1), toRad(2.37))});
        rsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-1.42), toRad(-2.24), toRad(2.48))});
        rsJump.setKeys(rsKeys);}

    jumpGroup.addTargetedAnimation(hJump, parts["Head"]);
    jumpGroup.addTargetedAnimation(nJump, parts["Neck"]);
    jumpGroup.addTargetedAnimation(ubJump, parts["Upper_Body"]);
    jumpGroup.addTargetedAnimation(lbJump, parts["Lower_Body"]);
    jumpGroup.addTargetedAnimation(rJump, parts["Root"]);
    jumpGroup.addTargetedAnimation(luaJump, parts["Left_Upper_Arm"]);
    jumpGroup.addTargetedAnimation(llaJump, parts["Left_Lower_Arm"]);
    jumpGroup.addTargetedAnimation(lhJump, parts["Left_Hand"]);
    jumpGroup.addTargetedAnimation(ruaJump, parts["Right_Upper_Arm"]);
    jumpGroup.addTargetedAnimation(rlaJump, parts["Right_Lower_Arm"]);
    jumpGroup.addTargetedAnimation(rhJump, parts["Right_Hand"]);
    jumpGroup.addTargetedAnimation(lulJump, parts["Left_Upper_Leg"]);
    jumpGroup.addTargetedAnimation(lllJump, parts["Left_Lower_Leg"]);
    jumpGroup.addTargetedAnimation(lsJump, parts["Left_Shoe"]);
    jumpGroup.addTargetedAnimation(rulJump, parts["Right_Upper_Leg"]);
    jumpGroup.addTargetedAnimation(rllJump, parts["Right_Lower_Leg"]);
    jumpGroup.addTargetedAnimation(rsJump, parts["Right_Shoe"]);
    jumpGroup.normalize(0, 30);

    return jumpGroup;
}
function fallingAnimation(parts) {
    var fallingGroup = new BABYLON.AnimationGroup("falling");
    var hFalling = new BABYLON.Animation("falling_head", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var nFalling = new BABYLON.Animation("falling_neck", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var ubFalling = new BABYLON.Animation("falling_upper_body", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lbFalling = new BABYLON.Animation("falling_lower_body", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rFalling = new BABYLON.Animation("falling_root", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var luaFalling = new BABYLON.Animation("falling_left_upper_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var llaFalling = new BABYLON.Animation("falling_left_lower_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lhFalling = new BABYLON.Animation("falling_left_hand", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var ruaFalling = new BABYLON.Animation("falling_right_upper_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rlaFalling = new BABYLON.Animation("falling_right_lower_arm", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rhFalling = new BABYLON.Animation("falling_right_hand", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lulFalling = new BABYLON.Animation("falling_left_upper_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lllFalling = new BABYLON.Animation("falling_left_lower_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var lsFalling = new BABYLON.Animation("falling_left_shoe", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rulFalling = new BABYLON.Animation("falling_right_upper_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rllFalling = new BABYLON.Animation("falling_right_lower_leg", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var rsFalling = new BABYLON.Animation("falling_right_shoe", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

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
    {
        hKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-7))});
        hKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-4))});
        hKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(3))});
        hKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-3.8))});
        hKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-7))});
        hFalling.setKeys(hKeys);
    }

    // Neck keys
    {
        nKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-8))});
        nKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-13.6))});//19.7
        nKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-11.9))});//20.8
        nKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-14.1))});//38
        nKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-8))});
        nFalling.setKeys(nKeys);
    }

    // Upper_Body keys
    {
        ubKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-0.7))});
        ubKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-1.37))});//-16.1
        ubKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-3.93))});//-19.7
        ubKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-6.63))});//-25.7
        ubKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(0), toRad(0), toRad(-0.7))});
        ubFalling.setKeys(ubKeys);
    }

    // Lower_Body keys
    {
        lbKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(0.0), toRad(0), toRad(2.35))});
        lbKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(0.0), toRad(0), toRad(3.18))});
        lbKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(0.0), toRad(0), toRad(5.88))});
        lbKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(0.0), toRad(0), toRad(8.46))});
        lbKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(0.0), toRad(0), toRad(2.35))});
        lbFalling.setKeys(lbKeys);
    }

    // Root_Body keys
    {
        rKeys.push({frame: 1, value: new BABYLON.Vector3(0, 0.21, 0)});
        rKeys.push({frame: 8, value: new BABYLON.Vector3(0, 0.21, 0)});
        rKeys.push({frame: 15, value: new BABYLON.Vector3(0, 0.21, 0)});
        rKeys.push({frame: 23, value: new BABYLON.Vector3(0, 0.21, 0)});
        rKeys.push({frame: 30, value: new BABYLON.Vector3(0, 0.21, 0)});
        rFalling.setKeys(rKeys);
    }

    // Left_Upper_Arm keys
    {
        luaKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(11), toRad(-34.5), toRad(-8))});
        luaKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(16.6), toRad(-38.5), toRad(-12.5))});
        luaKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(15.2), toRad(-34), toRad(-11))});
        luaKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(10.8), toRad(-32), toRad(-8))});
        luaKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(11), toRad(-34.5), toRad(-8))});
        luaFalling.setKeys(luaKeys);
    }

    // Left_Lower_Arm keys
    {
        llaKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(-14), toRad(62), toRad(-4))});
        llaKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(-12), toRad(64), toRad(-4))});
        llaKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(-10), toRad(61.5), toRad(-2))});
        llaKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(-11), toRad(58.5), toRad(-1.3))});
        llaKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(-14), toRad(62), toRad(-4))});
        llaFalling.setKeys(llaKeys);
    }

    // Left_Hand keys
    {
        lhKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(-14.3), toRad(14.5), toRad(-12.5))});
        lhKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(-42), toRad(4.75), toRad(-30))});
        lhKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(-37), toRad(8.75), toRad(-29))});
        lhKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(-47), toRad(3), toRad(-34.5))});
        lhKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(-14.3), toRad(14.5), toRad(-12.5))});
        lhFalling.setKeys(lhKeys);
    }

    // Right_Upper_Arm keys
    {
        ruaKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(-27), toRad(24), toRad(15.1))});
        ruaKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(-24.5), toRad(24), toRad(14))});
        ruaKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(-21), toRad(28), toRad(12))});
        ruaKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(-22), toRad(28), toRad(13))});
        ruaKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(-27), toRad(24), toRad(15.1))});
        ruaFalling.setKeys(ruaKeys);
    }

    // Right_Lower_Arm keys
    {
        rlaKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(-11), toRad(-39), toRad(-11))});
        rlaKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(-17), toRad(-51), toRad(-12.5))});
        rlaKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(-8), toRad(-32), toRad(-10))});
        rlaKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(-10.5), toRad(-41), toRad(-11))});
        rlaKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(-11), toRad(-39), toRad(-11))});
        rlaFalling.setKeys(rlaKeys);
    }

    // Right_Hand keys
    {
        rhKeys.push({frame: 1, value: new BABYLON.Vector3(toRad(6.5), toRad(9.8), toRad(21.5))});
        rhKeys.push({frame: 8, value: new BABYLON.Vector3(toRad(11), toRad(10), toRad(10))});
        rhKeys.push({frame: 15, value: new BABYLON.Vector3(toRad(3.60), toRad(4.5), toRad(3.3))});
        rhKeys.push({frame: 23, value: new BABYLON.Vector3(toRad(7.75), toRad(11.5), toRad (8.5))});
        rhKeys.push({frame: 30, value: new BABYLON.Vector3(toRad(6.5), toRad(9.8), toRad(21.5))});
        rhFalling.setKeys(rhKeys);
    }

    // Left_Upper_Leg keys
    {lulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(-20.1), toRad(63))});
        lulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-1.41), toRad(-17.5), toRad(61))});
        lulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(2.82), toRad(-22.7), toRad(66.1))});
        lulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(4.41), toRad(-24.2), toRad(67.5))});
        lulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(-20.1), toRad(63))});
        lulFalling.setKeys(lulKeys);}

    // Left_Lower_Leg keys
    {lllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(1.8), toRad(-5.6), toRad(-70))});
        lllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(6), toRad(-3), toRad(-55))});
        lllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0.5), toRad(-6), toRad(-71))});
        lllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(2.5), toRad(-5.5), toRad(-69))});
        lllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(1.8), toRad(-5.6), toRad(-70))});
        lllFalling.setKeys(lllKeys);}

    // Left_Shoe keys
    {lsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-14), toRad(-8), toRad(-27))});
        lsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-25), toRad(-16), toRad(-42))});
        lsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-16), toRad(-10), toRad(-30))});
        lsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-19.5), toRad(-13), toRad(-35))});
        lsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-14), toRad(-8), toRad(-27))});
        lsFalling.setKeys(lsKeys);}

    // Right_Upper_Leg keys
    {rulKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(0), toRad(-8.4), toRad(43))});
        rulKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-0.4), toRad(-12), toRad(41))});
        rulKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(0.3), toRad(-8.5), toRad(45))});
        rulKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(0.6), toRad(-8.6), toRad(46))});
        rulKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(0), toRad(-8.4), toRad(43))});
        rulFalling.setKeys(rulKeys);}

    // Right_Lower_Leg keys
    {rllKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-6), toRad(3), toRad(-48))});
        rllKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-4.5), toRad(2.1), toRad(-29))});
        rllKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-5.33), toRad(2.7), toRad(-40))});
        rllKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-5.3), toRad(2.7), toRad(-40))});
        rllKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-6), toRad(3), toRad(-48))});
        rllFalling.setKeys(rllKeys);}

    // Right_Shoe keys
    {rsKeys.push({frame: 1,value: new BABYLON.Vector3(toRad(-0.8), toRad(0.9), toRad(-7.7))});
        rsKeys.push({frame: 8,value: new BABYLON.Vector3(toRad(-1.45), toRad(1.60), toRad(-13.5))});
        rsKeys.push({frame: 15,value: new BABYLON.Vector3(toRad(-1.4), toRad(1.8), toRad(-15))});
        rsKeys.push({frame: 23,value: new BABYLON.Vector3(toRad(-1.5), toRad(1.89), toRad(-16))});
        rsKeys.push({frame: 30,value: new BABYLON.Vector3(toRad(-0.8), toRad(0.9), toRad(-7.7))});
        rsFalling.setKeys(rsKeys);}

    fallingGroup.addTargetedAnimation(hFalling, parts["Head"]);
    fallingGroup.addTargetedAnimation(nFalling, parts["Neck"]);
    fallingGroup.addTargetedAnimation(ubFalling, parts["Upper_Body"]);
    fallingGroup.addTargetedAnimation(lbFalling, parts["Lower_Body"]);
    fallingGroup.addTargetedAnimation(rFalling, parts["Root"]);
    fallingGroup.addTargetedAnimation(luaFalling, parts["Left_Upper_Arm"]);
    fallingGroup.addTargetedAnimation(llaFalling, parts["Left_Lower_Arm"]);
    fallingGroup.addTargetedAnimation(lhFalling, parts["Left_Hand"]);
    fallingGroup.addTargetedAnimation(ruaFalling, parts["Right_Upper_Arm"]);
    fallingGroup.addTargetedAnimation(rlaFalling, parts["Right_Lower_Arm"]);
    fallingGroup.addTargetedAnimation(rhFalling, parts["Right_Hand"]);
    fallingGroup.addTargetedAnimation(lulFalling, parts["Left_Upper_Leg"]);
    fallingGroup.addTargetedAnimation(lllFalling, parts["Left_Lower_Leg"]);
    fallingGroup.addTargetedAnimation(lsFalling, parts["Left_Shoe"]);
    fallingGroup.addTargetedAnimation(rulFalling, parts["Right_Upper_Leg"]);
    fallingGroup.addTargetedAnimation(rllFalling, parts["Right_Lower_Leg"]);
    fallingGroup.addTargetedAnimation(rsFalling, parts["Right_Shoe"]);
    fallingGroup.normalize(0, 30);

    return fallingGroup;
}

var createL1 = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3.White();
    scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
    scene.collisionsEnabled = true;

    var light1 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, 1), scene);
    light1.intensity = 1;

    var light2 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, -1), scene);
    light2.intensity = 0.4;

    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0,0, new BABYLON.Vector3(0, 0, 0), scene);


    scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
    scene.animationPropertiesOverride.enableBlending = true;
    scene.animationPropertiesOverride.blendingSpeed = 0.1;
    scene.animationPropertiesOverride.loopMode = 1;

    //SKYBOX
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("../L1/skybox/nightsky", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    var music = new BABYLON.Sound("Music", "../musics/first.mp3", scene,
        function () {
            music.play();
        },
    { loop: true });

    BABYLON.SceneLoader.Append("", "../L1/L1.babylon", scene, function (scene) {
        // Define the controller
        var OBJ_Controller = scene.getMeshByName("OBJ_Controller");
        OBJ_Controller.checkCollisions = true;
        OBJ_Controller.showBoundingBox = false;
        OBJ_Controller._gameParameters = gameParameters;

        // SPAWN POINT && RESET
        var spawn_point = new BABYLON.Vector3(OBJ_Controller.position.x, OBJ_Controller.position.y, OBJ_Controller.position.z);
        var CX_Floor = scene.getMeshByName("CX_Floor");

        var MAT_wireframe = new BABYLON.StandardMaterial("MAT_wireframe", scene);
        MAT_wireframe.wireframe = true;
        MAT_wireframe.alpha = 0;
        OBJ_Controller.material = MAT_wireframe;

        // Camera Settings
        camera.setPosition(new BABYLON.Vector3(OBJ_Controller.position.x , OBJ_Controller.position.y+10, OBJ_Controller.position.z));
        camera.radius = 5;
        camera.wheelPrecision = 1000;
        camera.lockedTarget = OBJ_Controller;
        scene.activeCamera.attachControl(canvas, true);

        // Character Settings
        var CHAR_MESH = scene.getMeshByName("Root");
        CHAR_MESH.rotation.y = toRad(360);
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

        // Animation Definitions
        OBJ_Controller._gameParameters["idleAnim"] = idleAnimation(body_parts);
        OBJ_Controller._gameParameters["runAnim"] = runAnimation(body_parts);
        OBJ_Controller._gameParameters["jumpAnim"] = jumpAnimation(body_parts);
        OBJ_Controller._gameParameters["fallAnim"] = fallingAnimation(body_parts);

        // Lever definition
        var rod = scene.getMeshByName("Obj_Rod");
        var rodAnim = leverAnimation(rod);
        var tb_lever = scene.getMeshByName("TB_lever");
        tb_lever.material = MAT_wireframe;

        // Wall definition
        var wall = scene.getMeshByName("CX_Obj_wall");
        var wallAnim = wallAnimation(wall, wall.position);

        //Lamp tb definition
        var tb_lamp = scene.getMeshByName("TB_Lamp");
        tb_lamp.material = MAT_wireframe;

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
            if(e.keyCode == 32){// --> SPACE
                if(!OBJ_Controller._gameParameters["isJumping"] && OBJ_Controller._gameParameters["isGrounded"]) {
                    OBJ_Controller._gameParameters["jumpStartTime"] = Date.now();
                    OBJ_Controller._gameParameters["jumpPower"] = 1;
                    OBJ_Controller._gameParameters["isJumping"] = true;
                    OBJ_Controller._gameParameters["moveSpeed"] = 8;
                }
            }
            if(e.key == 'e'){// --> E
                if(!rodAnim.isStarted && OBJ_Controller._gameParameters["lever_enabled"]) {
                    rodAnim.start();
                    if(!OBJ_Controller._gameParameters["wall_down"]){
                        wallAnim.start();
                        OBJ_Controller._gameParameters["wall_down"] = true;
                    }
                }

                if(OBJ_Controller._gameParameters["lamp_enabled"]){
                    window.location = "../L2/L2.html";
                }
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
            if(e.keyCode == 32){// --> SPACE
            }
        });

        var gl = new BABYLON.GlowLayer("glow", scene);
        create_materials(scene);

        // Physics definitions
        var ground_objects = [];
        for (i = 0; i<scene.meshes.length;i++){
            if(scene.meshes[i].name.includes("CX")){
                scene.meshes[i].checkCollisions = true;
                ground_objects.push(scene.meshes[i]);
                if(!scene.meshes[i].name.includes("Obj")) {
                    scene.meshes[i].material = MAT_wireframe;
                }

            }
        }
        scene.registerBeforeRender(function () {
            OBJ_Controller._gameParameters["jumpPower"] = updateJump(OBJ_Controller._gameParameters["jumpStartTime"]);
            OBJ_Controller.moveWithCollisions(new BABYLON.Vector3( OBJ_Controller._gameParameters["fw"] + OBJ_Controller._gameParameters["rt"] , (OBJ_Controller._gameParameters["fallSpeed"]*OBJ_Controller._gameParameters["dt"]) + 0.3*OBJ_Controller._gameParameters["jumpPower"], OBJ_Controller._gameParameters["bw"] + OBJ_Controller._gameParameters["lt"]));
            reset(OBJ_Controller,CX_Floor,spawn_point);
            triggers_manager(OBJ_Controller, tb_lever, tb_lamp, gl);
            animation_manager(OBJ_Controller);
            state_manager(OBJ_Controller, ground_objects, scene);
            update_gameparameters(OBJ_Controller, scene, engine);
        })

    });

    return scene;
};



var scene = createL1();



engine.runRenderLoop(function(){

    scene.render();

});

