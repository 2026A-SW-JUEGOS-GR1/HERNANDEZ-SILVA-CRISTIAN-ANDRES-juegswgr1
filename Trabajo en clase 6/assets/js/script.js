var canvas = document.getElementById('renderCanvas');
var engine = new BABYLON.Engine(canvas, true, { stencil: true, preserveDrawingBuffer: true, antialias: true });

var scene, camera, arcCamera;
var lightHemi, lightSun, lightInterior1, lightInterior2, lightInterior3;
var ground, shadowGenerator;
var modelHouse;
var hl;
var extraModels = [];

var walkMode = false;
var keys = {};
var walkSpeed = 4;

var playerMesh = null;
var thirdPersonCamera = null;
var cameraOffset = new BABYLON.Vector3(0, 40, -80);
var defaultCamOffset = new BABYLON.Vector3(0, 40, -80);

var cameraSticker1, cameraSticker2, cameraSticker3, cameraSticker4;
var universalCamera1, universalCamera2, universalCamera3, universalCamera4;

var createScene = function () {
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1);
    scene.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.25);
    scene.collisionsEnabled = false;

    arcCamera = new BABYLON.ArcRotateCamera("arcCamera", -0.36, 1.53, 1500, new BABYLON.Vector3(0, 50, 0), scene);
    arcCamera.attachControl(canvas, false);
    arcCamera.upperBetaLimit = 1.57;
    arcCamera.wheelPrecision = 0.2;
    arcCamera.upperRadiusLimit = 2000;
    arcCamera.lowerRadiusLimit = 500;
    arcCamera.checkCollisions = false;
    arcCamera.applyGravity = false;
    camera = arcCamera;

    thirdPersonCamera = new BABYLON.ArcRotateCamera("thirdPersonCam", -Math.PI / 2, 1.1, 80, BABYLON.Vector3.Zero(), scene);
    thirdPersonCamera.lowerRadiusLimit = 30;
    thirdPersonCamera.upperRadiusLimit = 150;
    thirdPersonCamera.wheelPrecision = 5;
    thirdPersonCamera.lowerBetaLimit = 0.3;
    thirdPersonCamera.upperBetaLimit = 1.4;
    thirdPersonCamera.checkCollisions = false;
    thirdPersonCamera.applyGravity = false;
    thirdPersonCamera.minZ = 1;
    thirdPersonCamera.panningSensibility = 0;

    lightHemi = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    lightHemi.intensity = 0.6;
    lightHemi.diffuse = new BABYLON.Color3(0.8, 0.85, 1.0);
    lightHemi.groundColor = new BABYLON.Color3(0.3, 0.35, 0.25);

    lightSun = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(-1, -2, 1.5), scene);
    lightSun.position = new BABYLON.Vector3(2000, 4000, -2000);
    lightSun.intensity = 1.2;
    lightSun.diffuse = new BABYLON.Color3(1, 0.95, 0.85);

    shadowGenerator = new BABYLON.ShadowGenerator(2048, lightSun);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.setDarkness(0.3);

    lightInterior1 = new BABYLON.PointLight("interiorLight1", new BABYLON.Vector3(50, 80, 50), scene);
    lightInterior1.intensity = 0.8;
    lightInterior1.diffuse = new BABYLON.Color3(1, 0.95, 0.85);
    lightInterior1.range = 300;

    lightInterior2 = new BABYLON.PointLight("interiorLight2", new BABYLON.Vector3(-100, 80, -50), scene);
    lightInterior2.intensity = 0.8;
    lightInterior2.diffuse = new BABYLON.Color3(1, 0.95, 0.85);
    lightInterior2.range = 300;

    lightInterior3 = new BABYLON.PointLight("interiorLight3", new BABYLON.Vector3(50, 80, -150), scene);
    lightInterior3.intensity = 0.6;
    lightInterior3.diffuse = new BABYLON.Color3(0.9, 0.9, 1.0);
    lightInterior3.range = 300;

    hl = new BABYLON.HighlightLayer("hl", scene);
    hl.blurHorizontalSize = 2;
    hl.blurVerticalSize = 2;

    var assetsManager = new BABYLON.AssetsManager(scene);

    var meshTask1 = assetsManager.addMeshTask("house task", "", "assets/models/house/", "house.babylon");
    meshTask1.onSuccess = function (task) {
        for (var i in task.loadedMeshes) {
            var mesh = task.loadedMeshes[i];
            if (mesh.name.includes("PLAN_FLOOR_01") || mesh.name.includes("PLAN_FLOOR_02")) {
                mesh.visibility = false;
                hl.addMesh(mesh, BABYLON.Color3.Green());
            }
            mesh.position.y -= 35;

            shadowGenerator.addShadowCaster(mesh);
            mesh.receiveShadows = true;
        }
        modelHouse = task.loadedMeshes;

        for (var i in modelHouse) {
            if (modelHouse[i].material && modelHouse[i].material.name == '_BARN H objGLASS___CLEAR') {
                modelHouse[i].material.reflectionTexture = new BABYLON.CubeTexture("assets/texture/skybox/TropicalSunnyDay", scene);
                modelHouse[i].material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
                modelHouse[i].material.reflectionFresnelParameters.power = 100;
                modelHouse[i].material.specularPower = 500;
            }
        }

        loadCharacterFromProject();
    };

    meshTask1.onError = function (task, message, exception) {
        console.log("House load error:", task, message, exception);
    };

    assetsManager.load();

    ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("ground", "assets/texture/heightMap-01.png", {
        width: 6000, height: 6000, subdivisions: 30, minHeight: 0, maxHeight: 500
    }, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("assets/texture/grass.jpg", scene);
    groundMaterial.diffuseTexture.uScale = 40;
    groundMaterial.diffuseTexture.vScale = 40;
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    ground.material = groundMaterial;
    ground.receiveShadows = true;

    ground.onReady = function () {
        BABYLON.SceneLoader.ImportMesh("", "assets/models/terrain/", "tree-01.babylon", scene, function (newMeshes) {
            newMeshes[0].material.opacityTexture = null;
            newMeshes[0].material.backFaceCulling = false;
            newMeshes[0].isVisible = false;
            newMeshes[0].position.y = ground.getHeightAtCoordinates(0, 0);

            shadowGenerator.addShadowCaster(newMeshes[0]);

            var treeAxis = [
                [2000, 2000, 0], [-2000, 2000, 100], [-1800, 2300, 200],
                [-2500, 1800, 240], [-2000, 1600, 100], [-2500, 1400, 100],
                [-1000, 1000, 0], [-1500, 400, 0], [-1200, 0, 0],
                [-1500, -300, 0], [-2500, 0, 0], [-2000, -300, 0],
                [-2200, -900, 0], [-1600, -1400, 0], [0, 1200, 0],
                [400, 1200, 0], [800, 1200, 0], [-200, 1600, 0],
                [200, 2000, 0], [600, 1800, 0], [0, -800, 0],
                [400, -1100, 0], [800, -1400, 0], [-900, -1300, 0],
                [-600, -1100, 0], [-800, -1900, 0]
            ];
            for (var index = 0; index < treeAxis.length; index++) {
                var newInstance = newMeshes[0].createInstance("tree_" + index);
                newInstance.position = new BABYLON.Vector3(treeAxis[index][0], treeAxis[index][1], treeAxis[index][2]);
                newInstance.rotate(BABYLON.Axis.Y, Math.random() * Math.PI * 2, BABYLON.Space.WORLD);
                var scale = 0.5 + Math.random() * 2;
                newInstance.scaling = new BABYLON.Vector3(scale, scale, scale);
                newInstance.checkCollisions = true;
                shadowGenerator.addShadowCaster(newInstance);
            }

            camera.checkCollisions = true;
        });
    };

    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 10000 }, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/texture/skybox/TropicalSunnyDay", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skybox.rotation.y = -Math.PI / 2;

    BABYLON.SceneLoader.ImportMesh("", "assets/models/terrain/", "map-sticker.babylon", scene, function (newMeshes) {
        var cameraStickerPosition = [
            [600, 600], [1000, -400], [-1000, -800], [-800, 700]
        ];

        cameraSticker1 = newMeshes[0];
        cameraSticker1.position = new BABYLON.Vector3(cameraStickerPosition[0][0], 10, cameraStickerPosition[0][1]);
        cameraSticker1.name = "camera-sticker-01";
        cameraSticker1.rotate(BABYLON.Axis.Y, Math.random() * Math.PI * 2, BABYLON.Space.WORLD);

        universalCamera1 = new BABYLON.UniversalCamera("camera-001", new BABYLON.Vector3(cameraStickerPosition[0][0], 60, cameraStickerPosition[0][1]), scene);
        universalCamera1.setTarget(BABYLON.Vector3.Zero());
        universalCamera1.keysDown = [];
        universalCamera1.keysUp = [];
        universalCamera1.keysLeft = [];
        universalCamera1.keysRight = [];

        cameraSticker2 = cameraSticker1.clone();
        cameraSticker2.position = new BABYLON.Vector3(cameraStickerPosition[1][0], 10, cameraStickerPosition[1][1]);
        cameraSticker2.name = "camera-sticker-02";
        cameraSticker2.rotate(BABYLON.Axis.Y, Math.random() * Math.PI * 2, BABYLON.Space.WORLD);

        universalCamera2 = new BABYLON.UniversalCamera("camera-002", new BABYLON.Vector3(cameraStickerPosition[1][0], 60, cameraStickerPosition[1][1]), scene);
        universalCamera2.setTarget(BABYLON.Vector3.Zero());
        universalCamera2.keysDown = [];
        universalCamera2.keysUp = [];
        universalCamera2.keysLeft = [];
        universalCamera2.keysRight = [];

        cameraSticker3 = cameraSticker1.clone();
        cameraSticker3.position = new BABYLON.Vector3(cameraStickerPosition[2][0], 10, cameraStickerPosition[2][1]);
        cameraSticker3.name = "camera-sticker-03";
        cameraSticker3.rotate(BABYLON.Axis.Y, Math.random() * Math.PI * 2, BABYLON.Space.WORLD);

        universalCamera3 = new BABYLON.UniversalCamera("camera-003", new BABYLON.Vector3(cameraStickerPosition[2][0], 60, cameraStickerPosition[2][1]), scene);
        universalCamera3.setTarget(BABYLON.Vector3.Zero());
        universalCamera3.keysDown = [];
        universalCamera3.keysUp = [];
        universalCamera3.keysLeft = [];
        universalCamera3.keysRight = [];

        cameraSticker4 = cameraSticker1.clone();
        cameraSticker4.position = new BABYLON.Vector3(cameraStickerPosition[3][0], 10, cameraStickerPosition[3][1]);
        cameraSticker4.name = "camera-sticker-04";
        cameraSticker4.rotate(BABYLON.Axis.Y, Math.random() * Math.PI * 2, BABYLON.Space.WORLD);

        universalCamera4 = new BABYLON.UniversalCamera("camera-004", new BABYLON.Vector3(cameraStickerPosition[3][0], 60, cameraStickerPosition[3][1]), scene);
        universalCamera4.setTarget(BABYLON.Vector3.Zero());
        universalCamera4.keysDown = [];
        universalCamera4.keysUp = [];
        universalCamera4.keysLeft = [];
        universalCamera4.keysRight = [];

        scene.registerBeforeRender(function () {
            cameraSticker1.rotation.y += 0.1;
            cameraSticker2.rotation.y += 0.1;
            cameraSticker3.rotation.y += 0.1;
            cameraSticker4.rotation.y += 0.1;
        });
    });

    BABYLON.SceneLoader.ImportMesh("", "assets/models/terrain/", "garden.babylon", scene, function (newMeshes) {
        for (var i in newMeshes) {
            newMeshes[i].position.z += 19;
            shadowGenerator.addShadowCaster(newMeshes[i]);
        }

        BABYLON.SceneLoader.ImportMesh("", "assets/models/terrain/", "tree-01.babylon", scene, function (newMeshes) {
            newMeshes[0].material.opacityTexture = null;
            newMeshes[0].material.backFaceCulling = false;
            newMeshes[0].isVisible = false;
            newMeshes[0].position.y = ground.getHeightAtCoordinates(0, 0);

            var treeAxis2 = [
                [400, -450, 0], [-300, -450, 0], [-300, 500, 0], [100, 500, 0]
            ];
            for (var index = 0; index < treeAxis2.length; index++) {
                var newInstance = newMeshes[0].createInstance("gardenTree_" + index);
                newInstance.position = new BABYLON.Vector3(treeAxis2[index][0], treeAxis2[index][1], treeAxis2[index][2]);
                newInstance.rotate(BABYLON.Axis.Y, Math.random() * Math.PI * 2, BABYLON.Space.WORLD);
                var scale = Math.random() / 5;
                newInstance.scaling = new BABYLON.Vector3(scale, scale, scale);
                shadowGenerator.addShadowCaster(newInstance);
            }
        });
    });

    return scene;
};

var scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener('resize', function () {
    engine.resize();
});

// ===================== WALK MODE =====================

function createPlayerMesh() {
    var body = BABYLON.MeshBuilder.CreateCapsule("playerBody", {
        height: 60,
        radius: 12,
        tessellation: 16
    }, scene);

    var bodyMat = new BABYLON.StandardMaterial("playerMat", scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1.0);
    bodyMat.alpha = 0.4;
    bodyMat.specularColor = new BABYLON.Color3(0, 0, 0);
    body.material = bodyMat;

    body.checkCollisions = false;

    return body;
}

function enterWalkMode() {
    walkMode = true;

    if (!playerMesh) {
        playerMesh = createPlayerMesh();
        extraModels.push(playerMesh);
    }

    var groundY = ground.getHeightAtCoordinates(playerMesh.position.x, playerMesh.position.z) || 0;
    playerMesh.position.y = groundY + 10;

    thirdPersonCamera.target = playerMesh.position.clone();
    thirdPersonCamera.target.y += 20;
    thirdPersonCamera.alpha = -Math.PI / 2;
    thirdPersonCamera.beta = 1.1;
    thirdPersonCamera.radius = 80;

    scene.activeCamera = thirdPersonCamera;
    thirdPersonCamera.attachControl(canvas, false);
    thirdPersonCamera.inputs.attached.mouse.buttons = [2];

    document.getElementById('walkInstructions').style.display = 'block';
}

