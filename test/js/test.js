goog.provide("test");

goog.require("animal.Dog");

/**
 * @define {!string}
 */
goog.define("test.MY_TEST_SENTENCE", "one, two, three");

var dog = new animal.Dog("Peanut");
dog.speak();

var animal = new animal.Animal("Mr. Mouse");
animal.speak();

var rect = new math.Rectangle(100, 200);
console.log("width: " + rect.width + ", height: " + rect.height + ".");
console.log("area: " + rect.getArea() + ".");

console.log(test.MY_TEST_SENTENCE);
