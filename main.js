"use strict"

var main = (function() {
  const electron = require("electron");
  const { app, globalShortcut, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
  const notifier = require("node-notifier");
  const fs = require("fs")
  const AutoLaunch = require("auto-launch")

  let tray,
  autoLaunch,
  screen,
  scribbleWindow;

  function init() {
    app.on("ready", () => {
      if(!process.env.debug) bootstrapAutoLaunch()
      if(!process.env.debug) app.dock.hide()
      initGlobalShortcuts();
      initIpc()
      setupTray();
      app.on("window-all-closed", (e) => e.preventDefault()) ;
      screen = electron.screen;
    })
  }

  function initGlobalShortcuts() {
    globalShortcut.register("Command+Control+S", toggleScribbleWindow);
    globalShortcut.register("Command+Control+C", clear);
    //globalShortcut.register("Command+Control+R", resetScribble);
  }

  function initIpc() {
    ipcMain.on('clear-done', () => { toggleScribbleWindowHide(), toggleScribbleWindowHide() });
    ipcMain.on('toolbox-changed', (e, config) => { saveToolboxChanges(config) })
    ipcMain.on('get-toolbox-config', (e) => {
      let config = JSON.parse(fs.readFileSync(`${__dirname}/scribble.config`, 'utf8'));
      e.sender.send('toolbox-config', config);
    })
  }

  function saveToolboxChanges(config) {
    fs.writeFile(`${__dirname}/scribble.config`, JSON.stringify(config), (err) => {
      if(err) {
        notify(err.message)
      } else {
        if(process.env.debug) notify("saved")
      }
    })
  }

  function setupTray() {
    getAutoLaunchEnabledState()
    .then((isAutoLaunchEnabled) => {
      tray = new Tray(`${__dirname}/tray.png`);
      tray.setHighlightMode("never");
      tray.setToolTip("Scribble")
       let menuItems = [
        { label: "Scribble (Cmd+Ctrl+S)", click() { toggleScribbleWindow() } },
        { label: "Clear (Cmd+Ctrl+C)", click() { clear() } },
        { type: "separator" },
        { label: "Reset", click() { resetScribble() } },
        { type: "separator" },
        { label: 'Start at login', type: 'checkbox', checked: isAutoLaunchEnabled, click() { toggleAutoLaunchState() } },
        { type: "separator" },
        { label: "Quit", click() { quit() } }
       ]
       tray.setContextMenu(Menu.buildFromTemplate(menuItems));
    })
  }

  function resetScribble() {
    if(scribbleWindow) {
      scribbleWindow.close()
    }
  }

   /* Auto launch stuff */
  function bootstrapAutoLaunch() {
    let appPath = `${__dirname.substring(0, __dirname.indexOf('Scribble.app'))}/Scribble.app`
    autoLaunch = new AutoLaunch({
      name: 'Scribble',
      path: appPath
    })
  }

  function getAutoLaunchEnabledState() {
    return new Promise((resolve, reject) => {
      if(!autoLaunch) {
        return resolve(false);
      }

      autoLaunch.isEnabled()
      .then(resolve)
      .catch(() => {
        resolve(false);
      })
    })
  }

  function toggleAutoLaunchState() {
    if(!autoLaunch) return;

    autoLaunch.isEnabled()
    .then((isEnabled) => {
      isEnabled === true ? autoLaunch.disable() : autoLaunch.enable();
    })
    .catch(() => {
      notify("Unable to toggle state");
    })
  }
  /* End of Auto launch stuff */ 

  function clear() {
    if(scribbleWindow) scribbleWindow.webContents.send("clear")
  }

  function quit() {
    app.quit()
  }

  function toggleScribbleWindowHide() {
    if(!scribbleWindow) return;
    if(scribbleWindow.isVisible()) {
      scribbleWindow.hide()
    } else {
      scribbleWindow.show() 
    }
  }

  function toggleScribbleWindow() {
    if(scribbleWindow) {
     //scribbleWindow.close();
     toggleScribbleWindowHide();
    } else {
      let pointerPosition = screen.getCursorScreenPoint();
      let display = screen.getDisplayNearestPoint(pointerPosition);
      let {width, height} = display.workAreaSize;
      //notify(width + " " + height);
      let options = {
        frame: false,
        transparent: true,
        width,
        height
      }
      scribbleWindow = new BrowserWindow(options);
      scribbleWindow.on('close', () => scribbleWindow = null);
      scribbleWindow.loadURL(`file://${__dirname}/app/scribble/main.html`);

      if(process.env.debug) scribbleWindow.webContents.openDevTools();
      scribbleWindow.show();
    } 
  }


  function notify(message) {
    notifier.notify({title: "Scribble", message});
  }

  app.on('will-quit', () => globalShortcut.unregisterAll());

  return {
    init: init
  }

})()

main.init();
