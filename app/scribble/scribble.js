'use strict'

let scribble = (function (window) {
  let { ipcRenderer } = require("electron")
  let canvas,
  container,
  context,
  canvasWidth,
  canvasHeight,
  curX = 0, curY = 0, prevX = 0, prevY = 0,
  flag = false, dot_flag = false,
  foreColor = "red", thickness = 2,
  document = window.document;

  function init() {
    initCanvas();
    initIpc()
  }

  function initIpc() {
    ipcRenderer.on("clear", () => {
      if(context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        ipcRenderer.send("clear-done")
      }
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

  function findxy(e) {
    let type = e.type;
    if(type === 'mousedown') {
      prevX = curX; prevY = curY;
      curX = e.clientX - canvas.offsetLeft;
      curY = e.clientY - canvas.offsetTop;

      flag = true; dot_flag = true;
      if(dot_flag) {
        context.beginPath();
        context.fillStyle = foreColor;
        context.fillRect(curX, curY, 2, 2);
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
    context.strokeStyle = foreColor;
    context.lineWidth = thickness;
    context.stroke();
    context.closePath();
  }

 return {
  init: init
 }
})(window) 

window.addEventListener('DOMContentLoaded', scribble.init);
