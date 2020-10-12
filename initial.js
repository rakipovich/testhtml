"use strict"
window.onload = function () {



    /******************** ENABLER  ********************/
    if (Enabler.isInitialized()) {
        init();
    } else {
        Enabler.addEventListener(studio.events.StudioEvent.INIT, init);
    }

    function init() {
        if (Enabler.isPageLoaded()) {
            //Enabler.setProfileId(10533591);
            politeInit();
        } else {
            //Enabler.setProfileId(10533591);
            Enabler.addEventListener(studio.events.StudioEvent.PAGE_LOADED, politeInit);
        }
    };
    /***************** //end ofENABLER  *****************/



    /******************** VARIABLES  ********************/

    function politeInit() {
        //	    console.log = function() {}

        var select = function (s) {
            return document.querySelector(s);
        },
            selectAll = function (s) {
                return document.querySelectorAll(s);
            },
            wrect = select('#wrect'),
            canvas = select('#rectsWrapper'),
            canvasWrapper = select('#canvasWrapper'),
            textWrap = select('#textWrap'),
            arrows = selectAll('.arr'),
            ctx = canvas.getContext('2d'),
            dw = 100,
            dh = 200,
            w = canvas.width / 2 - dw / 2,
            h = canvas.height / 2 - dh / 2,
            rects,
            rectArray = [],
            autoAnimObject = {},
            delayedCallAuto, frameInterval,
            images = ["image1.jpg", "image2.jpg", "image3.jpg"],
            texts = [
                "Matthew was <span class='blue'>abducted</span> from his home by an armed group and held <span class='blue'>for two years.</span>",
                "He was released with <span class='blue'>UNICEF’s help</span> and received <span class='blue'>reintegration training</span> in agriculture.",
                "He was also provided with <span class='blue'>psychological support</span> as he transitioned into <span class='blue'>normal life</span> again."
            ],
            interactiveRects = [],
            frameRects = [],
            frames = [],
            frameObjects = [],
            words = [],
            currentIndex = 0,
            frameOpenStart = false,
            frameOpenComplete = false,
            imageArray = [],
            timelines = [],
            imageParts = [{ x1: 0.3, x2: 1, y1: 0.5, y2: 1 }, { x1: 0.3, x2: 1, y1: 0.5, y2: 1 }, { x1: 0, x2: 1, y1: 0.25, y2: 1 }],
            closeButton = {},
            tl = gsap.timeline();
        /***************** //end of VARIABLES  *****************/

        //console.log(canvas.width);

        closeButton.rad = 12;
        closeButton.x = w - closeButton.rad - 15;
        closeButton.y = closeButton.rad + 15;
        closeButton.scale = closeButton.scale1 = 1;
        closeButton.scale2 = 1.1;
        closeButton.color = closeButton.color1 = "#fff";
        closeButton.color2 = "#00AEEF";
        closeButton.focused = false;
        closeButton.alpha = 0;
        closeButton.alpha2 = 1;

        var lineL = closeButton.rad / 2;


        /****************  PRELOADING IMAGES  **************/
        function preloadImages(srcs, callback) {
            var img;
            var remaining = srcs.length;
            for (var i = 0; i < srcs.length; i++) {
                img = new Image();
                img.onload = function () {
                    --remaining;
                    if (remaining <= 0) {
                        callback();
                    }
                };
                img.className = 'img';
                img.src = srcs[i];
                imageArray.push(img);
            }
        }
        preloadImages(images, imagesPreloaded);
        /************  end of PRELOADING IMAGES  ***********/


        /******************** PARSING JSON  ********************/
        function defineRect(ob) {

            ob.parts.push(1);
            ob.parts.unshift(0);
            ob.parts.forEach(elem => parseFloat(elem));

            for (var i = 1; i < ob.parts.length; i++) {
                var part = ob.parts[i] - ob.parts[i - 1],
                    isHoriz = (ob.separation == "horizontal"),
                    child = ob.children[i - 1], frameRect = {};
                child.width = frameRect.width = isHoriz ? ob.width : ob.width * part;
                child.height = frameRect.height = isHoriz ? ob.height * part : ob.height;
                child.globalX = frameRect.globalX = isHoriz ? ob.globalX : ob.globalX + ob.parts[i - 1] * ob.width;
                child.globalY = frameRect.globalY = isHoriz ? ob.globalY + ob.parts[i - 1] * ob.height : ob.globalY;

                child.scale = 1;
                child.alpha = 1;
                child.dKoef = 20;
                child.overScale = 0.7 + Math.random() * 0.2;

                frameRect.scale = 2;
                frameRect.alpha = 0;
                frameRect.type = child.type;

                child.parent = ob;

                if (child.type == "interactive") {
                    child.globalDX = 0;
                    child.globalDY = 0;
                    child.dKoef = 10;
                    child.focused = false;
                    child.filterAlpha = 1;
                    child.dscale = 1.1;
                    child.dalpha = 1;
                    child.image = imageArray[child.imageIndex];
                    child.dataImage = Filters.filterImage(Filters.brightnessContrast, child.image, 0.1, 1.2);

                    //duplicate
                    interactiveRects.push(Object.assign({}, child));

                } else if (child.type == "image" || child.type == "imagetext") {
                    child.imageIndex = Math.round(Math.random() * (imageArray.length - 1));
                    child.randomPart = Math.random();
                    child.randomPiece = 0.2 + 0.2 * Math.random();
                    child.image = imageArray[child.imageIndex];
                    child.dataImage = Filters.filterImage(Filters.grayscale, child.image);

                    if (child.type == "imagetext") {
                        child.colorWords = /<span [^>]+>(.*?)<\/span>/g.exec(child.text)[1].split(" ");
                        child.textColor = "#00AEEF";
                    }
                }

                if ("children" in child) {
                    defineRect(child);
                } else {
                    rectArray.push(child);
                    frameRects.push(frameRect);
                }
            }
        }

        function imagesPreloaded() {
            loadJSON(function (response) {
                rects = JSON.parse(response);

                rects.width = w;
                rects.height = 470;
                rects.globalX = 0;
                rects.globalY = 50;

                defineRect(rects);

                for (var i = 0; i < interactiveRects.length; i++) {
                    interactiveRects[i].alpha = 0;

                    var array = [],
                        frOb = {};

                    for (var j = 0; j < frameRects.length; j++) {
                        var ob = Object.assign({}, frameRects[j]);
                        array.push(ob);
                    }

                    frOb.imageAlpha = 0;
                    frameObjects.push(frOb);

                    frames.push(array);

                    //define texts
                    var span = document.createElement('span');
                    span.className = "textSpan";
                    span.innerHTML = texts[i];

                    textWrap.appendChild(span);
                }

                var spans = selectAll(".textSpan");

                for (var s = 0; s < spans.length; s++) {
                    var spanWords = new SplitText(spans[s], { type: "words" });
                    gsap.set(spanWords.words, { alpha: 0, scale: 3 });
                    words.push(spanWords);
                }

                for (var i = 0; i < interactiveRects.length; i++) {
                    var timeline = gsap.timeline();
                    timeline
                        .to(frames[i], { duration: 0.7, scale: 1, ease: "back", stagger: 0.05 })
                        .to(frames[i], { duration: 0.1, alpha: 1, ease: "none", stagger: 0.05 }, "<")
                        .to(frameObjects[i], { duration: 0.7, imageAlpha: 1, ease: "power4.in" }, "<")
                        .to(words[i].words, {
                            stagger: 0.07, duration: 0.7, alpha: 1, scale: 1, ease: "back", onComplete: function () {
                                if (currentIndex > 0) {
                                    setArrowListeners(arrows[0]);
                                }

                                if (currentIndex < interactiveRects.length - 1) {
                                    setArrowListeners(arrows[1]);
                                }
                            }
                        }, ">0.2")


                    timeline.pause();

                    timelines.push(timeline);
                }

                animate();
                gsap.ticker.add(drawRects);

            });
        }
        /*************** end of PARSING JSON  ****************/


        /******************** DRAW CANVAS  ********************/
        function drawButtonShape() {
            ctx.translate(closeButton.x, closeButton.y);
            ctx.scale(closeButton.scale, closeButton.scale);
            ctx.beginPath();
            ctx.arc(0, 0, closeButton.rad, 0, Math.PI * 2);
            ctx.moveTo(-lineL, -lineL);
            ctx.lineTo(lineL, lineL);
            ctx.moveTo(lineL, -lineL);
            ctx.lineTo(-lineL, lineL);
            ctx.closePath();
        }

        function drawColorImage(rect) {
            var cnv = document.createElement("canvas"),
                contex = cnv.getContext("2d");

            cnv.width = rect.image.width;
            cnv.height = rect.image.height;

            contex.clearRect(0, 0, cnv.width, cnv.height);

            contex.putImageData(rect.dataImage, 0, 0);

            if (rect.type == "interactive") {
                contex.globalCompositeOperation = 'color';

                contex.fillStyle = "rgba(0, 180, 240, " + rect.filterAlpha + ")";
                contex.fillRect(0, 0, cnv.width, cnv.height);
            }

            return cnv;
        }


        function drawInteractiveRect(rect, k) {
            var image = rect.image,
                aspectR = image.width / rect.width,
                aspectI = rect.width / rect.height,
                dx = image.width * rect.imagePosition.x,
                dy = (image.height - image.width / aspectI) * rect.imagePosition.y;

            ctx.save();
            ctx.globalAlpha = rect.alpha;
            ctx.translate(rect.globalX, rect.globalY);
            ctx.drawImage(drawColorImage(rect),
                dx, dy,
                image.width,
                rect.height * aspectR,
                rect.width / 2 * (1 - rect.scale),
                rect.height / 2 * (1 - rect.scale),
                rect.width * rect.scale,
                rect.height * rect.scale);

            ctx.translate(rect.width / 2, rect.height / 2);
            ctx.scale(rect.scale, rect.scale);
            ctx.strokeRect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
            ctx.restore();
        }

        function drawImageRect(rect, k) {
            var image = rect.image,
                imp = imageParts[rect.imageIndex],
                imagePartWidth = image.width * (imp.x2 - imp.x1),
                imagePartPiece = imagePartWidth * rect.randomPiece,
                imagePartDX = rect.randomPart * imagePartWidth * (1 - rect.randomPiece),
                imagePartHeight = image.height * (imp.y2 - imp.y1),
                aspectR = imagePartPiece / rect.width;

            ctx.save();
            ctx.globalAlpha = rect.alpha;
            ctx.translate(rect.globalX, rect.globalY);
            ctx.drawImage(drawColorImage(rect),
                imp.x1 * image.width + imagePartDX,
                imp.y1 * image.height,
                imagePartPiece,
                rect.height * aspectR,
                rect.width / 2 * (1 - rect.scale),
                rect.height / 2 * (1 - rect.scale),
                rect.width * rect.scale,
                rect.height * rect.scale);
            ctx.restore();
        }

        function drawText(rect) {
            ctx.save();
            ctx.translate(rect.globalX + rect.width / 2, rect.globalY + rect.height / 2);
            ctx.scale(rect.scale, rect.scale);
            ctx.globalAlpha = rect.alpha;

            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
            ctx.font = rect.fontSize + "px DINNextSlabPro-Heavy";
            ctx.fillStyle = "white";
            ctx.textAlign = rect.textAlign;

            if (rect.textAlign == "right") {
                ctx.translate(rect.width / 2 - 20, 0);
            } else {
                ctx.translate(-rect.width / 2, 0);
            }
            wrapText(ctx, rect.text.replace(/<\/?span[^>]*>/g, ""), 10, 5, Math.floor(rect.width - 20), rect);
            ctx.restore();
        }


        function drawRects() {
            ctx.clearRect(0, 0, w * 2 + dw, h * 2 + dh);
            ctx.fillStyle = "#000";
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;

            ctx.save();
                ctx.translate(dw / 2, dh / 2);
                ctx.scale(2, 2);

                for (var i = 0; i < rectArray.length; i++) {

                    var rect = rectArray[i];

                    ctx.save();

                    if (rect.type != "empty") {

                        if (rect.type == "interactive") {
                            drawInteractiveRect(rect, i);
                        } else if (rect.type == "image") {
                            drawImageRect(rect, i);
                        } else {
                            ctx.save();
                            drawImageRect(rect, i);
                            drawText(rect);
                            ctx.restore();
                        }
                        ctx.save();
                        ctx.globalAlpha = rect.alpha;
                        ctx.translate(rect.globalX + rect.width / 2, rect.globalY + rect.height / 2);
                        ctx.scale(rect.scale, rect.scale);
                        ctx.strokeRect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
                        ctx.restore();
                    }

                    ctx.restore();
                }

                for (var i = 0; i < interactiveRects.length; i++) {
                    var r = interactiveRects[i];
                    ctx.save();
                        ctx.shadowColor = 'black';
                        ctx.shadowBlur = 30;
                        drawInteractiveRect(r, i);
                    ctx.restore();

                    ctx.save();
                        ctx.translate(w / 2, h / 2);
                        ctx.globalAlpha = frameObjects[i].imageAlpha;
                        ctx.drawImage(r.image, -r.image.width / 2, -r.image.height / 2);
                    ctx.restore();

                    drawFrame(currentIndex);
                }

                ctx.save();
                    ctx.globalAlpha = closeButton.alpha;
                    ctx.strokeStyle = closeButton.color;
                    ctx.lineWidth = 2;
                    drawButtonShape();
                    ctx.stroke();
                ctx.restore();  
                
            ctx.restore();
        }

        function drawFrame(k) {
            var r = interactiveRects[k],
                image = r.image,
                array = frames[k];

            ctx.save();
            ctx.translate(w / 2, h / 2);

            for (var i = 0; i < array.length; i++) {
                var r = array[i];
                var dx = (image.width - w) / 2,
                    dy = (image.height - h) / 2;


                ctx.save();
                ctx.translate(dx + (-r.globalX + w / 2) * (1 - r.scale), dy + (-r.globalY + h / 2) * (1 - r.scale));
                ctx.globalAlpha = r.alpha;

                if (r.type != "empty") {
                    ctx.drawImage(image,
                        r.globalX + dx,
                        r.globalY + dy,
                        r.width,
                        r.height,
                        r.globalX - image.width / 2 + r.width / 2 * (1 - r.scale),
                        r.globalY - image.height / 2 + r.height / 2 * (1 - r.scale),
                        r.width * r.scale,
                        r.height * r.scale);
                }

                ctx.restore();
            }

            ctx.restore();

            frameOpenComplete = timelines[currentIndex].totalProgress() > 0.99 ? true : false;
            frameOpenStart = timelines[currentIndex].totalProgress() > 0.01 ? true : false;

            if (frameOpenComplete) {
                gsap.to(closeButton, { duration: 0.5, alpha: 1 });
            } else {
                gsap.to(closeButton, { duration: 0.5, alpha: 0 });
            }
        }
        /******************** end of DRAW CANVAS  ********************/


        /******************** INTERACTIVITY  ********************/
        function onClose(elem, on) {
            gsap.killTweensOf(elem);
            if (on) {
                gsap.to(elem, { duration: 0.4, scale: closeButton.scale2, color: closeButton.color2, ease: "back" });
            } else {
                gsap.to(elem, { duration: 0.4, scale: closeButton.scale1, color: closeButton.color1, ease: "back" });
            }
        }

        function onRect(k, on) {
            var r = interactiveRects[k],
                dur, durAlpha, dx, dy;

            gsap.killTweensOf(r);

            if (on) {
                gsap.to(r, { duration: 0.4, scale: 1.2, filterAlpha: 0, ease: "sine" });
                gsap.to(r, { duration: 0.05, alpha: 1, ease: "none" });
            } else {
                gsap.to(r, { duration: 0.15, scale: 1, filterAlpha: 1, ease: "sine" });
                gsap.to(r, { duration: 0.15, alpha: 0, ease: "none" });

            }
        }

        function canvasMove(e) {
            var mousePos;
            if (e.target != undefined) {
                mousePos = getMousePos(e);
                gsap.killTweensOf(autoAnimObject);
                if(delayedCallAuto) delayedCallAuto.kill();
                clearInterval(frameInterval);
            } else {
                mousePos = e;
            }

            var mouseX = mousePos.x - dw / 4,
                mouseY = mousePos.y - dh / 4;

            var rotY = -10 + mouseX / w * 20,
                rotX = 15 - mouseY / h * 30,
                angY = rotY * Math.PI / 180,
                angX = rotX * Math.PI / 180;

            if (!frameOpenStart) {
                gsap.to(canvas, { duration: 0.2, rotationY: rotY, rotationX: rotX });
            } else {
                canvasOut();
            }

            var dx = Math.sin(angY) * Math.sin(angY) * (mouseX - w / 2),
                dy = Math.sin(angX) * Math.sin(angX) * (mouseY - h / 2);

            var focused = 0;

            for (var i = 0; i < interactiveRects.length; i++) {
                var r = interactiveRects[i];

                ctx.save();
                ctx.beginPath();
                ctx.rect(r.globalX,
                    r.globalY,
                    r.width,
                    r.height);
                ctx.closePath();

                if (ctx.isPointInPath(mouseX + dx, mouseY + dy) && !frameOpenStart) {
                    currentIndex = i;
                    onRect(i, true);
                    r.focused = true;
                } else {
                    r.focused = false;
                    onRect(i, false);
                }
                ctx.restore();

                if (r.focused) focused++;
            }

            if (!focused) {
                for (var i = 0; i < rectArray.length; i++) {
                    rectArray[i].overScale = 0.7 + Math.random() * 0.2;
                }
            }


            for (var i = 0; i < rectArray.length; i++) {
                if (rectArray[i].type != "interactive") {
                    if (focused) {
                        gsap.to(rectArray[i], { duration: 1, scale: rectArray[i].overScale, ease: "none" });
                    }
                }
            }


            ctx.save();
            drawButtonShape();
            if (ctx.isPointInPath(mouseX, mouseY) && frameOpenComplete) {
                onClose(closeButton, true);
                closeButton.focused = true;
            } else {
                onClose(closeButton, false);
                closeButton.focused = false;
            }
            ctx.restore();

        }

        function canvasOut() {
            for (var i = 0; i < interactiveRects.length; i++) {
                onRect(i, false);
            }

            gsap.killTweensOf(rectArray);
            gsap.to(rectArray, { duration: 0.7, scale: 1 });

            gsap.to(canvas, { duration: 0.7, rotationY: 0, rotationX: 0 });
        }

        function canvasClick() {
            var focused = 0;
            for (var i = 0; i < interactiveRects.length; i++) {
                if (interactiveRects[i].focused) focused++;
            }

            if (focused && !frameOpenStart) {
                timelines[currentIndex].timeScale(1).tweenTo(timelines[currentIndex].totalDuration());

                canvasOut();
            }

            if (closeButton.focused && frameOpenComplete) {
                timelines[currentIndex].timeScale(1).tweenTo(0);

                removeArrowListeners(arrows[0]);
                removeArrowListeners(arrows[1]);
            }

            if (!closeButton.focused && !focused) {
                Enabler.exit('bgExit');
            }
        }



        function setRectListeners() {
            canvasWrapper.addEventListener("mousemove", canvasMove, false);
            canvas.addEventListener("mouseout", canvasOut, false);
            canvas.addEventListener("click", canvasClick, false);
        }


        function arrowOver(e) {
            gsap.to(e.target, { duration: 0.3, scale: 1.1 });
        }

        function arrowOut(e) {
            gsap.to(e.target, { duration: 0.3, scale: 1 });
        }

        function arrowClick(e) {
            var index = currentIndex;

            if (e.target == arrows[1]) {
                currentIndex++;
            } else {
                currentIndex--;
            }

            timelines[currentIndex].timeScale(1).tweenTo(timelines[currentIndex].totalDuration());
            timelines[index].timeScale(2).tweenTo(0);

            removeArrowListeners(arrows[0]);
            removeArrowListeners(arrows[1]);
        }

        function setArrowListeners(arrow) {
            arrow.style.display = "block";
            gsap.to(arrow, { duration: 0.3, alpha: 1 });
            arrow.addEventListener("mouseover", arrowOver, false);
            arrow.addEventListener("mouseout", arrowOut, false);
            arrow.addEventListener("click", arrowClick, false);
        }

        function removeArrowListeners(arrow) {
            
            gsap.to(arrow, { duration: 0.3, alpha: 0, onComplete:function(){arrow.style.display = "none";}});
            arrow.removeEventListener("mouseover", arrowOver, false);
            arrow.removeEventListener("mouseout", arrowOut, false);
            arrow.removeEventListener("click", arrowClick, false);
        }

        TweenLite.set(canvasWrapper, { perspective: 500 });
        TweenLite.set(canvas, { transformStyle: "preserve-3d" });
        /******************** end of INTERACTIVITY  ********************/



        /******************  MAIN ANIMATION  ******************/

        function autoFrame() {
            var arrowOb = { target: arrows[1] };
            canvasClick();
            frameInterval = setInterval(function () {
                if (currentIndex < interactiveRects.length - 1) {
                    arrowClick(arrowOb);
                }
            }, 5000);
        }

        function autoAnim() {
            autoAnimObject.x = -w / 2;
            autoAnimObject.y = h;

            for (var i = interactiveRects.length - 1; i > -1; i--) {
                var r = interactiveRects[i];

                gsap.to(autoAnimObject, {
                    duration: 1.5, x: r.globalX + r.width / 2, y: r.globalY + r.height / 2, ease: "sine.inOut", delay: 4 * (interactiveRects.length - i)-2, onUpdate: function () {
                        canvasMove(autoAnimObject);
                    }
                });
            }

            delayedCallAuto = gsap.delayedCall(interactiveRects.length * 4 + 2, autoFrame);
        }


        function animate() {

            gsap.set(arrows, { alpha: 0 });

            tl
                .to(wrect, { duration: 0.7, alpha: 0, ease: "none" })

                .from(rectArray, { duration: 0.7, scale: 2, ease: "back", stagger: 0.05 })
                .from(rectArray, { duration: 0.1, alpha: 0, ease: "none", stagger: 0.05, onComplete: setRectListeners }, "<")

                .call(autoAnim, null, null, ">")

        }
        /******************  //end of MAIN ANIMATION  ******************/



        /********************  EVENTS  ********************/

        let type = ((Modernizr.touchevents) && (!isChrome)) ? 'touchend' : 'click',
            clickable = selectAll('.clickable');

        clickable.forEach(element => element.addEventListener(type, function (e) {
            Enabler.exit('Exit');
            return false;
        }, false));

        /****************** end of EVENTS  ******************/



        /********************  HELPERS  ********************/
        function getMousePos(e) {
            var rect = canvas.getBoundingClientRect();

            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }

        Array.prototype.contains = function (obj) {
            var i = this.length;
            while (i--) {
                if (this[i] === obj) {
                    return true;
                }
            }
            return false;
        }

        function wrapText(context, text, x, y, maxWidth, rect) {
            var paragraphs = text.split("\n");
            var textLines = [];
            var lineHeight = parseFloat(rect.lineHeight);

            for (var p = 0; p < paragraphs.length; p++) {
                var line = "";

                var words = paragraphs[p].split(" ");
                for (var w = 0; w < words.length; w++) {
                    var testLine = line + words[w] + " ";
                    var metrics = context.measureText(testLine);
                    var testWidth = metrics.width;

                    if (testWidth > maxWidth) {
                        textLines.push(line.trim());
                        line = words[w] + " ";
                    } else {
                        line = testLine;
                    }
                }
                textLines.push(line.trim());
            }

            context.translate(0, -(textLines.length - 1) * lineHeight / 2);

            for (var tl = 0; tl < textLines.length; tl++) {
                var lineWords = textLines[tl].split(" ");
                var dx = 0;
                for (var l = 0; l < lineWords.length; l++) {
                    if (rect.textAlign == "right") {
                        var word = lineWords[lineWords.length - l - 1];
                    } else {
                        var word = lineWords[l];
                    }

                    if (rect.colorWords.contains(word)) {
                        context.fillStyle = rect.textColor;
                    }
                    context.fillText(word, x + dx, y);

                    if (rect.textAlign == "right") {
                        dx -= context.measureText(word + " ").width;
                    } else {
                        dx += context.measureText(word + " ").width;
                    }
                }

                y += lineHeight;
            }
        }

        function loadJSON(callback) {

            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
            xobj.open('GET', 'rects.json', true);
            xobj.onreadystatechange = function () {
                if (xobj.readyState == 4 && xobj.status == "200") {
                    callback(xobj.responseText);
                }
            };
            xobj.send(null);
        }
    };



}