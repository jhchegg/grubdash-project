const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists(request, response, next) {
  const { orderId } = request.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    response.locals.order = foundOrder;
    next();
  } else {
    next({ status: 404, message: `Order not found: ${orderId}` });
  }
}

function validateDeliverTo(request, response, next) {
  const { data: { deliverTo } = {} } = request.body;
  if (!deliverTo || deliverTo === "") {
    return next({ status: 400, message: "Order must include a deliverTo" });
  } else {
    next();
  }
}

function validateMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (!mobileNumber || mobileNumber === "") {
    return next({ status: 400, message: "Order must include a mobileNumber" });
  } else {
    next();
  }
}

function validateDishes(request, response, next) {
  const { data: { dishes } = {} } = request.body;
  if (!dishes) {
    return next({ status: 400, message: "Order must include a dish" });
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  } else {
    next();
  }
}

function validateDishQuantity(request, response, next) {
  const { data: { dishes } = {} } = request.body;
  const invalidDish = dishes.find(
    (dish, index) =>
      !dish.quantity ||
      typeof dish.quantity !== "number" ||
      !Number.isInteger(dish.quantity) ||
      dish.quantity <= 0
  );
  if (invalidDish) {
    const index = dishes.indexOf(invalidDish);
    return next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  } else {
    next();
  }
}

function validateOrderIdMatch(request, response, next) {
  const { data: { id } = {} } = request.body;
  const { orderId } = request.params;
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

function validateOrderStatus(request, response, next) {
  const { data: { status } = {} } = request.body;
  const validStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  if (!status || !validStatuses.includes(status)) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
}

function validateOrderDelivered(request, response, next) {
  const order = response.locals.order; // Assuming orderExists middleware sets this
  if (order.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

function create(request, response) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = request.body;
  const newOrder = {
    id: nextId(), 
    deliverTo,
    mobileNumber,
    dishes,
  };

  orders.push(newOrder);
  response.status(201).json({ data: newOrder });
}

function list(rrequest, response) {
  response.json({ data: orders });
}

function read(request, response) {
  response.json({ data: response.locals.order });
}

function update(request, response) {
  const order = response.locals.order; 
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } =
    request.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;
  order.status = status;

  response.json({ data: order });
}

function destroy(request, response, next) {
  const { orderId } = request.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    return next({ status: 404, message: `Order not found: ${orderId}` });
  }
  const order = orders[index];
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
  orders.splice(index, 1);
  response.sendStatus(204);
}

module.exports = {
  create: [
    validateDeliverTo,
    validateMobileNumber,
    validateDishes,
    validateDishQuantity,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    validateDeliverTo,
    validateMobileNumber,
    validateDishes,
    validateDishQuantity,
    validateOrderIdMatch,
    validateOrderStatus,
    validateOrderDelivered,
    update,
  ],
  destroy: [orderExists, destroy],
};