function exitWalkMode() {
    walkMode = false;

    document.getElementById('walkInstructions').style.display = 'none';

    scene.activeCamera = arcCamera;
    arcCamera.attachControl(canvas, false);
}

document.getElementById('modeWalk').addEventListener('click', function () {
    if (!walkMode) {
        enterWalkMode();
        document.getElementById('modeWalk').classList.add('active');
        document.getElementById('modeOrbit').classList.remove('active');
    }
});

document.getElementById('modeOrbit').addEventListener('click', function () {
    if (walkMode) {
        exitWalkMode();
        document.getElementById('modeOrbit').classList.add('active');
        document.getElementById('modeWalk').classList.remove('active');
    }
});

document.addEventListener('keydown', function (e) {
    keys[e.code] = true;
});

document.addEventListener('keyup', function (e) {
    keys[e.code] = false;
});

scene.registerBeforeRender(function () {
    if (!walkMode || !playerMesh) return;

    var alpha = thirdPersonCamera.alpha;

    var forward = new BABYLON.Vector3(-Math.sin(alpha), 0, -Math.cos(alpha)).normalize();
    var right = new BABYLON.Vector3(Math.cos(alpha), 0, -Math.sin(alpha)).normalize();

    var displacement = BABYLON.Vector3.Zero();
    var isMoving = false;

    if (keys['KeyW']) {
        displacement.addInPlace(forward.scale(walkSpeed));
        isMoving = true;
    }
    if (keys['KeyS']) {
        displacement.addInPlace(forward.scale(-walkSpeed));
        isMoving = true;
    }
    if (keys['KeyA']) {
        displacement.addInPlace(right.scale(-walkSpeed));
        isMoving = true;
    }
    if (keys['KeyD']) {
        displacement.addInPlace(right.scale(walkSpeed));
        isMoving = true;
    }

    if (isMoving) {
        var newX = playerMesh.position.x + displacement.x;
        var newZ = playerMesh.position.z + displacement.z;

        var hitX = scene.pickWithRay(
            new BABYLON.Ray(new BABYLON.Vector3(newX, playerMesh.position.y + 15, playerMesh.position.z), new BABYLON.Vector3(displacement.x > 0 ? 1 : -1, 0, 0), 12),
            function (m) {
                if (!m.isVisible || m.name === "playerCharacter") return false;
                if (m.name.includes("WALL_") || m.name.includes("WIND_") || m.name.includes("DOOR_")) return true;
                return false;
            }
        );
        if (hitX && hitX.hit && hitX.distance < 12) {
            newX = playerMesh.position.x;
        }

        var hitZ = scene.pickWithRay(
            new BABYLON.Ray(new BABYLON.Vector3(playerMesh.position.x, playerMesh.position.y + 15, newZ), new BABYLON.Vector3(0, 0, displacement.z > 0 ? 1 : -1), 12),
            function (m) {
                if (!m.isVisible || m.name === "playerCharacter") return false;
                if (m.name.includes("WALL_") || m.name.includes("WIND_") || m.name.includes("DOOR_")) return true;
                return false;
            }
        );
        if (hitZ && hitZ.hit && hitZ.distance < 12) {
            newZ = playerMesh.position.z;
        }

        playerMesh.position.x = newX;
        playerMesh.position.z = newZ;
    }

    playerMesh.rotation.y = thirdPersonCamera.alpha;

    var groundFilter = function (mesh) {
        if (!mesh.isVisible) return false;
        if (mesh.name === "skyBox" || mesh.name === "playerCharacter") return false;
        if (mesh.name.includes("camera-sticker") || mesh.name.includes("sky")) return false;
        if (mesh.name.includes("WALL_") || mesh.name.includes("WIND_") || mesh.name.includes("DOOR_")) return false;
        if (mesh.name.includes("ROOF_") || mesh.name.includes("SKY_")) return false;
        return true;
    };

    var groundY = 0;

    var rayDown = new BABYLON.Ray(
        new BABYLON.Vector3(playerMesh.position.x, playerMesh.position.y + 50, playerMesh.position.z),
        new BABYLON.Vector3(0, -1, 0), 300
    );
    var hitDown = scene.pickWithRay(rayDown, groundFilter);

    if (hitDown && hitDown.hit) {
        groundY = hitDown.pickedPoint.y;
    } else {
        var terrainY = ground.getHeightAtCoordinates(playerMesh.position.x, playerMesh.position.z);
        if (terrainY !== null && terrainY !== undefined) {
            groundY = terrainY;
        }
    }

    playerMesh.position.y += (groundY - playerMesh.position.y) * 0.3;

    thirdPersonCamera.target.x = playerMesh.position.x;
    thirdPersonCamera.target.y = playerMesh.position.y + 20;
    thirdPersonCamera.target.z = playerMesh.position.z;
});

