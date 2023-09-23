/*
 * /src/client/classes/form-multiple.class.js
 *
 * This client class manages several FormChecher's forms.
 * 
 * Notes:
 *  - The constructor should be called from the template onRendered().
 *    It only consolidate the results from several forms, to enable or not the OK buttons
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict; // up to nodejs v16.x

import { Mongo } from 'meteor/mongo';

export class FormMultiple {

    // static data

    // static methods

    // private data

    _data = null;

    // private methods

    // protected methods

    // public data

    /**
     * Constructor
     * @param {Object} o an object with following keys:
     *  - instance: the calling template instance
     *  - $ok: if set, the jQuery object which defines the OK button (to enable/disable it)
     *  - $err: if set, the jQuery object which defines the error message place
     *  - $ok: if set, the jQuery object which defines the OK button (to enable/disable it)
     *  - $err: if set, the jQuery object which defines the error message place
     *  - opts: if set, an object which will be passed to every check_<fn> collection function
     * 
     *  - collection: the collection object
     *  - fields: a hash which defines the fields to be checked, where:
     *      <key> must be the name of the field in the collection schema
     *      <value> is a hash wih following keys:
     *          - js: the CSS selector for the field in the DOM
     *  - new: whether we are checking a new record, or an already existing one
     *  - useBootstrapValidationClasses: defaulting to true
     * @returns {FormMultiple} a FormMultiple object
     */
    constructor( o ){
        const self = this;
        //console.debug( o );
        assert( o, 'expected an Object argument' );
        assert( o.instance instanceof Blaze.TemplateInstance, 'instance is not a Blaze.TemplateInstance');
        assert( !o.$ok || o.$ok.length > 0, 'when provided, $ok must be set to a DOM element' );
        assert( !o.$err || o.$err.length > 0, 'when provided, $err must be set to a DOM element' );

        // keep the provided params
        //  + define a ReactiveVar for this instance which will hold the item validity status
        //  + define a reverse hash js selector to field name
        this._data = {
            instance: o.instance,
            $ok: o.$ok || null,
            $err: o.$err || null,
            opts: o.opts || {}
        };

        //console.debug( this );
        return this;
    }

    /**
     * @summary input event handler
     * @param {Object} event the Meteor event
     * 
     * event.handleObj.type = 'input'
     * event.handleObj.selector = '.js-label'
     * 
     * The principe is that:
     * 1. we check the input field identified by its selector
     *      the check function put itself an error message if not ok
     * 2. if ok, we check all fields (but this one)
     */
    inputHandler( event ){
        const field = this._data.jstof[ event.handleObj.selector ];
        this[ 'check_'+field ]()
            .then(( valid ) => {
                if( valid ){
                    return this.check({ field: field });
                }
            });
    }
}
