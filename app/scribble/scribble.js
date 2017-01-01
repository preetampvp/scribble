'use strict'

let scribble = (function (window) {
  let { ipcRenderer } = require("electron")
  let canvas, container, context, canvasWidth, canvasHeight,
  curX = 0, curY = 0, prevX = 0, prevY = 0,
  flag = false, dot_flag = false,
  color = "black", thickness = 2,
  thicknessElem, thicknessRangeElem, scribbleElem,
  toolboxElem,
  document = window.document;

  function init() {
    initCanvas();
    initIpc()
    ipcRenderer.send("get-toolbox-config")
  }

  function initIpc() {
    ipcRenderer.on("clear", () => {
      if(context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        ipcRenderer.send("clear-done")
      }
    }) 

    ipcRenderer.on("toolbox-config", (e, config) => { 
      console.log(config)
      color = config.color; thickness = config.thickness 
      initToolbox()
    })
  }

  function initCanvas() {
    canvas = document.getElementById("canvas")
    canvas.width = document.body.clientWidth
    canvas.height = document.body.clientHeight 
    context = canvas.getContext("2d");

    canvas.addEventListener('mousemove', (e) => findxy(e), false);
    canvas.addEventListener('mouseup', (e) => findxy(e), false);
    canvas.addEventListener('mousedown', (e) => findxy(e), false);
    canvas.addEventListener('mouseout', (e) => findxy(e), false);
  }

  function initToolbox() {
    scribbleElem = document.getElementById("scribble")
    thicknessElem = document.getElementById("thickness-value")
    thicknessRangeElem = document.getElementById("thickness-range")
    toolboxElem = document.getElementById("toolbox")
    let colorElems = document.getElementsByClassName("color")

    /* scribble */
    scribbleElem.addEventListener('click', () => {
      let currentState = toolboxElem.getAttribute("class") 
      if(currentState && currentState === "hidden") {
        toolboxElem.setAttribute("class", "")
      } else {
        toolboxElem.setAttribute("class", "hidden")
      }
    })

    /* thickness */
    thicknessElem.innerHTML = thickness
    thicknessRangeElem.value = thickness

    thicknessRangeElem.addEventListener('change', (e) => {
      thickness = e.target.value
      thicknessElem.innerHTML = thickness
      ipcRenderer.send("toolbox-changed", {color, thickness})
      //toolboxElem.setAttribute("class", "hidden")
    })

    /* color */
    for(let elem of colorElems) {
      let dataColor = elem.getAttribute("data-color")
      elem.style.backgroundColor = dataColor
      elem.addEventListener('click', () => { colorPicked(elem) })
      if(dataColor === color) {
        elem.setAttribute("class", "color selected")
      } else {
        elem.setAttribute("class", "color")
      }
    }
    toolboxElem.setAttribute("class", "hidden")
  }

  function colorPicked(elem) {
    color = elem.getAttribute("data-color")
    let colorElems = document.getElementsByClassName("color")
    for(let elem of colorElems) {
      elem.setAttribute("class", "color")
    }
    elem.setAttribute("class", "color selected")
    ipcRenderer.send("toolbox-changed", {color, thickness})
    toolboxElem.setAttribute("class", "hidden")
  }

  function findxy(e) {
    let type = e.type;
    if(type === 'mousedown') {
      prevX = curX; prevY = curY;
      curX = e.clientX - canvas.offsetLeft;
      curY = e.clientY - canvas.offsetTop;

      flag = true; dot_flag = true;
      if(dot_flag) {
        context.beginPath();
        context.fillStyle = color;
        context.fillRect(curX, curY, thickness, thickness);
        context.closePath();
        dot_flag = false;
      }
    } else if(type === 'mouseup' || type === 'mouseout') {
      flag = false;
    } else if(type === 'mousemove') {
      if(flag) {
        prevX = curX; prevY = curY;
        curX = e.clientX - canvas.offsetLeft;
        curY = e.clientY - canvas.offsetTop;
        draw();
      }
    }
  }

  function draw() {
    context.beginPath();
    context.moveTo(prevX, prevY);
    context.lineTo(curX, curY);
    context.strokeStyle = color;
    context.lineWidth = thickness;
    context.stroke();
    context.closePath();
  }

 return {
  init: init
 }
})(window) 

window.addEventListener('DOMContentLoaded', scribble.init);