// ===================== EXTRA MODEL LOADER =====================

function loadCharacterFromProject() {
    if (playerMesh) return;

    BABYLON.SceneLoader.ImportMesh("", "", "assets/models/extra/Model.obj", scene,
        function (newMeshes) {
            var allMeshes = [];
            for (var i in newMeshes) {
                var mesh = newMeshes[i];
                mesh.checkCollisions = true;
                shadowGenerator.addShadowCaster(mesh);
                mesh.receiveShadows = true;
                if (mesh.material) {
                    mesh.material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
                }
                allMeshes.push(mesh);
            }

            if (allMeshes.length > 1) {
                var merged = BABYLON.Mesh.MergeMeshes(allMeshes, true, true, undefined, false, true);
                if (merged) {
                    setupPlayerMesh(merged);
                }
            } else if (allMeshes.length === 1) {
                setupPlayerMesh(allMeshes[0]);
            }
        },
        function (progress) {
            if (progress.lengthComputable) {
                console.log("Loading character...", Math.round(progress.loaded / progress.total * 100) + "%");
            }
        },
        function (scene, message, exception) {
            console.log("Character not loaded:", message);
        }
    );
}

function setupPlayerMesh(mesh) {
    mesh.name = "playerCharacter";
    mesh.checkCollisions = false;
    shadowGenerator.addShadowCaster(mesh);
    mesh.receiveShadows = true;

    var bounds = mesh.getBoundingInfo().boundingBox;
    var size = bounds.maximumWorld.subtract(bounds.minimumWorld);
    var maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        var s = 60 / maxDim;
        mesh.scaling = new BABYLON.Vector3(s, s, s);
    }

    var groundY = ground.getHeightAtCoordinates(0, 0) || 0;
    mesh.position = new BABYLON.Vector3(0, groundY + 10, 0);
    playerMesh = mesh;

    setTimeout(function () {
        enterWalkMode();
        document.getElementById('modeWalk').classList.add('active');
        document.getElementById('modeOrbit').classList.remove('active');
    }, 500);
}

