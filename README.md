MinimaJS
=========

MinimaJS is an MVC-like Javascript framework that focuses on testability and maintainability.

Why use it?:

  - It's lightweight, only 5.8 kB including all hard dependencies.
  - The architecture is designed to allow a high grade of testability
  - It supports different type of API drivers for communication with backend, including web sockets and local storage
  - Flexibility, all dependencies such as selector libraries and templates engines are configurable. It works well together with jQuery, Zepto, Sizzle etc.

Architecture
=========
MinimaJS is based upon MVC. However, in MVC (as in Smalltalk-80 MVC) input events are handled by the controller, but in a web based architecture input events are triggered on DOM elements. Since the view often is responsible for drawing the DOM, this would tightly couple the views and the controller together.

In MinimaJS a presentation model is introduced in between the view and the controller. A presentation model is responsible for listening on the DOM elements for input events, and then report these to the controller. This removes the coupling as well as it makes the application a lot easier to test. This is the case since a unit test now can use the same interface as the presentation models are. 
