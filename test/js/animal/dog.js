goog.provide("animal.Dog");

goog.require("animal.Animal");

/**
 * @param {?string} name the name of the animal.
 * @constructor
 * @extends {animal.Animal}
 */
animal.Dog = function(name) {
  animal.Animal.call(this, name);
};
goog.inherits(animal.Dog, animal.Animal);

/**
 * Log what the dog speaks into the console.
 */
animal.Dog.prototype.speak = function() {
  console.log(this.name + " barks.");
};