document.getElementById('loadCharacterBtn').addEventListener('click', function () {
    if (playerMesh) {
        alert('Ya tienes un personaje cargado. Entra a Walk Mode para usarlo.');
        return;
    }
    loadCharacterFromProject();
});

document.getElementById('loadModelBtn').addEventListener('click', function () {
    document.getElementById('modelFileInput').click();
});

document.getElementById('modelFileInput').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;

    var fileName = file.name.toLowerCase();
    var validExts = ['.glb', '.gltf', '.babylon', '.obj', '.stl', '.dae'];
    var ext = validExts.find(function (ext) { return fileName.endsWith(ext); });
    if (!ext) {
        alert('Formato no soportado.');
        return;
    }

    var reader = new FileReader();
    reader.onload = function (ev) {
        var tempUrl = URL.createObjectURL(file);

        BABYLON.SceneLoader.ImportMesh("", "", tempUrl, scene,
            function (newMeshes) {
                var groundY = ground.getHeightAtCoordinates(0, 0) || 0;
                for (var i in newMeshes) {
                    var mesh = newMeshes[i];
                    mesh.position = new BABYLON.Vector3(0, groundY + 10, 0);
                    mesh.scaling = new BABYLON.Vector3(1, 1, 1);
                    mesh.checkCollisions = true;
                    mesh.ellipsoid = new BABYLON.Vector3(5, 10, 5);
                    shadowGenerator.addShadowCaster(mesh);
                    mesh.receiveShadows = true;
                    if (mesh.material) {
                        mesh.material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                    }
                    extraModels.push(mesh);
                }

                var bounds = newMeshes[0].getBoundingInfo().boundingBox;
                var size = bounds.maximumWorld.subtract(bounds.minimumWorld);
                var maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 300) {
                    var s = 200 / maxDim;
                    for (var i in newMeshes) {
                        newMeshes[i].scaling = new BABYLON.Vector3(s, s, s);
                    }
                }

                document.getElementById('modelPlacementHint').style.display = 'block';
                startPlacementMode(newMeshes);
                URL.revokeObjectURL(tempUrl);
            },
            function (progress) { },
            function (scene, message, exception) {
                console.log("Error loading model:", message, exception);
                alert("Error al cargar: " + message);
                URL.revokeObjectURL(tempUrl);
            }
        );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
});

