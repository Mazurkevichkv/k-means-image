function kMeans ({ clustersCount = 10, elementsCount = 500, coord,  autoMode = false }) {
    const width = window.innerWidth - 50,
          height = window.innerHeight - 50,
          depth = 1000;
    let clusterizationCounter = 30;
    const canvas = document.getElementById('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setClearColor(0x000000);
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 0);
    const controls = new THREE.OrbitControls( camera );
    camera.position.set(0, 0, depth);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 0, depth);
    scene.add(ambientLight);
    scene.add(pointLight);

    const elementMeshes = createElements(coord);
    const centroidMeshes = createCentroids();
    scene.add(...elementMeshes, ...centroidMeshes);



    function createElements (coord) {
        const elementMeshes = [];
        for (let i = 0; i < coord.length; i++) {
            let mesh = createCubeMesh(coord[i]);
            mesh.position.x = coord[i][0];
            mesh.position.y = coord[i][1];
            mesh.position.z = coord[i][2];
            //setRandomPosition(mesh);
            elementMeshes.push(mesh);
        }
        return elementMeshes;
    }

    function createCentroids () {
        const centroidMeshes = [];
        for (let i = 0; i < clustersCount; i++) {
            const color = [ parseInt(Math.random() * 255),parseInt(Math.random() * 255), parseInt(Math.random() * 255) ];
            const mesh = createSphereMesh(color);
            mesh.position.x = color[0];
            mesh.position.y = color[1];
            mesh.position.z = color[2];
            //setRandomPosition(mesh);
            centroidMeshes.push(mesh);
        }
        return centroidMeshes;
    }

    function createSphereMesh (color = [ 0.5, 0.5, 0.5 ], radius = 15, widthSegments = 12, heightSegments = 12) {
        const geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments );
        const material = new THREE.MeshLambertMaterial();
        //material.color.setRGB(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        material.color = new THREE.Color(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        return new THREE.Mesh(geometry, material);
    }

    function createCubeMesh (color = [ 0.5, 0.5, 0.5 ], height = 13, width = 13, depth = 13) {
        const geometry = new THREE.BoxGeometry(height, width, depth);
        const material = new THREE.MeshLambertMaterial({ wireframe: true });
        //material.color.setRGB(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        material.color = new THREE.Color(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        return new THREE.Mesh(geometry, material);
    }

    function setRandomPosition (mesh) {
        mesh.position.x = Math.random() * width - width / 2;
        mesh.position.y = Math.random() * height - height / 2;
        mesh.position.z = Math.random() * depth - depth / 3 * 2;
    }

    let clusters;

    setTimeout(kMeansIteration, 1000);

    if (!autoMode) {
        document.getElementById('nextButton').onclick = kMeansIteration;
    }

    function kMeansIteration () {
        if (clusterizationCounter > 0) {
            clusters = clusterize();
            setCentroidsPositions();
        }
    }

    (function loop () {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(loop)
    })();

    function setCentroidsPositions () {
        for (let i = 0; i < clustersCount; i++) {
            const elementMeshes = clusters[i];
            let x = 0,
                y = 0,
                z = 0;

            for (let j = 0; j < elementMeshes.length; j++) {
                x += elementMeshes[j].position.x;
                y += elementMeshes[j].position.y;
                z += elementMeshes[j].position.z;
            }
            x = x / elementMeshes.length;
            y = y / elementMeshes.length;
            z = z / elementMeshes.length;
            animateChangePosition(centroidMeshes[i], centroidMeshes[i].position, { x, y, z });
        }

        function animateChangePosition(mesh, startPosition, targetPosition) {
            const speed = document.getElementById('speed').value;
            const eps = 10;
            const {x, y, z} = startPosition;

            const dist = getRawDistance(startPosition, targetPosition);
            const steps = dist / speed;
            if (dist < eps) {
                if (autoMode) {
                    if (clusterizationCounter > 0) {
                        requestAnimationFrame(kMeansIteration)
                    }
                }
                return;
            } else {
                mesh.position.x += (targetPosition.x - x) / steps;
                mesh.position.y += (targetPosition.y - y) / steps;
                mesh.position.z += (targetPosition.z - z) / steps;
                requestAnimationFrame(() => {
                    animateChangePosition(mesh, startPosition, targetPosition);
                })
            }
        }
    }

    function clusterize () {
        clusterizationCounter--;
        const clusters = new Array(clustersCount);
        for (let i = 0; i < clustersCount; i++) {
            clusters[i] = [];
        }

        for (let i = 0; i < elementMeshes.length; i++) {
            const elementMesh = elementMeshes[i];
            let clusterIndex = 0;
            let minDistance = Number.MAX_SAFE_INTEGER;

            for (let j = 0; j < centroidMeshes.length; j++) {
                const currDistance = getDistance(elementMesh, centroidMeshes[j]);
                if (currDistance < minDistance) {
                    minDistance = currDistance;
                    clusterIndex = j;
                }
            }

            elementMesh.material.color = centroidMeshes[clusterIndex].material.color;
            clusters[clusterIndex].push(elementMesh);
        }

        return clusters;
    }



    function getDistance (meshA, meshB) {
        return Math.sqrt(
            Math.pow(Math.sqrt(
                Math.pow( meshA.position.x - meshB.position.x, 2) +
                Math.pow(meshA.position.y - meshB.position.y, 2)
            ), 2) +
            Math.pow(meshA.position.z - meshB.position.z, 2)
        );
    }

    function getRawDistance (pointA, pointB) {
        return Math.sqrt(
            Math.pow(Math.sqrt(
                Math.pow(pointA.x - pointB.x, 2) +
                Math.pow(pointA.y - pointB.y, 2)
            ), 2) +
            Math.pow(pointA.z - pointB.z, 2)
        );
    }

    document.getElementById('finishButton').onclick = finish;

    function finish () {
        const canvas = document.getElementById('image');
        const newCanvas = document.getElementById('newimage');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        const ctx = newCanvas.getContext('2d');
        for (let i = 0; i < canvas.width; i++ ) {
            for (let j = 0; j < canvas.height; j++) {
                const imgData = ctx.createImageData(1, 1);
                const color = elementMeshes[i * canvas.width + j].material.color;
                imgData.data[0] = color.r * 255;
                imgData.data[1] = color.g * 255;
                imgData.data[2] = color.b * 255;
                imgData.data[3] = 255;
                ctx.putImageData(imgData, i, j);
            }
        }
    }
}

function start() {
    const coord = [];
    const canvas = document.getElementById('image');
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < canvas.width; i++ ) {
        for (let j = 0; j < canvas.height; j++) {
            coord.push(getPixel(ctx, i, j));
        }
    }

    function getPixel(ctx, x, y) {
        return ctx.getImageData(x, y, 1, 1).data;
    }

    const clustersCount = parseInt(document.getElementById('clustersCountInput').value);
    //const elementsCount = parseInt(document.getElementById('elementsCountInput').value);
    kMeans({ clustersCount, coord });
}

(function drawImg () {
    const canvas = document.getElementById("image");
    const ctx = canvas.getContext("2d");

    const image = new Image();
    image.src = "./pict2.png";
    image.onload = function() {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
    };
})();
