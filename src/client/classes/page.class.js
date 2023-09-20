/*
 * /src/client/classes/page.class.js
 *
 * This class manages a defined page.
 * Only a non-empty name is mandatory. All other fields are free, and up to the application.
 * 
 * Known keys are:
 * 
 *  - name
 *                      Type: String
 *                      MANDATORY (no default).
 * 
 *  - inMenus
 *                      Definition type: String or Array of strings
 *                      Returned type: Array of strings
 *                      The menus names in which this page may appear as an item.
 *                      No default.
 * 
 *  - layout
 *                      Type: String
 *                      The layout to be used.
 *                      Defaulting to 'l-app' as configured.
 * 
 *  - menuIcon
 *                      Type: String
 *                      The name of the FontAwesome icon to be used in front of the menu label.
 *                      Defaulting to 'fa-chevron-right' as configured.
 * 
 *  - menuLabel
 *                      Type: String
 *                      The I18n translation key for the menu label.
 *                      No default.
 * 
 *  - rolesAccess
 *                      Definition type: String or Array of strings
 *                      Returned type: Array of strings
 *                      The role(s) needed to just have access to this page.
 *                      Defaulting to public access if no role is specified.
 * 
 *  - rolesEdit
 *                      Definition type: String or Array of strings
 *                      Returned type: Array of strings
 *                      The role(s) needed to edit the page (which actually means everything, and only depends of the application)
 *                      Defaulting to APP_ADMINISTRATOR (as this role may nonetheless do anything)
 *
 *  - route
 *                      the route to the page
 *                      MANDATORY (no default): without this option, the page is inaccessible.
 * 
 *  - template
 *                      Type: String
 *                      The template to be loaded
 *                      MANDATORY (no default): without this option, the page is just not rendered.
 * 
 *  - theme
 *                      Type: String
 *                      The theme to be applied.
 *                      Defaulting to 't-page' as configured.
 * 
 *  - wantEditionSwitch
 *                      Whether we want a 'edit now' toggle switch on the top of the page
 *                      Defaulting to false.
 * 
 * Please note that - after a try - we have decided to NOT use SimpleSchema to validate the provided definition.
 * Main reason is that it is difficult (or at least not documented) to use a longhand definition when type is either a string or an array of strings.
 * 
 * This class is designed so that the application can directly instanciate it, or may also derive it to build its own derived class.
 */

import _ from 'lodash';

import { check } from 'meteor/check';

export class Page {

    // static data

    // static methods

    // private data
    _name = null;
    _def = null;

    // private methods

    // protected methods
    //  these check methods are underscore_prefixed to mark them private along a common usage in javascript
    //  but we must consider them as only protected, and so useable by derived classes (and so not easily updatable)

    // check that the (optional) value is a boolean
    //  set the default value if provided
    _checkBoolean( o, key, defValue=null ){
        if( Object.keys( o ).includes( key )){
            check( o[key], Boolean );
        } else if( _.isBoolean( defValue )){
            o[key] = defValue;
        }
    }

    // check that the (optional) value is a string
    //  set the default value if provided
    _checkString( o, key, defValue=null ){
        if( Object.keys( o ).includes( key )){
            check( o[key], String );
        } else if( defValue ){
            o[key] = defValue;
        }
    }

    // check that the (optional) value is a string or an array of string(s)
    // update the provided object to have an array of string(s)
    //  set the default value if provided
    _checkStringOrArray( o, key, defValue=null ){
        if( Object.keys( o ).includes( key )){
            if( !Match.test( o[key], String ) && !Match.test( o[key], [String] )){
                throw new Error( key+' is not a string nor an array of string(s)' );
            }
            if( !_.isArray( o[key] )){
                o[key] = [ o[key] ];
            }
        } else if( defValue ){
            o[key] = defValue;
        }
    }

    // public data

    /**
     * Constructor
     * @param {String} name the page name
     * @param {Object} def the page definition as a javascript object
     * @returns {Page} a Page object
     * @throws {Exception} if the provided definition is not valid
     */
    constructor( name, def ){

        // may throw an error
        check( name, String );

        this._checkStringOrArray( def, 'inMenus', [] );
        this._checkString( def, 'layout', CoreUI._conf.layout );
        this._checkString( def, 'menuIcon', CoreUI._conf.menuIcon );
        this._checkString( def, 'menuLabel' );
        this._checkStringOrArray( def, 'rolesAccess', [] );
        this._checkStringOrArray( def, 'rolesEdit', [ CoreUI._conf.adminRole ] );
        this._checkString( def, 'route' );
        this._checkString( def, 'template' );
        this._checkString( def, 'theme', CoreUI._conf.theme );
        this._checkBoolean( def, 'wantEditionSwitch', false );

        this._name = name;
        this._def = { ...def };
    
        // be verbose if asked for
        if( CoreUI._conf.verbosity & CoreUI.C.Verbose.PAGE ){
            console.log( 'pwix:core-ui defining \''+name+'\' page' );
        }

        return this;
    }

    /**
     * @summary Generic getter
     * @param {String} key the name of the desired field
     * @returns {} the corresponding value
     */
    get( key ){
        if( key === 'name' ){
            return this._name;
        }
        return this._def[key];
    }

    /**
     * @returns {String} the page name
     */
    name(){
        return this._name;
    }

    /**
     * @returns {Array} the array of access roles
     */
    rolesAccess(){
        return this._def.rolesAccess;
    }

    /**
     * @returns {Array} the array of edit roles
     */
    rolesEdit(){
        return this._def.rolesEdit;
    }
}