var placementMode = false;
var placementMeshes = [];
var placementRotation = 0;

function startPlacementMode(meshes) {
    placementMode = true;
    placementMeshes = meshes;
    placementRotation = 0;
    scene.activeCamera = arcCamera;
    arcCamera.attachControl(canvas, false);
}

canvas.addEventListener('pointermove', function (evt) {
    if (!placementMode) return;
    var pickInfo = scene.pick(scene.pointerX, scene.pointerY);
    if (pickInfo.hit && pickInfo.pickedPoint) {
        for (var i in placementMeshes) {
            placementMeshes[i].position.x = pickInfo.pickedPoint.x;
            placementMeshes[i].position.z = pickInfo.pickedPoint.z;
            placementMeshes[i].position.y = pickInfo.pickedPoint.y;
        }
    }
});

canvas.addEventListener('pointerdown', function (evt) {
    if (!placementMode) return;
    if (evt.button === 0) {
        placementMode = false;
        placementMeshes = [];
        document.getElementById('modelPlacementHint').style.display = 'none';
    } else if (evt.button === 2) {
        for (var i in placementMeshes) {
            placementMeshes[i].dispose();
            var idx = extraModels.indexOf(placementMeshes[i]);
            if (idx > -1) extraModels.splice(idx, 1);
        }
        placementMode = false;
        placementMeshes = [];
        document.getElementById('modelPlacementHint').style.display = 'none';
    }
});

canvas.addEventListener('wheel', function (evt) {
    if (!placementMode) return;
    evt.preventDefault();
    var scaleFactor = evt.deltaY > 0 ? 0.95 : 1.05;
    for (var i in placementMeshes) {
        placementMeshes[i].scaling.scaleInPlace(scaleFactor);
    }
}, { passive: false });

document.addEventListener('keydown', function (e) {
    if (!placementMode) return;
    if (e.code === 'KeyR') {
        placementRotation += Math.PI / 8;
        for (var i in placementMeshes) {
            placementMeshes[i].rotation.y = placementRotation;
        }
    }
});

canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

// ===================== FLOOR SELECTION =====================

