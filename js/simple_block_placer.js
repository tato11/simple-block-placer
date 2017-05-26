(function() {
  // Debug functions
  // ===============
  var showElement = function(element, selector) {
    var width = (element.p1.x - element.p0.x);
    width = width < 0 ? 1 : width;
    var height = (element.p1.y - element.p0.y);
    height = height < 0 ? 1 : height;
    $(selector)
      .css('position', 'absolute')
      .css('left', element.p0.x + 'px')
      .css('top', element.p0.y + 'px')
      .css('width', width + 'px')
      .css('height', height + 'px')
      ;
  };
  var showViewPort = function(viewPort) {
    var width = (viewPort.p1.x - viewPort.p0.x);
    width = width < 0 ? 1 : width;
    var height = (viewPort.p1.y - viewPort.p0.y);
    height = height < 0 ? 1 : height;
    $('.viewport')
      .css('position', 'absolute')
      .css('left', viewPort.p0.x + 'px')
      .css('top', viewPort.p0.y + 'px')
      .css('width', width + 'px')
      .css('height', height + 'px')
      ;
  };
  
  
  
  
  
  
  // Define constants
  var X_AXIS = 0;
  var Y_AXIS = 1;
  var POINT_0 = 0;
  var POINT_1 = 1;
  
  // Define point class
  var pointClass = function(x, y) {
    if (typeof(x) === 'undefined') { x = 0; }
    if (typeof(y) === 'undefined') { y = 0; }
    this.x = x;
    this.y = y;
  };
  pointClass.prototype = {
    x: 0,
    y: 0,
    axis: function(axisIndex) {
      if (axisIndex === X_AXIS) return this.x;
      if (axisIndex === Y_AXIS) return this.y;
    },
    setAxis: function(axisIndex, value) {
      if (axisIndex === X_AXIS) this.x = value;
      if (axisIndex === Y_AXIS) this.y = value;
    },
    clone: function() {
      var clonePoint = new pointClass();
      clonePoint.x = this.x;
      clonePoint.y = this.y;
      return clonePoint;
    }
  };
  
  // Define element clases
  var elementClass = function(){
    this.p0 = new pointClass();
    this.p1 = new pointClass();
  };
  elementClass.prototype = {
    // [X0, Y0]
    p0: null,
    // [X1, Y1]
    p1: null,
    point: function(pointIndex) {
      if (pointIndex === POINT_0) return this.p0;
      if (pointIndex === POINT_1) return this.p1;
    },
    setPoint: function(pointIndex, value) {
      if (pointIndex === POINT_0) this.p0 = value;
      if (pointIndex === POINT_1) this.p1 = value;
    },
    clone: function() {
      var cloneElement = new elementClass();
      cloneElement.p0 = this.p0.clone();
      cloneElement.p1 = this.p1.clone();
      return cloneElement;
    }
  };
  
  // Define object constants
  var AXIS = {
    x: X_AXIS,
    y: Y_AXIS,
    invert: function(axisIndex) {
      if (axisIndex === X_AXIS) return Y_AXIS;
      if (axisIndex === Y_AXIS) return X_AXIS;
    },
    all: [X_AXIS, Y_AXIS]
  };
  var POINT = {
    p0: POINT_0,
    p1: POINT_1,
    invert: function(pointIndex) {
      if (pointIndex === POINT_0) return POINT_1;
      if (pointIndex === POINT_1) return POINT_0;
    },
    all: [POINT_0, POINT_1]
  };
  var CORNER = {
    L_T: 0,
    R_B: 1,
    R_T: 2,
    L_B: 3
  };
  var ORDER = new pointClass(
    { // X
      A_B: 0,
      B_A: 1,
      COLLISION: 4
    }, { // Y
      A_B: 2,
      B_A: 3,
      COLLISION: 5
    }
  );

  // Algorithms
  // =========
  /**
   * Algorithm 1: Find collisions and the element order on the axis
   * @param {elementClass} elementA
   * @param {elementClass} elementB
   * @param {Number} axis X_AXIS, Y_AXIS
   * @returns {Number.COLLISION|Number.B_A|Number.A_B}
   */
  var calculateElementOrder = function(elementA, elementB, axis) {
    if (elementA.p0.axis(axis) > elementB.p1.axis(axis)) {
      if (elementA.p1.axis(axis) > elementB.p0.axis(axis)) {
        // Element B is before A
        return ORDER.axis(axis).B_A;
      }
      // Element B and A has a collision
      return ORDER.axis(axis).COLLISION;
    }
    if (elementB.p0.axis(axis) > elementA.p1.axis(axis)) {
      // Element A is before B
      return ORDER.axis(axis).A_B;
    }
    // Element A and B has a collision
    return ORDER.axis(axis).COLLISION;
  };

  /**
   * Algorithm 2: Find the internal points and sizes. (NOT USED)
   * @param {elementClass} elementA
   * @param {elementClass} elementB
   * @param {Number} axis X_AXIS, Y_AXIS
   * @returns {array}
   */
  var calculateExternalPoints = function(elementA, elementB, axis) {
    var internalSpace = new elementClass();
    internalSpace.p0 = (elementA.p0[axis] > elementB.p0[axis]) ? elementB.p0.clone() : elementA.p0.clone();
    internalSpace.p1 = (elementA.p1[axis] > elementB.p1[axis]) ? elementA.p1.clone() : elementB.p1.clone();
    return internalSpace;
  };
  
  
  /**
   * Detects if a point is inside the viewport
   * @param {pointClass} point
   * @param {Number} axis X_AXIS, Y_AXIS
   * @param {elementClass} viewPort
   * @returns {Boolean}
   */
  var isPointInsideViewPort = function(point, axis, viewPort) {
    // Check if the point is out the viewport borders
    if (point.axis(axis) < viewPort.p0.axis(axis) || point.axis(axis) > viewPort.p1.axis(axis)) {
      // The point is out
      return false;
    }
    
    // The point is inside
    return true;
  };
  
  /**
   * Algorithm 7: Detects if an element is inside a view port from an especific axis perspective
   * @param {elementClass} element
   * @param {Number} axis X_AXIS, Y_AXIS
   * @param {elementClass} viewPort
   * @param {Boolean} cropElement
   * @returns {elementClass}
   */
  var isInsideViewPortAxis = function(element, axis, viewPort, cropElement) {
    // Default crop to false
    if (typeof(cropElement) === 'undefined') { cropElement = false; }
    
    var point0Out = !isPointInsideViewPort(element.p0, axis, viewPort);
    var point1Out = !isPointInsideViewPort(element.p1, axis, viewPort);
    
    // Check if both points are out
    if (point0Out && point1Out) {
      // The element is out the view port
      return false;
    }
    
    // If element's point 0 is out and crop, then set it's axis value as viewport's point 0
    if (point0Out && cropElement) {
      element.p0.setAxis(axis, viewPort.p0.axis(axis));
    }
    
    // If element's point 1 is out and crop, then set it's axis value as viewport's point 1
    if (point1Out && cropElement) {
      element.p1.setAxis(axis, viewPort.p1.axis(axis));
    }
    
    // The element is partially or completely inside the viewport
    return true;
  };
  
  /**
   * Algorithm 7: Detects if the element is inside the viewport
   * @param {elementClass} element
   * @param {Number} axis X_AXIS, Y_AXIS
   * @param {elementClass} viewPort
   * @param {Boolean} cropElement
   * @returns {elementClass}
   */
  var isInsideViewPort = function(element, viewPort, cropElement) {
    return isInsideViewPortAxis(element, X_AXIS, viewPort, cropElement)
      && isInsideViewPortAxis(element, Y_AXIS, viewPort, cropElement);
  };
  
  /**
   * Algorithm 3: Exclude an element segment from the viewport but keep the other ones
   * @param {elementClass} elementA This element will be cropped inside the new viewport
   * @param {elementClass} elementB This element will be cropped inside the new viewport
   * @param {elementClass} elementToExclude
   * @param {Number} axis X_AXIS, Y_AXIS | axis to limit
   * @param {Number} pointIndex POINT_0, POINT_1 | point index to limit
   * @param {elementClass} viewPort
   * @returns {elementClass} The new viewport if both elements are inside or null when any is out
   */
  var minifyViewPortAndElements = function(elementA, elementB, elementToExclude, axis, pointIndex, viewPort) {
    // Exit when the element to exclude is out the viewport
    //showViewPort(viewPort);
    //showElement(elementToExclude, '.element');
    //showElement(elementA, '.elementa');
    //showElement(elementB, '.elementb');
    if (!isInsideViewPort(elementToExclude, viewPort, true)) { return null; }
    
    var newViewPort = viewPort.clone();
    var limitedViewPort = viewPort.clone();
    
    // Invert point index and axis
    var invPointIndex = POINT.invert(pointIndex);
    var invAxis = AXIS.invert(axis);
    
    // Use viewport outer point to set inverted axis limit
    //limitedViewPort.p1.setAxis(axis, viewPort.p1.axis(axis));
    //limitedViewPort.setPoint(pointIndex, newViewPort.point(pointIndex).clone());

    // Limit viewport by excluded element inverted axis coordinate point
    limitedViewPort.point(pointIndex).setAxis(
      axis,
      elementToExclude.point(invPointIndex).axis(axis)
    );
    //showViewPort(limitedViewPort);
    
    // Crop new viewport and check when out
    if (!isInsideViewPort(newViewPort, limitedViewPort, true)) {
      // Viewport is out the limited viewport
      return null;
    }
    
    // Crop the elements are still inside the new viewport
    if (!isInsideViewPort(elementA, newViewPort, true) || !isInsideViewPort(elementB, newViewPort, true)) {
      // An element is out the new viewport so it is invalid
      return null;
    }
    
    // The elements are inside the new viewport and has been cropped
    return newViewPort;
  };
  
  /**
   * Minify viewport until there are no more elements except the elementA and elementB,
   * or the callback was successfull.
   * @param {elementClass} elementA
   * @param {elementClass} elementB
   * @param {elementClass} elementListToExclude
   * @param {elementClass} viewPort
   * @param {Function} callback
   * @returns {Boolean}\
   */
  var minifyViewPort = function(elementA, elementB, baseElementListToExclude, viewPort, callback) {
    // Execute callback when no elements to exclude
    if (baseElementListToExclude.length < 1) { return callback(elementA, elementB, viewPort); }
    
    var newViewPort = null;
    var elementListToExclude = baseElementListToExclude.slice();
    
    // Test all axis and points for new valid viewports
    var elementToExclude = elementListToExclude.pop();
    for (var i = 0; i < AXIS.all.length; i++) {
      for (var j = 0; j < POINT.all.length; j++) {
        // Get new minified view port
        newViewPort = minifyViewPortAndElements(
          elementA.clone(),
          elementB.clone(),
          elementToExclude.clone(),
          AXIS.all[i],
          POINT.all[j],
          viewPort
        );

        // Continue with next one when invalid viewport
        if (newViewPort === null) { continue; }

        // Keep excluding elements to minify the viewport until empty
        if (elementListToExclude.length > 0) {
          if (minifyViewPort(elementA.clone(), elementB.clone(), elementListToExclude, newViewPort, callback)) {
            return true;
          } else {
            continue;
          }
        }

        // Trigger callback to compare
        if (callback(elementA, elementB, newViewPort)) {
          // The callback was successfull and the job is finish!
          return true;
        }
      }
    }
    
    // Return excluded element to the stack to continue searching
    return false;
  };
  
  /**
   * Event to search the popup placement.
   * @param {elementClass} elementA
   * @param {elementClass} elementB
   * @param {elementClass} viewPort
   * @param {elementClass} popup
   * @returns {Boolean}
   */
  var popupPlacementSearch = function(elementA, elementB, viewPort, popup) {
    var axis = null;
    var invAxis = null;
    var data = null;

    var orderedElements = new pointClass(
      {order: null, first: null, last: null, viewPortSpace: null, space: null},
      {order: null, first: null, last: null, viewPortSpace: null, space: null}
    );
    //showViewPort(viewPort);

    // Get ordered elements
    for (var k = 0; k < AXIS.all.length; k++) {
      axis = AXIS.all[k];
      invAxis = AXIS.invert(axis);
      data = orderedElements.axis(axis);

      // Continue when viewPort is too small on the inverted axis
      data.viewPortSpace = viewPort.p1.axis(invAxis) - viewPort.p0.axis(invAxis);
      if (popup.dimension(invAxis) > data.viewPortSpace) continue;

      // Get first and last
      data.order = calculateElementOrder(elementA, elementB, axis);
      switch(data.order) {
        // Continue when collision
        case ORDER.axis(axis).COLLISION:
          data.first = elementA.p0.axis(axis) < elementB.p0.axis(axis) ? elementA : elementB;
          data.last = elementA.p1.axis(axis) < elementB.p1.axis(axis) ? elementA : elementB;
          continue;
        case ORDER.axis(axis).A_B:
          data.first = elementA;
          data.last = elementB;
          break;
        case ORDER.axis(axis).B_A:
          data.first = elementB;
          data.last = elementA;
          break;
      }
    }

    // Try to place it in between
    for (var k = 0; k < AXIS.all.length; k++) {
      axis = AXIS.all[k];
      invAxis = AXIS.invert(axis);
      data = orderedElements.axis(axis);

      // Continue when viewPort is too small on the inverted axis
      // or there is a collision
      if (popup.dimension(invAxis) > data.viewPortSpace || data.order === ORDER.axis(axis).COLLISION)
        continue;

      // Is enough space?
      var space = data.last.p0.axis(axis) - data.first.p1.axis(axis);
      if (popup.dimension(axis) > space) continue;

      // We do have space on this axis, now calculate the position
      popup.p0.setAxis(axis, (space - popup.dimension(axis)) / 2 + data.first.p1.axis(axis));
      popup.p0.setAxis(invAxis, (data.viewPortSpace - popup.dimension(invAxis)) / 2 + viewPort.p0.axis(invAxis));
      popup.p1.setAxis(axis, popup.p0.axis(axis) + popup.dimension(axis));
      popup.p1.setAxis(invAxis, popup.p0.axis(invAxis) + popup.dimension(invAxis));
      return true;
    }

    // There is no inbetween space, let's try on the borders
    for (var k = 0; k < AXIS.all.length; k++) {
      axis = AXIS.all[k];
      invAxis = AXIS.invert(axis);
      data = orderedElements.axis(axis);

      // Continue when viewPort is too small on the inverted axis
      if (popup.dimension(invAxis) > data.viewPortSpace) continue;

      // Check for first to border space
      var firstSpace = data.first.p0.axis(axis) - viewPort.p0.axis(axis);
      if (popup.dimension(axis) <= firstSpace) {
        // We do have space on this axis, now calculate the position
        popup.p0.setAxis(axis, (firstSpace - popup.dimension(axis)) / 2 + viewPort.p0.axis(axis));
        popup.p0.setAxis(invAxis, (data.viewPortSpace - popup.dimension(invAxis)) / 2 + viewPort.p0.axis(invAxis));
        popup.p1.setAxis(axis, popup.p0.axis(axis) + popup.dimension(axis));
        popup.p1.setAxis(invAxis, popup.p0.axis(invAxis) + popup.dimension(invAxis));
        return true;
      }

      // Check for last to border space
      var lastSpace = viewPort.p1.axis(axis) - data.last.p1.axis(axis);
      if (popup.dimension(axis) <= lastSpace) {
        // We do have space on this axis, now calculate the position
        popup.p0.setAxis(axis, (lastSpace - popup.dimension(axis)) / 2 + data.last.p1.axis(axis));
        popup.p0.setAxis(invAxis, (data.viewPortSpace - popup.dimension(invAxis)) / 2 + viewPort.p0.axis(invAxis));
        popup.p1.setAxis(axis, popup.p0.axis(axis) + popup.dimension(axis));
        popup.p1.setAxis(invAxis, popup.p0.axis(invAxis) + popup.dimension(invAxis));
        return true;
      }
    }

    return false;
  };
  
  
  // Minify View Port and check if popup fits
  function placePopup(viewPortSelector, popupSelector, elementSelector) {
    // Get view port relative position
    var viewPortSelector = viewPortSelector;
    var viewPortPosition = neon.select(viewPortSelector).getPosition();
    var basePoint = new pointClass(
      // Base X
      viewPortPosition.left,
      // Base Y
      viewPortPosition.top
    );
    var cointainerViewPort = new elementClass();
    cointainerViewPort.p1.x = viewPortPosition.right - basePoint.x;
    cointainerViewPort.p1.y = viewPortPosition.bottom - basePoint.y;

    // Get elements relative position
    var elementList = [];
    $(elementSelector).each(function(index, item){
      var itemPosition = neon.select(item).getPosition();
      var element = new elementClass();
      element.p0.x = itemPosition.left - basePoint.x;
      element.p0.y = itemPosition.top - basePoint.y;
      element.p1.x = itemPosition.right - basePoint.x;
      element.p1.y = itemPosition.bottom - basePoint.y;
      elementList.push(element);
    });

    // Get popup position
    var popupPosition = neon.select(popupSelector).getPosition();
    var popup = new elementClass();
    popup.height = popupPosition.bottom - popupPosition.top;
    popup.width = popupPosition.right - popupPosition.left;
    popup.dimension = function (axisIndex) {
      if (axisIndex === X_AXIS) return this.width;
      if (axisIndex === Y_AXIS) return this.height;
    };
    popup.p1.x = popup.width;
    popup.p1.y = popup.height;
    
    // Place popup
    var viewPort = cointainerViewPort.clone();
    for(var i = 0; i < elementList.length - 1; i++) {
      var elementA = elementList[i];
      for(var j = i + 1; j < elementList.length; j++) {
        var elementB = elementList[j];
        
        // Get elements to exclude
        var elementListToExclude = [];
        for (var i = 0; i < elementList.length; i++) {
          if (elementList[i] === elementA || elementList[i] === elementB)
            continue;
          elementListToExclude.push(elementList[i]);
        }
        
        // MinifyViewPort and calculate
        var success = minifyViewPort(
          elementA,
          elementB,
          elementListToExclude,
          viewPort,
          function(elementA, elementB, viewPort) {
            // Send generated popup object to event
            return popupPlacementSearch(elementA, elementB, viewPort, popup);
          }
        );
        if (success) {
          // Show popup
          $(popupSelector)
            .css('position', 'absolute')
            .css('left', popup.p0.x + 'px')
            .css('top', popup.p0.y + 'px');
          return true;
        }
      }
    }
    return false;
  }
  
  // Execute everything
  setInterval(
    function() {
      placePopup(
        '.tutorial-container .tutorial-viewport',
        '.popup',
        '.element-item');
      },
      500 // miliseconds
    );
  

})();
