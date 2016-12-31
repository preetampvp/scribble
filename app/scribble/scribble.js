'use strict'

let scribble = (function (window) {
  let canvas = null,
  context = null,
  document = window.document


  function init() {
    console.log("init")
    canvas = document.getElementById("canvas")
    context = canvas.getContext("2d")
    console.log(canvas, context)
  }

 return {
  init: init
 }
})(window) 

window.addEventListener('DOMContentLoaded', scribble.init)