function hideFloor1() {
    for (var i in modelHouse) {
        var modelName = modelHouse[i].name;
        if (modelName.includes('CEIL_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('BEAM_F1_')) modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_F1_FOUNDATIONS_CONCEPT_WHITE') modelHouse[i].visibility = false;
        else if (modelName == 'MESH_GF_GROUND_FLOOR_CONCRETE___GENERAL') modelHouse[i].visibility = false;
        if (modelName.includes("PLAN_FLOOR_02")) modelHouse[i].visibility = false;
    }
}

function hideFloor1Base() {
    for (var i in modelHouse) {
        var modelName = modelHouse[i].name;
        if (modelName.includes('CEIL_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('BEAM_F1_')) modelHouse[i].visibility = false;
        else if (modelName.includes('DOOR_F1_')) modelHouse[i].visibility = false;
        else if (modelName.includes('OBJ_F1_')) modelHouse[i].visibility = false;
        else if (modelName.includes('WALL_F1_')) modelHouse[i].visibility = false;
        else if (modelName.includes('WIND_F1_')) modelHouse[i].visibility = false;
        else if (modelName == 'MESH_GF_GROUND_FLOOR_CONCRETE___GENERAL') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM59_PDM_GLASS_SIDEBOARD_0') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM60_PDM_STEEL_BRUSHED_54_FLAT_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM60_PDM_STEEL_BRUSHED_54_SMOOTH_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM61_0044_DARKGOLDENROD') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM58__COLOR_F17_2') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM56__AUTO_2_38') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GLASS___BLUE_SMOOTH_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GLASS___BLUE_FLAT_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM57_0022_MAROON') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM53__0136_CHARCOAL_1_FLAT_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM53__0136_CHARCOAL_1_SMOOTH_PART') modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_F1_FOUNDATIONS_CONCEPT_WHITE') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM54_DEFAULT') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_WOOD___HARDWOOD') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_PAINT_IVORY_BLACK_FLAT_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_PAINT_IVORY_BLACK') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM63_0038_ORANGE') modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_F1_FOUNDATIONS_WOOD___HARDWOOD') modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_F1_FOUNDATIONS_SURF_PORCELAIN') modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_F1_FOUNDATIONS_SURF___PLASTIC_LAMINATE') modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_F1_FOUNDATIONS_PAINT___TITANIUM_WHITE') modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_F1_FOUNDATIONS_FINISH___FLOOR_CARPET') modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_F1_FOUNDATIONS_CONCRETE___GENERAL') modelHouse[i].visibility = true;
        if (modelName.includes("PLAN_FLOOR_01")) modelHouse[i].visibility = true;
        if (modelName.includes("PLAN_FLOOR_02")) modelHouse[i].visibility = false;
    }
}

