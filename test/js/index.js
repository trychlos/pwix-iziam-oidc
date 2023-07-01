// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by ui-core.js.
import { name as packageName } from "meteor/pwix:ui-core";

// Write your tests here!
// Here is an example.
Tinytest.add( 'ui-core - example', function( test ){
    test.equal( packageName, 'ui-core' );
});
