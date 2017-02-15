goog.provide("math.Rectangle");

/**
 * @param {?number} width the width of the rectangle.
 * @param {?number} height the height of the rectangle.
 * @constructor
 */
math.Rectangle = function(width, height) {
  this.width = width;
  this.height = height;
};

/**
 * @type {?number}
 */
math.Rectangle.prototype.width;

/**
 * @type {?number}
 */
math.Rectangle.prototype.height;

/**
 * Returns the area of the rectangle.
 * @return {?number} the area of the rectangle.
 */
math.Rectangle.prototype.getArea = function() {
  return this.width * this.height;
};
