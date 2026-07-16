(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.d3 = {}));
})(this, (function (exports) { 'use strict';

    /**
     * Converts a point from 3D space to 2D space using orthographic projection.
     *
     * @param {Object} d - The 3D point to be projected.
     * @param {Object} options - Options for the projection.
     * @param {Array} options.origin - The origin point for the projection.
     * @param {number} options.scale - The scale factor for the projection.
     * @returns {Object} The projected point in 2D space.
     */
    function orthographic(d, options) {
        /**
         * @typedef {Object} Point2D
         * @property {number} x - The x-coordinate in 2D space.
         * @property {number} y - The y-coordinate in 2D space.
         */

        /**
         * @type {Point2D}
         */
        return {
            x: options.origin.x + options.scale * d.x,
            y: options.origin.y + options.scale * d.y
        };
    }

    /**
     * Returns the x-coordinate of a point in 3D space.
     *
     * @param {Object} p - The point in 3D space represented as an object e.g {x: 0, y: 1, z: 0}
     * @returns {number} The x-coordinate of the point.
     */
    function x(p) {
        return p.x;
    }

    /**
     * Returns the y-coordinate of a point in 3D space.
     *
     * @param {Object} p - The point in 3D space represented as an object e.g x: 0, y: 1, z: 0}
     * @returns {number} The y-coordinate of the point.
     */
    function y(p) {
        return p.y;
    }

    /**
     * Returns the z-coordinate of a point in 3D space.
     *
     * @param {Object} p - The point in 3D space represented as an object e.g {x: 0, y: 1, z: 0}
     * @returns {number} The z-coordinate of the point.
     */
    function z(p) {
        return p.z;
    }

    /**
     * Comparator function to sort objects based on their centroid z-values.
     *
     * This function compares the z-values of the centroid property of two objects (a and b).
     * It returns a negative number if a should come before b, a positive number if a should come after b,
     * and 0 if a and b are considered equal in terms of sorting.
     *
     * @param {Object} a - The first object to compare.
     * @param {Object} b - The second object to compare.
     * @returns {number} - A negative, zero, or positive number indicating the sorting order.
     *
     * @example
     * // Sorting an array of objects based on centroid z-values
     * const sortedArray = unsortedArray.sort(sort);
     */
    function sort(a, b) {
        // Extract z-values from objects
        const pa = a.centroid.z;
        const pb = b.centroid.z;

        // Compare z-values for sorting
        return pa < pb ? -1 : pa > pb ? 1 : pa >= pb ? 0 : NaN;
    }

    /**
     * Generates 3D shapes based on specified parameters and transformations.
     *
     * @param {Function} transform - The transformation function for generating 3D shapes.
     * @param {Function|undefined} draw - The drawing function for rendering the generated 3D shapes.
     * @returns {Function} - A function that, when called with data, generates and returns an array of 3D shapes.
     */
    function generator3D(transform, draw) {
        let angleX = 0;
        let angleY = 0;
        let angleZ = 0;
        let origin = { x: 0, y: 0 };
        let rotateCenter = { x: 0, y: 0, z: 0 };
        let scale = 1;
        let x$1 = x;
        let y$1 = y;
        let z$1 = z;
        let rows = 0;

        /**
         * Generates 3D shapes based on specified parameters and transformations.
         *
         * @param {Object} data - The data representing the 3D shapes.
         * @returns {Object[]} - An array of 3D shapes generated with the specified parameters and transformations.
         *
         */
        function fn(data) {
            return transform(
                data,
                { scale: scale, origin: origin, project: orthographic, row: rows },
                { x: x$1, y: y$1, z: z$1 },
                { x: angleX, y: angleY, z: angleZ, rotateCenter: rotateCenter }
            );
        }

        /**
         * Sets or retrieves the origin for rendering the 3D shapes.
         *
         * @param {number[]} [o] - The origin point for rendering the 3D shapes.
         * @returns {Function|number[]} - If no argument is provided, returns the current origin. Otherwise, sets the origin and returns the function.
         */
        fn.origin = function (o) {
            return arguments.length ? ((origin = o), fn) : origin;
        };

        /**
         * Sets or retrieves the scale factor for the 3D shapes.
         *
         * @param {number} [s] - The scale factor for the 3D shapes.
         * @returns {Function|number} - If no argument is provided, returns the current scale factor. Otherwise, sets the scale factor and returns the function.
         */
        fn.scale = function (s) {
            return arguments.length ? ((scale = s), fn) : scale;
        };

        /**
         * Sets or retrieves the rotation angle around the x-axis.
         *
         * @param {number} [ax] - The rotation angle around the x-axis.
         * @returns {Function|number} - If no argument is provided, returns the current rotation angle around the x-axis. Otherwise, sets the rotation angle and returns the function.
         */
        fn.rotateX = function (ax) {
            return arguments.length ? ((angleX = ax), fn) : angleX;
        };

        /**
         * Sets or retrieves the rotation angle around the y-axis.
         *
         * @param {number} [ay] - The rotation angle around the y-axis.
         * @returns {Function|number} - If no argument is provided, returns the current rotation angle around the y-axis. Otherwise, sets the rotation angle and returns the function.
         */
        fn.rotateY = function (ay) {
            return arguments.length ? ((angleY = ay), fn) : angleY;
        };

        /**
         * Sets or retrieves the rotation angle around the z-axis.
         *
         * @param {number} [az] - The rotation angle around the z-axis.
         * @returns {Function|number} - If no argument is provided, returns the current rotation angle around the z-axis. Otherwise, sets the rotation angle and returns the function.
         */
        fn.rotateZ = function (az) {
            return arguments.length ? ((angleZ = az), fn) : angleZ;
        };

        /**
         * Sets or retrieves the rotation center for the 3D shapes.
         *
         * @param {number[]} [rc] - The rotation center for the 3D shapes.
         * @returns {Function|number[]} - If no argument is provided, returns the current rotation center. Otherwise, sets the rotation center and returns the function.
         */
        fn.rotationCenter = function (rc) {
            return arguments.length ? ((rotateCenter = rc), fn) : rotateCenter;
        };

        /**
         * Sets or retrieves the x-coordinate for the 3D shapes.
         *
         * @param {number} [px] - The x-coordinate for the 3D shapes.
         * @returns {Function|number} - If no argument is provided, returns the current x-coordinate. Otherwise, sets the x-coordinate and returns the function.
         */
        fn.x = function (px) {
            return arguments.length ? ((x$1 = typeof px === 'function' ? px : +px), fn) : x$1;
        };

        /**
         * Sets or retrieves the y-coordinate for the 3D shapes.
         *
         * @param {number} [py] - The y-coordinate for the 3D shapes.
         * @returns {Function|number} - If no argument is provided, returns the current y-coordinate. Otherwise, sets the y-coordinate and returns the function.
         */
        fn.y = function (py) {
            return arguments.length ? ((y$1 = typeof py === 'function' ? py : +py), fn) : y$1;
        };

        /**
         * Sets or retrieves the z-coordinate for the 3D shapes.
         *
         * @param {number} [pz] - The z-coordinate for the 3D shapes.
         * @returns {Function|number} - If no argument is provided, returns the current z-coordinate. Otherwise, sets the z-coordinate and returns the function.
         */
        fn.z = function (pz) {
            return arguments.length ? ((z$1 = typeof pz === 'function' ? pz : +pz), fn) : z$1;
        };

        /**
         * !IMPORT! ONLY FOR gridplanes
         * Sets or retrieves the rows for 3d gridplanes.
         *
         * @param {number} [pz] - The z-coordinate for the 3D shapes.
         * @returns {Function|number} - If no argument is provided, returns the current rowse. Otherwise, sets the rows and returns the function.
         */
        fn.rows = function (r) {
            return arguments.length ? ((rows = typeof r === 'function' ? r : +r), fn) : rows;
        };

        // Attach the draw function to the generator
        fn.draw = draw;

        // Attach the sort function to the generator
        fn.sort = sort;

        // Return the generator function
        return fn;
    }

    /**
     * Determines if a polygon is oriented in a counter-clockwise direction.
     *
     * @param {Array} polygon - An array of vertices representing the polygon.
     * @returns {boolean} True if the polygon is counter-clockwise, false otherwise.
     */
    function ccw(polygon) {
        /**
         * Calculate the signed area of the polygon.
         * Positive area indicates a counter-clockwise orientation.
         */
        const poly = [...polygon, polygon[0]];

        let sum = 0;

        for (let i = 0; i < polygon.length; i++) {
            const j = i + 1;
            const p1 = poly[i].rotated;
            const p2 = poly[j].rotated;

            // Update the sum with the cross product of consecutive vertices
            sum += (p2.x - p1.x) * (p2.y + p1.y);
        }

        // If the area is positive, the polygon is counter-clockwise
        // This is due to the flipped y-axis in the browser
        return sum > 0;
    }

    /**
     * Calculates the centroid of a polygon.
     *
     * The centroid is the average position of all the points in the polygon.
     *
     * @param {Object[]} polygon - The polygon represented as an array of objects with x, y, and z properties.
     * @param {number} polygon[].rotated.x - The x-coordinate of the rotated point.
     * @param {number} polygon[].rotated.y - The y-coordinate of the rotated point.
     * @param {number} polygon[].rotated.z - The z-coordinate of the rotated point.
     * @returns {Object} - The centroid of the polygon with x, y, and z properties.
     *
     * @throws {Error} Will throw an error if the polygon is empty or if any point in the polygon is missing rotated coordinates.
     *
     * @example
     * // Calculate the centroid of a polygon
     * const polygon = [
     *   { rotated: { x: 1, y: 2, z: 3 } },
     *   { rotated: { x: 4, y: 5, z: 6 } },
     *   { rotated: { x: 7, y: 8, z: 9 } },
     * ];
     * const centroidPoint = centroid(polygon);
     * console.log(centroidPoint); // Outputs: { x: 4, y: 5, z: 6 }
     */
    function centroid(polygon) {
        let _x = 0;
        let _y = 0;
        let _z = 0;
        let _n = polygon.length;

        // Calculate the sum of rotated coordinates
        for (let i = _n - 1; i >= 0; i--) {
            const point = polygon[i].rotated;

            _x += point.x;
            _y += point.y;
            _z += point.z;
        }

        // Calculate the average of rotated coordinates to get the centroid
        return {
            x: _x / _n,
            y: _y / _n,
            z: _z / _n
        };
    }

    /**
     * Rotates a point in 3D space around the X, Y, and Z axes.
     *
     * @param {Object} po - The 3D point to be rotated.
     * @param {Object} angles - The angles of rotation around the X, Y, and Z axes.
     * @param {number} angles.x - The angle of rotation around the X axis in radians.
     * @param {number} angles.y - The angle of rotation around the Y axis in radians.
     * @param {number} angles.z - The angle of rotation around the Z axis in radians.
     * @param {Array<number>} angles.rotateCenter - The center of rotation.
     * @returns {Object} The rotated 3D point.
     */
    function rotateRzRyRx(po, angles) {
        const rc = angles.rotateCenter;

        po.x -= rc.x;
        po.y -= rc.y;
        po.z -= rc.z;

        const rz = rotateZ(po, angles.z);
        const ry = rotateY(rz, angles.y);
        const rx = rotateX(ry, angles.x);

        rx.x += rc.x;
        rx.y += rc.y;
        rx.z += rc.z;

        return rx;
    }

    /**
     * Rotates a 3D point around the X axis.
     *
     * @param {Object} p - The 3D point to be rotated.
     * @param {number} a - The angle of rotation in radians.
     * @returns {Object} The rotated 3D point.
     */
    function rotateX(p, a) {
        const sa = Math.sin(a);
        const ca = Math.cos(a);

        return {
            x: p.x,
            y: p.y * ca - p.z * sa,
            z: p.y * sa + p.z * ca
        };
    }

    /**
     * Rotates a 3D point around the Y axis.
     *
     * @param {Object} p - The 3D point to be rotated.
     * @param {number} a - The angle of rotation in radians.
     * @returns {Object} The rotated 3D point.
     */
    function rotateY(p, a) {
        const sa = Math.sin(a);
        const ca = Math.cos(a);

        return {
            x: p.z * sa + p.x * ca,
            y: p.y,
            z: p.z * ca - p.x * sa
        };
    }

    /**
     * Rotates a 3D point around the Z axis.
     *
     * @param {Object} p - The 3D point to be rotated.
     * @param {number} a - The angle of rotation in radians.
     * @returns {Object} The rotated 3D point.
     */
    function rotateZ(p, a) {
        const sa = Math.sin(a);
        const ca = Math.cos(a);

        return {
            x: p.x * ca - p.y * sa,
            y: p.x * sa + p.y * ca,
            z: p.z
        };
    }

    function point(points, options, point, angles) {
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];

            p.rotated = rotateRzRyRx({ x: point.x(p), y: point.y(p), z: point.z(p) }, angles);
            p.centroid = p.rotated;
            p.projected = options.project(p.rotated, options);
        }
        return points;
    }

    function points3D() {
        return generator3D(point, undefined);
    }

    function drawPlane(d) {
        return `M${d[0].projected.x},${d[0].projected.y}L${d[1].projected.x},${d[1].projected.y}L${d[2].projected.x},${d[2].projected.y}L${d[3].projected.x},${d[3].projected.y}Z`;
    }

    function cube(cubes, options, point$1, angles) {
        for (let i = cubes.length - 1; i >= 0; i--) {
            const cube = cubes[i];

            const vertices = point(
                [cube[0], cube[1], cube[2], cube[3], cube[4], cube[5], cube[6], cube[7]],
                options,
                point$1,
                angles
            );

            const v1 = vertices[0];
            const v2 = vertices[1];
            const v3 = vertices[2];
            const v4 = vertices[3];
            const v5 = vertices[4];
            const v6 = vertices[5];
            const v7 = vertices[6];
            const v8 = vertices[7];

            const front = [v1, v2, v3, v4];
            const back = [v8, v7, v6, v5];
            const left = [v5, v6, v2, v1];
            const right = [v4, v3, v7, v8];
            const top = [v5, v1, v4, v8];
            const bottom = [v2, v6, v7, v3];

            front.centroid = centroid(front);
            back.centroid = centroid(back);
            left.centroid = centroid(left);
            right.centroid = centroid(right);
            top.centroid = centroid(top);
            bottom.centroid = centroid(bottom);

            front.ccw = ccw(front);
            back.ccw = ccw(back);
            left.ccw = ccw(left);
            right.ccw = ccw(right);
            top.ccw = ccw(top);
            bottom.ccw = ccw(bottom);

            front.face = 'front';
            back.face = 'back';
            left.face = 'left';
            right.face = 'right';
            top.face = 'top';
            bottom.face = 'bottom';

            cube.faces = [front, back, left, right, top, bottom];
            
            cube.centroid = {
                x: (left.centroid.x + right.centroid.x) / 2,
                y: (top.centroid.y + bottom.centroid.y) / 2,
                z: (front.centroid.z + back.centroid.z) / 2
            };
        }

        return cubes;
    }

    function cubes3D() {
        return generator3D(cube, drawPlane);
    }

    function gridPlane(grid, options, point$1, angles) {
        const points = point(grid, options, point$1, angles);
        const planes = [];
        const numPts = options.row;
        const numRow = points.length / numPts;
        let cnt = 0;

        for (var i = numRow - 1; i > 0; i--) {
            for (var j = numPts - 1; j > 0; j--) {
                var p1 = j + i * numPts,
                    p4 = p1 - 1,
                    p2 = p4 - numPts + 1,
                    p3 = p2 - 1;
                var pl = [points[p1], points[p2], points[p3], points[p4]];

                pl.plane = `plane-${cnt++}`;
                pl.ccw = ccw(pl);
                pl.centroid = centroid(pl);
                planes.push(pl);
            }
        }

        return planes;
    }

    function gridPlanes3D() {
        return generator3D(gridPlane, drawPlane);
    }

    function drawLineStrip(lineStrip) {
        const lastPoint = lineStrip[lineStrip.length - 1];

        let path = `M${lastPoint.projected.x},${lastPoint.projected.y}`;

        for (var i = lineStrip.length - 2; i >= 0; i--) {
            const p = lineStrip[i].projected;
            path += `L${p.x},${p.y}`;
        }

        return path;
    }

    function lineStrip(lineStrip, options, point, angles) {
        for (let i = lineStrip.length - 1; i >= 0; i--) {
            const l = lineStrip[i];
            const m = l.length / 2;
            const t = parseInt(m);

            for (let j = l.length - 1; j >= 0; j--) {
                const p = l[j];

                p.rotated = rotateRzRyRx({ x: point.x(p), y: point.y(p), z: point.z(p) }, angles);
                p.projected = options.project(p.rotated, options);
            }

            l.centroid =
                t === m
                    ? centroid([l[m - 1], l[m]])
                    : { x: l[t].rotated.x, y: l[t].rotated.y, z: l[t].rotated.z };
        }
        return lineStrip;
    }

    function lineStrips3D() {
        return generator3D(lineStrip, drawLineStrip);
    }

    function line(lines, options, point, angles) {
        for (var i = lines.length - 1; i >= 0; i--) {
            var line = lines[i];

            var p1 = line[0];
            var p2 = line[1];

            p1.rotated = rotateRzRyRx({ x: point.x(p1), y: point.y(p1), z: point.z(p1) }, angles);
            p2.rotated = rotateRzRyRx({ x: point.x(p2), y: point.y(p2), z: point.z(p2) }, angles);

            p1.projected = options.project(p1.rotated, options);
            p2.projected = options.project(p2.rotated, options);

            line.centroid = centroid(line);
        }
        return lines;
    }

    function lines3D() {
        return generator3D(line, undefined);
    }

    function plane(planes, options, point, angles) {
        for (let i = planes.length - 1; i >= 0; i--) {
            const plane = planes[i];

            const p1 = plane[0];
            const p2 = plane[1];
            const p3 = plane[2];
            const p4 = plane[3];

            p1.rotated = rotateRzRyRx({ x: point.x(p1), y: point.y(p1), z: point.z(p1) }, angles);
            p2.rotated = rotateRzRyRx({ x: point.x(p2), y: point.y(p2), z: point.z(p2) }, angles);
            p3.rotated = rotateRzRyRx({ x: point.x(p3), y: point.y(p3), z: point.z(p3) }, angles);
            p4.rotated = rotateRzRyRx({ x: point.x(p4), y: point.y(p4), z: point.z(p4) }, angles);

            p1.projected = options.project(p1.rotated, options);
            p2.projected = options.project(p2.rotated, options);
            p3.projected = options.project(p3.rotated, options);
            p4.projected = options.project(p4.rotated, options);

            plane.ccw = ccw(plane);
            plane.centroid = centroid(plane);
        }

        return planes;
    }

    function planes3D() {
        return generator3D(plane, drawPlane);
    }

    const drawTriangle = (triangle) => {
        return `M${triangle[0].projected.x},${triangle[0].projected.y}L${triangle[1].projected.x},${triangle[1].projected.y}L${triangle[2].projected.x},${triangle[2].projected.y}Z`;
    };

    function triangle(triangles, options, point, angles) {
        for (let i = triangles.length - 1; i >= 0; i--) {
            const tri = triangles[i];
            const p1 = tri[0];
            const p2 = tri[1];
            const p3 = tri[2];

            p1.rotated = rotateRzRyRx({ x: point.x(p1), y: point.y(p1), z: point.z(p1) }, angles);
            p2.rotated = rotateRzRyRx({ x: point.x(p2), y: point.y(p2), z: point.z(p2) }, angles);
            p3.rotated = rotateRzRyRx({ x: point.x(p3), y: point.y(p3), z: point.z(p3) }, angles);

            p1.projected = options.project(p1.rotated, options);
            p2.projected = options.project(p2.rotated, options);
            p3.projected = options.project(p3.rotated, options);

            tri.ccw = ccw(tri);
            tri.centroid = centroid(tri);
        }
        return triangles;
    }

    function triangles3D() {
        return generator3D(triangle, drawTriangle);
    }

    /**
     * @author Stefan Nieke / http://niekes.com/
     */
    function _3d () {
        var origin = { x: 0, y: 0 },
            scale = 1,
            projection = orthographic,
            angleX = 0,
            angleY = 0,
            angleZ = 0,
            rotateCenter = { x: 0, y: 0, z: 0 },
            x$1 = x,
            y$1 = y,
            z$1 = z,
            row = undefined,
            shape = 'POINT',
            processData = {
                CUBE: cube,
                GRID: gridPlane,
                LINE: line,
                LINE_STRIP: lineStrip,
                PLANE: plane,
                POINT: point,
                SURFACE: gridPlane,
                TRIANGLE: triangle
            },
            draw = {
                CUBE: drawPlane,
                GRID: drawPlane,
                LINE_STRIP: drawLineStrip,
                PLANE: drawPlane,
                SURFACE: drawPlane,
                TRIANGLE: drawTriangle
            };

        function _3d(data) {
            return processData[shape](
                data,
                { scale: scale, origin: origin, project: projection, row: row },
                { x: x$1, y: y$1, z: z$1 },
                { x: angleX, y: angleY, z: angleZ, rotateCenter: rotateCenter }
            );
        }

        _3d.origin = function (_) {
            return arguments.length ? ((origin = _), _3d) : origin;
        };

        _3d.scale = function (_) {
            return arguments.length ? ((scale = _), _3d) : scale;
        };

        _3d.rotateX = function (_) {
            return arguments.length ? ((angleX = _), _3d) : angleX;
        };

        _3d.rotateY = function (_) {
            return arguments.length ? ((angleY = _), _3d) : angleY;
        };

        _3d.rotateZ = function (_) {
            return arguments.length ? ((angleZ = _), _3d) : angleZ;
        };

        _3d.shape = function (_, r) {
            return arguments.length ? ((shape = _), (row = r), _3d) : shape;
        };

        _3d.rotateCenter = function (_) {
            return arguments.length ? ((rotateCenter = _), _3d) : rotateCenter;
        };

        _3d.x = function (_) {
            return arguments.length ? ((x$1 = typeof _ === 'function' ? _ : +_), _3d) : x$1;
        };

        _3d.y = function (_) {
            return arguments.length ? ((y$1 = typeof _ === 'function' ? _ : +_), _3d) : y$1;
        };

        _3d.z = function (_) {
            return arguments.length ? ((z$1 = typeof _ === 'function' ? _ : +_), _3d) : z$1;
        };

        _3d.sort = function (a, b) {
            var _a = a.centroid.z,
                _b = b.centroid.z;
            return _a < _b ? -1 : _a > _b ? 1 : _a >= _b ? 0 : NaN;
        };

        _3d.draw = function (d) {
            if (!(shape === 'POINT' || shape === 'LINE')) {
                return draw[shape](d);
            }
        };

        return _3d;
    }

    function drawPolygon(d) {
        // Start the SVG path string from the last point
        const lastPoint = d[d.length - 1];
        let path = `M${lastPoint.projected.x},${lastPoint.projected.y}`;

        // Add line segments to the path for each point
        for (let i = d.length - 2; i >= 0; i--) {
            const p = d[i].projected;

            path += `L${p.x},${p.y}`;
        }

        // Close the path to form a polygon
        path += 'Z';

        return path;
    }

    function polygon(polygons, options, point, angles) {
        for (var i = polygons.length - 1; i >= 0; i--) {
            var polygon = polygons[i];

            for (var j = polygon.length - 1; j >= 0; j--) {
                var p = polygon[j];
                p.rotated = rotateRzRyRx({ x: point.x(p), y: point.y(p), z: point.z(p) }, angles);
                p.projected = options.project(p.rotated, options);
            }

            polygon.ccw = ccw(polygon);
            polygon.centroid = centroid(polygon);
        }
        return polygons;
    }

    function polygons3D() {
        return generator3D(polygon, drawPolygon);
    }

    exports._3d = _3d;
    exports.cubes3D = cubes3D;
    exports.gridPlanes3D = gridPlanes3D;
    exports.lineStrips3D = lineStrips3D;
    exports.lines3D = lines3D;
    exports.planes3D = planes3D;
    exports.points3D = points3D;
    exports.polygons3D = polygons3D;
    exports.triangles3D = triangles3D;

}));
