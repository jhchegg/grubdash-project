const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function dishExists(request, response, next) {
  const { dishId } = request.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    response.locals.dish = foundDish;
    return next();
  } else {
    return next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  }
}

function validateProperties(propertyName) {
  return function (request, response, next) {
    const { data = {} } = request.body;
    if (
      data[propertyName] &&
      data[propertyName] !== "" &&
      data[propertyName] !== undefined
    ) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

function validatePrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price && Number.isInteger(price) && price > 0) {
    return next();
  } else {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
}


function create(request, response) {
  const { data: { name, description, price, image_url } = {} } = request.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  response.status(201).json({ data: newDish });
}

function list(request, response) {
  response.json({ data: dishes });
}

function read(request, response) {
  response.json({ data: response.locals.dish });
}

function update(request, response, next) {
  const { dishId } = request.params;
  const { data: { id, name, description, price, image_url } = {} } =
    request.body;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  const dish = response.locals.dish;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  response.json({ data: dish });
}

module.exports = {
  create: [
    validateProperties("name"),
    validateProperties("description"),
    validateProperties("image_url"),
    validatePrice,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    validateProperties("name"),
    validateProperties("description"),
    validateProperties("image_url"),
    validatePrice,
    update,
  ],
};
