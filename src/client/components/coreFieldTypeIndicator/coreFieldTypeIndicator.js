/*
 * /imports/client/components/coreFieldTypeIndicator/coreFieldTypeIndicator.js
 *
 * A small icon indicator to exhibit the type of field.
 * 
 * Parms:
 *  - type: a value from FieldType class: INFO, SAVE or WORK
 *  - classes: if set, a list of classes to be added to the default
 */

import { FieldType } from '../../classes/field-type.class.js';

import './coreFieldTypeIndicator.html';

Template.coreFieldTypeIndicator.helpers({
    // a class which encapsulates the icon 
    //  determines the color through the stylesheet
    iconClass(){
        return FieldType.classes( this.type );
    },
    // the name of the icon
    iconName(){
        return FieldType.icon( this.type );
    },
    // a title
    title(){
        return FieldType.title( this.type );
    }
});
