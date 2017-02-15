goog.provide("animal.Animal");

/**
 * @param {?string} name the name of the animal.
 * @constructor
 */
animal.Animal = function(name) {
  this.name = name;
};

/**
 * The name of the animal
 * @type {?string}
 */
animal.Animal.prototype.name;

/**
 * Log what the animal speaks into the console.
 */
animal.Animal.prototype.speak = function() {
  console.log(this.name + " makes a noise.");
};
