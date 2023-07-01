// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by core-ui.js.
import { name as packageName } from "meteor/pwix:core-ui";

// Write your tests here!
// Here is an example.
Tinytest.add( 'core-ui - example', function( test ){
    test.equal( packageName, 'core-ui' );
});
