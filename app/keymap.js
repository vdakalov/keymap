/**
 *
 * @filesource /client/scripts/keymap.js
 */

(function(){
    'use strict';

    var LISTEN_ELEMENT = document,
        EVENT_NAME = 'keydown',

        KEY_SHIFT = 16,
        KEY_CTRL = 17,
        KEY_ALT = 18,

        keymap = {
             8: 'backspace',
            13: 'enter',
            16: 'shift',
            17: 'ctrl',
            18: 'alt',
            27: 'escape',
            32: 'space',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            91: 'win'
        },

        ShortCut, // model
        Scope, // collection
        scope = null; // instance of scope

    ShortCut = Backbone.Model.extend({

        defaults: {
            shortcut: null,
            listen: null,
            handler: null,
            block: false
        },

        initialize: function(){
            this.on('invalid', this.dropException);
            this.on('change', this.validate);
            this.on('change:shortcut', this.shortcutPrepare);

            // manual validation start
            this.manValidate(this.toJSON());

            // manual run shortcat prepare
            this.shortcutPrepare();
        },

        manValidate: function(attrs) {

            var errorMsg = this.validate(attrs);

            if(errorMsg) {
                this.dropException(this, errorMsg);
            }
        },

        dropException: function(shortCut, error){
            throw new Error('winterfell.keymap: ' + error);
        },

        validate: function(attrs){

            if(_.has(attrs, 'handler') && !_.isFunction(attrs.handler)) {
                return 'invalid type of shortcut handler';
            }

            if(_.has(attrs, 'shortcut') && !_.isArray(attrs.shortcut)
                && !_.isString(attrs.shortcut) && !attrs.shortcut.length) {
                return 'invalid names of shortcut keys';
            }

            if(_.has(attrs, 'listen') && !_.isNull(attrs.listen) && !_.isElement(attrs.listen)) {
                return 'the value of the listen is not HTMLElement object';
            }

            if(_.has(attrs, 'block') && !_.isBoolean(attrs.block)) {
                return 'the value of the block param is not boolean';
            }

            return undefined;
        },

        /**
         * Convert shortcut from string to array
         */
        shortcutPrepare: function() {

            var shortcut = this.get('shortcut');

            if(_.isString(shortcut)) {

                shortcut = shortcut.toLowerCase();

                // remove whitespace
                shortcut = shortcut.replace(/\s/, '');

                // ...for split string by '+'
                shortcut = shortcut.replace('++', '+%2B');
                shortcut = shortcut.split('+');

                // return name of key from %2B in +
                var plusIndex = shortcut.indexOf('%2B');
                if(~plusIndex) {
                    shortcut[plusIndex] = '+';
                }

                this.set({shortcut: shortcut}, {silent: true});
            }
        }

    });

    Scope = Backbone.Collection.extend({
        model: ShortCut,
        initialize: createEventListener
    });

    /*************************
     * WORK WITH EVENT OBJECT
     *************************/

    /**
     * check event param on jQuery event object
     *
     * @param {Event} event
     * @return {boolean}
     */
    function isEvent(event) {
        return event instanceof $.Event || event instanceof Event;
    }

    /**
     * get key name from event
     *
     * @param {Event} event
     * @return {Number}
     */
    function getKeyCode(event) {
        return event.keyCode || event.which;
    }

    /**
     * get char from key code
     *
     * @param {Number} keyCode
     * @return {String}
     */
    function getKeyCharFromCode(keyCode) {
        return String.fromCharCode(keyCode);
    }

    /**
     *
     * @param {Number} keyCode
     * @return {String | Null}
     */
    function getKeyNameFromCode(keyCode) {

        if(keyCode in keymap) {
            return keymap[keyCode];
        }

        return getKeyCharFromCode(keyCode);
    }

    /**
     * get key name from event
     *
     * @param {Event} event
     * @return {String|Null}
     */
    function getKeyNameFromEvent(event) {

        var keyCode = getKeyCode(event);

        if(!keyCode) {
            return null;
        }

        // it key is itself the modifier of key
        if(isModifierKey(keyCode)) {
            return null;
        }

        return getKeyNameFromCode(keyCode);
    }

    /**
     * defined alt key
     *
     * @param {Event} event
     * @return {boolean}
     */
    function defAlt(event) {
        return event.altKey;
    }

    /**
     * defined ctrl key
     *
     * @param {Event} event
     * @return {boolean}
     */
    function defCtrl(event) {
        return event.ctrlKey;
    }

    /**
     * defined shift key
     *
     * @param {Event} event
     * @return {boolean}
     */
    function defShift(event) {
        return event.shiftKey;
    }

    /**
     * Check event keyCode on eq altKey, ctrlKey and shiftKey
     *
     * @param {Number} keyCode
     * @return {boolean}
     */
    function isModifierKey(keyCode) {

        var modKeys = [KEY_ALT, KEY_CTRL, KEY_SHIFT];

        return !!~modKeys.indexOf(keyCode);
    }

    /**
     * get the modifiers of key from event
     *
     * @param {Event} event
     * @return {Array}
     */
    function getModifiersKey(event) {

        var mods = [];

        if(defAlt(event)) {
            mods.push(keymap[KEY_ALT]);
        }

        if(defCtrl(event)) {
            mods.push(keymap[KEY_CTRL]);
        }

        if(defShift(event)) {
            mods.push(keymap[KEY_SHIFT]);
        }

        return mods;
    }

    /**
     *
     * @param {Event} event
     * @return {Array}
     */
    function getShortcutFromEvent(event) {

        var shortCut = getModifiersKey(event),
            keyName = getKeyNameFromEvent(event);

        // if exist key name
        if(keyName) {
            keyName = keyName.toLowerCase();
            shortCut.push(keyName);
        }

        return shortCut;

    }

    /*********************************
     * LISTEN AND PROCESSING OF EVENT
     *********************************/

    /**
     *
     * @param event
     * @return {null|Event}
     */
    function getEvent(event) {

        if(isEvent(event)) {
            return event;

        } else if(isEvent(window.event)) {
            return window.event;
        }

        // WARNING! it log-message, don't delete
        console.error('winterfell.keymap: Undefined event object');

        return null;
    }

    /**
     * check for compliance with the reduction reduce user
     *
     * @param {Array} eventShortcut - shortcut from current event
     * @param {Array} customShortcut - user shortcut
     * @return {Boolean}
     */
    function eqShortcut(eventShortcut, customShortcut) {

        var resultShortcut = ['excess value'],
            _eventShortcut = null,
            _customShortcut = null;

        if(eventShortcut.length === customShortcut.length) {
            _eventShortcut = _.clone(eventShortcut);
            _customShortcut = _.clone(customShortcut);

            _eventShortcut.splice(0, 0, _customShortcut);
            resultShortcut = _.without.apply(_, _eventShortcut);
        }

        return resultShortcut.length === 0;
    }

    /**
     * check for event trigger source
     *
     * @param {EventTarget | HTMLElement} target
     * @param {HTMLElement} listen
     * @return {Boolean}
     */
    function eqListenObject(target, listen) {

        // any trigger source
        if(!listen) {
            return true;
        }

        return _.isElement(target) && _.isEqual(target, listen);
    }

    /**
     * set listening events
     *
     * @return void
     */
    function createEventListener() {
        $(LISTEN_ELEMENT).on(EVENT_NAME, eventHandler);
    }

    function eventHandler() {

        var event = getEvent.apply(null, arguments),
            handler = null,
            shortcut = null,

            blocked = false;

        if(!event) {
            return undefined;
        }

        shortcut = getShortcutFromEvent(event);

        // search eq custom shortcut and call handler
        scope.each(function(customShortcut){

            // check key names and listen and target elements
            if(eqShortcut(_.clone(shortcut), customShortcut.get('shortcut')) && eqListenObject(event.target, customShortcut.get('listen'))) {

                // call handler shortcut
                handler = customShortcut.get('handler');
                handler(event, customShortcut);

                if(customShortcut.get('block') === true) {
                    blocked = true;
                }
            }
        });

        if(blocked) {
            event.preventDefault();
            return false;
        }

        return undefined;
    }

    // run app
    scope = new Scope();

    // share in global
    winterfell.keymap = scope;

}());