function hideFloor2() {
    for (var i in modelHouse) {
        var modelName = modelHouse[i].name;
        if (modelName.includes('ROOF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('SKY_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('BEAM_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('COLU_GF_')) modelHouse[i].visibility = false;
    }
}

function hideFloor2Base() {
    for (var i in modelHouse) {
        var modelName = modelHouse[i].name;
        if (modelName.includes('ROOF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('SKY_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('BEAM_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('DOOR_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('WIND_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('OBJ_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('COLU_GF_')) modelHouse[i].visibility = false;
        else if (modelName.includes('WALL_GF_')) modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_GF_GROUND_FLOOR_PAINT___TITANIUM_WHITE') modelHouse[i].visibility = false;
        else if (modelName == 'CEIL_GF_GROUND_FLOOR_WOOD___SOFTWOOD') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM62_0133_GRAY') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDML53__0136_CHARCOAL_1_FLAT_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM54_DEFAULT') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM56__AUTO_2_38') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM58__COLOR_F17_2') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM59_PDM_GLASS_SIDEBOARD_0') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM60_PDM_STEEL_BRUSHED_54_FLAT_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GDLM60_PDM_STEEL_BRUSHED_54_SMOOTH_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GLASS___BLUE_FLAT_PART') modelHouse[i].visibility = false;
        else if (modelName == 'OBJ_F1_FOUNDATIONS_GLASS___BLUE_SMOOTH_PART') modelHouse[i].visibility = false;
        else if (modelName == 'BEAM_F1_FOUNDATIONS_WOOD___HARDWOOD') modelHouse[i].visibility = false;
        if (modelName.includes("PLAN_FLOOR_02")) modelHouse[i].visibility = true;
    }
}

function loadPlan() {
    for (var i in modelHouse) {
        if (modelHouse[i].name.includes("PLAN_FLOOR_01") || modelHouse[i].name.includes("PLAN_FLOOR_02")) {
            modelHouse[i].material = new BABYLON.StandardMaterial(modelHouse[i].name + '_material', scene);
            modelHouse[i].material.diffuseTexture = new BABYLON.Texture(modelHouse[i].name.includes('PLAN_FLOOR_01') ? "assets/texture/plans/floor-plan-1.png" : "assets/texture/plans/floor-plan-2.png", scene);
            modelHouse[i].material.diffuseTexture.vOffset = 200;
            modelHouse[i].material.diffuseTexture.uScale = 0.0016;
            modelHouse[i].material.diffuseTexture.vScale = 0.0016;
            modelHouse[i].material.specularColor = new BABYLON.Color3(0, 0, 0);
        }
    }
}

$('.select-floor').click(function () {
    if (walkMode) {
        exitWalkMode();
        document.getElementById('modeOrbit').classList.add('active');
        document.getElementById('modeWalk').classList.remove('active');
    }

    var numFloor = parseInt($(this).attr('floor'));

    for (var i in modelHouse) {
        if (modelHouse[i].name.includes("PLAN_FLOOR_01") || modelHouse[i].name.includes("PLAN_FLOOR_02")) {
            modelHouse[i].visibility = false;
        } else {
            modelHouse[i].visibility = true;
        }
    }
    loadPlan();

    if (numFloor == 1) { hideFloor2Base(); hideFloor1(); }
    else if (numFloor == 2) { hideFloor2Base(); hideFloor1Base(); }
    else if (numFloor == 3) { hideFloor2(); }
    else if (numFloor == 4) { hideFloor2Base(); }
});

$('.normal-view').click(function () {
    if (walkMode) {
        exitWalkMode();
        document.getElementById('modeOrbit').classList.add('active');
        document.getElementById('modeWalk').classList.remove('active');
    }

    cameraSticker1.visibility = true;
    cameraSticker2.visibility = true;
    cameraSticker3.visibility = true;
    cameraSticker4.visibility = true;

    scene.activeCamera = arcCamera;
    scene.activeCamera.attachControl(canvas, false);
});

// ===================== PICKING / INTERACTION =====================

function onPointerMove(evt) {
    if (walkMode || placementMode) return;
    var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
        return (mesh.visibility && (mesh.name.includes("PLAN_FLOOR_01") || mesh.name.includes("PLAN_FLOOR_02")));
    });
    if (pickInfo.hit) {
        hl.isEnabled = true;
    } else {
        hl.isEnabled = false;
    }
}

function showModal(target) {
    $('body').append(
        '<div class="modal-container">' +
        '<div class="modal-content">' +
        '<div class="close-modal"></div>' +
        '<img src="assets/texture/plans/' + target + '" height="100%"></img>' +
        '</div>' +
        '</div>'
    );
    $('.close-modal').click(function () {
        $('.modal-container').remove();
    });
}

function onPointerDown(evt) {
    if (walkMode || placementMode) return;
    var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
        return (mesh.visibility && (mesh.name.includes("PLAN_FLOOR_01") || mesh.name.includes("PLAN_FLOOR_02") || mesh.name.includes('camera-sticker-')));
    });
    if (pickInfo.hit) {
        var currentMesh = pickInfo.pickedMesh;

        if (currentMesh.name.includes("PLAN_FLOOR_01")) {
            showModal("floor-plan-1.png");
        } else if (currentMesh.name.includes("PLAN_FLOOR_02")) {
            showModal("floor-plan-2.png");
        } else if (currentMesh.name.includes('camera-sticker-')) {
            cameraSticker1.visibility = true;
            cameraSticker2.visibility = true;
            cameraSticker3.visibility = true;
            cameraSticker4.visibility = true;

            switch (currentMesh.name) {
                case 'camera-sticker-01':
                    scene.activeCamera = universalCamera1;
                    scene.activeCamera.attachControl(canvas, false);
                    cameraSticker1.visibility = false;
                    break;
                case 'camera-sticker-02':
                    scene.activeCamera = universalCamera2;
                    scene.activeCamera.attachControl(canvas, false);
                    cameraSticker2.visibility = false;
                    break;
                case 'camera-sticker-03':
                    scene.activeCamera = universalCamera3;
                    scene.activeCamera.attachControl(canvas, false);
                    cameraSticker3.visibility = false;
                    break;
                case 'camera-sticker-04':
                    scene.activeCamera = universalCamera4;
                    scene.activeCamera.attachControl(canvas, false);
                    cameraSticker4.visibility = false;
                    break;
                default:
                    return;
            }
        }
    }
}

var canvas = engine.getRenderingCanvas();
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerdown', onPointerDown);
