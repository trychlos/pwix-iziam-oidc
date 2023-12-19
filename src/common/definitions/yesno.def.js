/*
 * pwix:core-ui/src/common/definitions/yesno.def.js
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict;

import { pwixI18n } from 'meteor/pwix:i18n';

export const YesNo = {
    C: [
        {
            // yes|true
            id: 'true',
            short: 'yesno.yes_short',
            value: true
        },
        {
            // no|false
            id: 'false',
            short: 'yesno.no_short',
            value: false
        }
    ],

    /**
     * @param {String} id an identifier
     * @returns {Object} the YesNo definition, or null
     */
    byId( id ){
        let found = null;
        this.Knowns().every(( def ) => {
            if( def.id === id ){
                found = def;
            }
            return found === null;
        });
        return found;
    },

    /**
     * @param {Boolean} value the value to be searched for
     * @returns {Object} the YesNo definition, or null
     */
    byValue( value ){
        let found = null;
        this.Knowns().every(( def ) => {
            if( def.value === value ){
                found = def;
            }
            return found === null;
        });
        return found;
    },

    /**
     * @param {Object} def a YesNo definition as returned by YesNo.Knowns()
     * @returns {String} the identifier
     */
    id( def ){
        return def.id;
    },

    /**
     * @returns {Array} the list of managed YesNo definitions
     */
    Knowns(){
        return this.C;
    },

    /**
     * @param {Object} def a YesNo definition as returned by YesNo.Knowns()
     * @returns {String} the label to be attached to the definition, actually same than short()
     */
    label( def ){
        return YesNo.short( def );
    },

    /**
     * @param {Object} def a YesNo definition as returned by YesNo.Knowns()
     * @returns {String} the short label to be attached to the definition
     */
    short( def ){
        return pwixI18n.label( I18N, def.short );
    },

    /**
     * @param {Object} def a YesNo definition as returned by YesNo.Knowns()
     * @returns {Boolean} the corresponding Boolean value
     */
    value( def ){
        return def.value;
    }
};
