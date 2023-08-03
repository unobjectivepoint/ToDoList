//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://admin-agata:Test1234@cluster0.goaewje.mongodb.net/todolistDB');
const bodyParser = require("body-parser");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const today = date.getDate();

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

const item1 = new Item({ name: "Go for a walk" });
const item2 = new Item({ name: "Finish ToDoList App" });
const item3 = new Item({ name: "Walk the dog" });

const defaultItems = [item1, item2, item3];

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({ name: itemName });

  if (listName === "today") {
    await newItem.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(newItem);
    console.log("FoundList is: " + foundList);
    await foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkboxItemID = req.body.checkbox;
  const listName = req.body.listName;
  console.log("List name from hidden input: " + listName);
  if (listName === "today") {
    await Item.findByIdAndRemove(checkboxItemID);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkboxItemID } } });
    res.redirect("/" + listName);
  }
});

app.get("/", async function (req, res) {

  const foundItems = await Item.find({});

  if (foundItems.length === 0) {
    Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "today", newListItems: foundItems });
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  const checkList = await List.findOne({ name: customListName });

  if (!checkList) {
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    await list.save();
    console.log("Its in if: " + list);
    res.render("list", { listTitle: customListName, newListItems: defaultItems });
  } else {
    res.render("list", { listTitle: customListName, newListItems: checkList.items });
    console.log("Its in else: " + checkList.items);
  }
});

app.post("/:customListName", async function (req, res) {
  const newItem = new Item({ name: req.body.newItem });
  const listName = req.body.listName;
  await newItem.save();
  res.redirect("/:customListName", listName);
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
