/**
 * ngShortcut
 * 
 * Сервис для привязки обработчкиов к "горячим клавишам"
 * 
 * (c) 2014 Виктор Дакалов
 * Лицензия MIT
 */

(function(){
  
  angular.module("ngShortcut", [])
  
    .factory("Shortcut", ["$document", function($document){

      var
        target = $document[0],
        
        KEY = {
          CTRL: "ctrl",
          SHIFT: "shift",
          ALT: "alt",
          UP: "up",
          DOWN: "down",
          LEFT: "left",
          RIGHT: "right",
          SPACE: "space",
          BACKSPACE: "backspace",
          ENTER: "enter",
          ESCAPE: "escape",
          WIN: "win"
        },
        MOD = {
          ALT: 18,
          CTRL: 17,
          SHIFT: 16
        },
        CODE = {
           8: "backspace",
          13: "enter",
          16: "shift",
          17: "ctrl",
          18: "alt",
          27: "escape",
          32: "space",
          37: "left",
          38: "up",
          39: "right",
          40: "down",
          91: "win"
        },
        
        shortcuts,
        
        /**
         * Кроссбраузерная привязка события
         * 
         * @param {String} name Имя события
         * @param {Function} handler Функция - обработчик
         */
        bind = (function(){
          return ('addEventListener' in $document[0] ?
            (function(name, handler){ target.addEventListener(name, handler, false);}) :
            (function(name, handler){ target.attachEvent("on"+name, handler) }));
        }());

      bind("keydown", handler);
      target.onkeydown = function(){ return false; };

      /**
       * 
       * @param {Event} event
       */
      function handler(event) {
        var shortcut;
        
        if (isModKey(event)) {
          return undefined;
        }
        
        shortcut = getShortcutFromEvent(event);
        
        getShortcuts().each(function(scut){
          if (scut.test(shortcut)) {
            scut.handler.call(scut, shortcut, event);
          }
        });
        
        return stop(event);
      }
      
      function stop(event) {
        event.stopPropagation();
        return false;
      }
      
      function each(list, fnc) {
        var isArr = list instanceof Array, index = 0;
        for (var item in list) {
          if (list.hasOwnProperty(item) && (!isArr || item !== 'length')) {
            fnc(list[item], item, index++);
          }
        }
      }
      
      function clone(arr) {
        var result = [];
        return each(arr, function(item){
          result.push(item);
        }), result;
      }
      
      function getShortcutFromEvent(event) {
        var shortcut = [], key;
        
        if (event.ctrlKey) {
          shortcut.push(KEY.CTRL);
        }
        
        if (event.shiftKey) {
          shortcut.push(KEY.SHIFT);
        }
        
        if (event.altKey) {
          shortcut.push(KEY.ALT);
        }
        
        key = getName(event);
        
        if (key) {
          shortcut.push(key);
        }
        
        return shortcut;
      }
      
      function isModKey(event) {
        return [MOD.ALT, MOD.SHIFT, MOD.CTRL].indexOf(getCode(event)) >= 0;
      }
      
      function getName(event) {
        var code = getCode(event);
        return code in CODE ? CODE[code] : String.fromCharCode(getCode(event));
      }
      
      function getCode(event) {
        return event.which || event.keyCode;
      }
      
      function parseInput(shortcut) {
        if (!(shortcut instanceof Array)) {
          shortcut = shortcut.split(/[^\+]\+/);
        }
        return shortcut;
      }
      
      function eqShortcut(sc1, sc2) {
        var target = clone(sc1);
        if (sc1.length === sc2.length) {
          each(sc2, function(scut){
            var pos = target.indexOf(scut);
            if (pos !== -1) {
              target.splice(pos, 1);
            }
          });
          return !target.length;
        }
        return false;
      }
      
      function getShortcuts() {
        return shortcuts || (shortcuts = new Shortcuts());
      }
      
      function Shortcuts() {}
      Shortcuts.prototype = new Array();
      Shortcut.prototype.last = function(){
        return this[this.length - 1];
      };
      Shortcuts.prototype.each = function(handler){
        each(this, handler);
      };
      
      /**
       * Класс горячей клваши
       * 
       * @param {Object} params
       * @constructor
       */
      function Shortcut(params) {

        var shortcuts = getShortcuts(),
            id = shortcuts.push(this) + 1; // get index for this
        
        if (!(params.shortcut instanceof Array)) {
          params.shortcut = [params.shortcut];
        }
        
        for (var index = 0; index < params.shortcut; index++) {
          params.shortcut[index] = parseInput(params.shortcut[index]);
        }
        
        /**
         * Разрушить объъект ГК
         */
        this.destroy = function(){
          shortcuts.splice(id, 1);
        };

        /**
         * Включена ли КГ
         * 
         * @returns {Boolean}
         */
        this.isEnable = function(){
          return params.enable;
        };

        /**
         * Включить ГК
         */
        this.enable = function(){
          params.enable = true;
        };

        /**
         * Выкоючить ГК
         */
        this.disable = function(){
          params.enable = false;
        };
        
        this.test = function(shortcut){
          if (shortcut.length) {
            var result = 0;
            each(params.shortcut, function(scut){
              if (eqShortcut(scut, shortcut)) {
                result++;
              }
            })
          }
          return result !== 0;
        };
        
      }
      
      return {
        
        /**
         * Регистрация новой горячей клавиши
         * 
         * @param {Object} params - Объект параметров для горячей клавиши
         * @param {String | Array} params.shortcut - Комбинация клавиш
         * @param {Function} params.handler - Обработчик события
         * @param {Boolean} params.enable - false, если обработчик не должен срабатывать на свои горячие клавиши
         * @returns {Shortcut}
         */
        bind: function(params){
          return new Shortcut(params)
        },

        /**
         * Удалить зарегистрированное ранее событие
         * 
         * @param {Shortcut} shortcut
         */
        unbind: function(shortcut){
          if (!this.isValid(shortcut)) {
            throw new TypeError("Shortcut.unbind: ошибка типа первого параметра");
          }
          shortcut.destroy();
        },

        /**
         * Проверка того, что переданный объект есть объект горячей клавиши
         * 
         * @param {Shortcut} shortcut
         */
        isValid: function(shortcut){
          return shortcut instanceof Shortcut;
        }
      };
      
    }]);
}());