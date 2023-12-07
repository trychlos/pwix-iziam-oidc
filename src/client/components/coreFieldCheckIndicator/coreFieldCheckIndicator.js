/*
 * /imports/client/components/coreFieldCheckIndicator/coreFieldCheckIndicator.js
 *
 * A small icon indicator to exhibit the result of the check of the field.
 * 
 * Note: FontAwesome displays its icons by replacing the <span>...</span> element by a svg. As a consequence, the icon cannot be dynanmically replaced.
 *  We have to display all icon elements, only making visible the one we are interested in.
 * 
 * Parms:
 *  - type: a FieldCheck constant as INVALID, NONE, UNCOMPLETE or VALID
 */

import { FieldCheck } from '../../classes/field-check.class.js';

import './coreFieldCheckIndicator.html';

Template.coreFieldCheckIndicator.onRendered( function(){
    const self = this;

    self.autorun(() => {
        self.$( '.core-field-check-indicator .display-class' ).removeClass( 'visible' ).addClass( 'hidden' );
        self.$( '.core-field-check-indicator .display-class[data-type="'+Template.currentData().type+'"]' ).removeClass( 'hidden' ).addClass( 'visible' );
    });
});

Template.coreFieldCheckIndicator.helpers({
    // a class which encapsulates the icon 
    //  determines the color through the stylesheet
    itClass( it ){
        return FieldCheck.classes( it );
    },

    // the name of the icon 
    itIcon( it ){
        return FieldCheck.icon( it );
    },

    // a class which encapsulates the icon 
    //  determines the color through the stylesheet
    itTitle( it ){
        return FieldCheck.title( it );
    },

    // list of known types
    itemsList(){
        return FieldCheck.Knowns();
    }
});
