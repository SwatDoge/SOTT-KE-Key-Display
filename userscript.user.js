// ==UserScript==
// @name         SOTT KE Key display
// @version      0.1
// @homepage     https://docs.swatdo.ge
// @icon         https://swatdo.ge/images/dq_logo.png
// @updateURL    https://github.com/SwatDoge/SOTT-KE-Key-display/raw/master/userscript.user.js
// @downloadURL  https://github.com/SwatDoge/SOTT-KE-Key-display/raw/master/userscript.user.js
// @supportURL   https://discord.gg/bz8abvq
// @description  Displays the keys your pressing in the krunkscript editor!
// @author       Swat
// @match        *://krunker.io/editor.html
// @grant        unsafeWindow
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

let config = {
    //https://keycode.info/
    priority_keys: [17, 16, 18, 32], //Determens priority of certain keys. 17 (ctrl) will ALWAYS be the first key to show up when the button is pressed, followed by 16, 18 and 32. (Ctrl + shift + alt + space).
    ignore_keys: [], //ignore certain keys from showing up.
    rename_keys: [ //change the display name of keys.
        {key_code: 32, text: "Space"},
        {key_code: 91, text: "Win"}
    ],
    linger_time: 750, //how long an unpressed button takes to start fading out.
    fade_time: 300, //how long the fadeout of an unpressed button takes.
    font_size: 25, //set the size of the characters.
    show_plusses: true
}

GM_addStyle(`
   #key_container{
      transition: background-color 200ms;
      position: absolute;
      display: inline-grid;
      grid-auto-flow: column;
      column-gap: 10px;
      bottom: 70px;
   }

   #key_container > *{
      pointer-events: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
   }

   #canvasObjEdit .eButton.sott_key:hover{
       background-color: rgba(100, 100, 100, 0.5);
       cursor: default;
   }

   .eButton.sott_key{
      opacity: 1;
      height: unset !important;
   }

   .plus{
      display: inline-grid;
      place-items: center;
      color: rgba(100, 100, 100, 0.5);
   }

   .fade.sott_key{
      transition-property: opacity;
      opacity: 0;
   }
`)

unsafeWindow.addEventListener("keyup", (e) => register_key(e, false));
unsafeWindow.addEventListener("keydown", (e) => register_key(e, true));
unsafeWindow.addEventListener("blur", () => {show_keys(active_keys = []);});
unsafeWindow.addEventListener("load", (e) => {
    key_container.id = "key_container";
    document.getElementById("canvasObjEdit").appendChild(key_container);
});

let key_container = document.createElement("div");
let active_keys = [];
let dying_keys = [];

setInterval(() => {
    for (let dying_key of dying_keys) {
        if (dying_key.time + config.fade_time + config.linger_time < new Date().getTime()) {
            dying_keys = dying_keys.filter(x => x != dying_key);
            console.log(active_keys);
            show_keys(active_keys);
        }
    }
}, 10);

function register_key(event, is_down) {
    if (event.repeat || config.ignore_keys.includes(event.keyCode)) return;

    if (is_down) {
        active_keys.push(event);
        dying_keys = dying_keys.filter(key => key.event.keyCode != event.keyCode);
    }
    else {
        dying_keys.push({
            event: event,
            time: new Date().getTime()
        });
        active_keys = active_keys.filter(key => key.keyCode != event.keyCode);
    }

    show_keys(active_keys);
}

function show_keys(active_keys) {
    let currently_active_keys = [];

    Array.from(document.getElementById("key_container").children).map(el => {
        if (!el.sott_keycode) {
            el.remove();
            return;
        }
        currently_active_keys.push(el.sott_keycode);

        if (!dying_keys.some(dying_key => dying_key.event.keyCode == el.sott_keycode)) {
            console.log("a");
            if (!active_keys.some(active_key => active_key.keyCode == el.sott_keycode)) {
                console.log("b");
                el.remove();
            }
            else {
                if (el.classList.contains("fade")) {
                    el.classList.remove("fade");
                    el.style.transitionDelay = el.style.transitionDuration = "0ms";
                }
            }
        }
        else {
            if (!el.classList.contains("fade")) {
                el.classList.add("fade");
                el.style.transitionDelay = config.linger_time + "ms";
                el.style.transitionDuration = config.fade_time + "ms";
            }
        }
    });

    for (let active_key of active_keys) {
        if (!currently_active_keys.includes(active_key.keyCode)) {
            let div = document.createElement("div");
            let string_key = active_key.key.length == 1 ? active_key.key.toUpperCase() : active_key.key;
            string_key = config.rename_keys.find(key => key.key_code == active_key.keyCode)?.text ?? string_key;

            div.innerText = string_key;
            div.classList.add("sott_key");
            div.classList.add("eButton");
            div.style.fontSize = config.font_size + "px";

            div.sott_keycode = active_key.keyCode;
            key_container.appendChild(div);
        }
    }

    Array.from(document.getElementById("key_container").children).map(el => {
        if (config.priority_keys.includes(el.sott_keycode) && !dying_keys.some(x => x.event.keyCode === el.sott_keycode)) {
            let priority = config.priority_keys.indexOf(el.sott_keycode);

            for (let child of Array.from(document.getElementById("key_container").children).reverse()) {
                if (config.priority_keys.includes(child.sott_keycode)) {
                    if(config.priority_keys.indexOf(child.sott_keycode) > priority) {
                        child.before(el);
                    }
                }
                else {
                    child.before(el);
                }
            }
        }
    });

    if (config.show_plusses){
        Array.from(document.getElementById("key_container").children).map(el => {
            let plus = document.createElement("div");
            plus.classList.add("plus");
            plus.innerText = "+";
            plus.style.fontSize = (config.font_size / 3) * 2 + "px";
            if (el != document.getElementById("key_container").firstChild) el.before(plus);
        })
    }
}
